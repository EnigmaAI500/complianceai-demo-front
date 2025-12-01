import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// External API endpoint
const EXTERNAL_API = 'http://52.172.102.172:8000/risk/batch-excel';

interface ExcelRow {
  CustomerNo?: string;
  DocumentName?: string;
  BirthCountry?: string;
  Citizenship?: string;
  RiskScore?: number;
  RiskFlag?: string;
  RiskReason?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('=== File Upload ===');
    console.log('File:', file.name, '|', file.size, 'bytes');

    // Get use_llm parameter
    const useLlm = request.nextUrl.searchParams.get('use_llm') ?? 'true';
    const apiUrl = `${EXTERNAL_API}?use_llm=${useLlm}`;

    // Read file and create FormData
    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const externalFormData = new FormData();
    externalFormData.append('file', blob, file.name);

    console.log('Sending to:', apiUrl);

    // Send to external API
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: externalFormData,
    });

    console.log('Response:', response.status, response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';

    // If response is JSON, return it directly
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If response is Excel, parse it and convert to JSON
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      console.log('Parsing Excel response...');
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);
      
      console.log('Parsed', rows.length, 'rows from Excel');

      // Map to our user risk data format
      const users = rows.map((row, index) => {
        const riskScore = Number(row.RiskScore) || 0;
        const riskFlag = String(row.RiskFlag || 'GREEN').toUpperCase();
        const riskReasons = String(row.RiskReason || '').split(';').filter(Boolean).map(s => s.trim());

        // Generate reason codes from RiskReason field
        const reasonCodes = generateReasonCodes(riskReasons, row);

        return {
          id: String(row.CustomerNo || `USR-${String(index + 1).padStart(3, '0')}`),
          name: String(row.DocumentName || 'Unknown'),
          email: `customer_${row.CustomerNo || index}@company.com`,
          riskScore,
          reasonCodes,
          aml: {
            sanctionMatch: riskReasons.some(r => r.toLowerCase().includes('sanction')),
            sanctionConfidence: riskReasons.some(r => r.toLowerCase().includes('sanction')) ? 75 : 0,
            pepMatch: riskReasons.some(r => r.toLowerCase().includes('pep')) || row.RiskFlag === 'PEP',
            adverseMedia: riskReasons.some(r => r.toLowerCase().includes('adverse') || r.toLowerCase().includes('media')),
          },
          fraud: {
            emailRisk: riskFlag === 'RED' ? 'High' : riskFlag === 'YELLOW' ? 'Medium' : 'Low',
            phoneRisk: 'Low',
          },
          network: {
            ipType: 'Unknown',
            ipCountry: String(row.BirthCountry || row.Citizenship || 'Unknown'),
            mismatch: row.BirthCountry !== row.Citizenship,
          },
          device: {
            usedBefore: false,
            botLike: false,
          },
          // Include original data for reference
          originalData: {
            customerNo: row.CustomerNo,
            documentName: row.DocumentName,
            birthCountry: row.BirthCountry,
            citizenship: row.Citizenship,
            riskFlag,
            riskReason: row.RiskReason,
          },
        };
      });

      // Calculate overall compliance score (inverse of average risk)
      const avgRisk = users.length > 0 
        ? users.reduce((sum, u) => sum + u.riskScore, 0) / users.length 
        : 0;
      const overallScore = Math.round(100 - avgRisk);

      // Calculate risk distribution
      const riskDistribution = {
        low: users.filter(u => u.riskScore <= 30).length,
        medium: users.filter(u => u.riskScore > 30 && u.riskScore <= 70).length,
        high: users.filter(u => u.riskScore > 70).length,
      };

      return NextResponse.json({
        success: true,
        overallScore,
        totalUsers: users.length,
        riskDistribution,
        users,
      });
    }

    // Unknown response type
    const text = await response.text();
    return NextResponse.json(
      { error: 'Unexpected response format', contentType, preview: text.substring(0, 200) },
      { status: 502 }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate reason codes from the API's RiskReason field
function generateReasonCodes(reasons: string[], row: ExcelRow): string[] {
  const codes: string[] = [];

  for (const reason of reasons) {
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('sanction')) codes.push('SANCTION_MATCH_POSSIBLE');
    if (lowerReason.includes('pep') || lowerReason.includes('politically')) codes.push('PEP_MATCH');
    if (lowerReason.includes('fatf')) codes.push('FATF_HIGH_RISK');
    if (lowerReason.includes('blacklist')) codes.push('BLACKLIST_MATCH');
    if (lowerReason.includes('adverse') || lowerReason.includes('media')) codes.push('ADVERSE_MEDIA');
    if (lowerReason.includes('country') || lowerReason.includes('risk')) codes.push('COUNTRY_HIGH_RISK');
    if (lowerReason.includes('document') || lowerReason.includes('passport')) codes.push('DOCUMENT_RISK');
    if (lowerReason.includes('age') || lowerReason.includes('minor')) codes.push('AGE_RISK');
  }

  // Add codes based on row data
  if (row.RiskFlag === 'PEP') codes.push('PEP_DECLARED');
  if (row.LocalBlackListFlag === 'Y') codes.push('LOCAL_BLACKLIST');

  // Remove duplicates and return
  return [...new Set(codes)].length > 0 ? [...new Set(codes)] : ['NO_FLAGS'];
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
