"use client";

import { useState, useRef, useCallback } from "react";
import Card from "../ui/Card";
import { useLanguage } from "../../lib/i18n/LanguageContext";

// API endpoint - uses local proxy to avoid CORS issues
const API_ENDPOINT = "/api/analyze?use_llm=true";

// Interface matching the actual API Excel output
interface CustomerRiskData {
  customerNo: string;
  documentName: string;
  birthCountry: string;
  citizenship: string;
  nationality?: string;
  mainAccount?: string;
  riskScore: number;
  riskFlag: "GREEN" | "YELLOW" | "RED";
  riskReason: string;
  // Additional fields from original Excel
  pinfl?: string;
  passportIssuerCode?: string;
  localBlackListFlag?: string;
  residentStatus?: string;
  district?: string;
  region?: string;
}

// Sample data for demo mode (when no API is configured)
const sampleCustomerData: CustomerRiskData[] = [
  {
    customerNo: "CUS-001",
    documentName: "John Smith",
    birthCountry: "United States",
    citizenship: "United States",
    nationality: "American",
    mainAccount: "Savings",
    riskScore: 15,
    riskFlag: "GREEN",
    riskReason: "Low risk profile; Standard customer",
  },
  {
    customerNo: "CUS-002",
    documentName: "Maria Garcia",
    birthCountry: "Russia",
    citizenship: "Russia",
    nationality: "Russian",
    mainAccount: "Business",
    riskScore: 65,
    riskFlag: "YELLOW",
    riskReason: "FATF High-Risk Country; Large transactions detected",
  },
  {
    customerNo: "CUS-003",
    documentName: "Ahmed Hassan",
    birthCountry: "Iran",
    citizenship: "UAE",
    nationality: "Emirati",
    mainAccount: "Investment",
    riskScore: 85,
    riskFlag: "RED",
    riskReason: "Sanction match possible; PEP connection; FATF blacklist country",
    localBlackListFlag: "Y",
  },
  {
    customerNo: "CUS-004",
    documentName: "Li Wei",
    birthCountry: "China",
    citizenship: "Singapore",
    nationality: "Singaporean",
    mainAccount: "Current",
    riskScore: 45,
    riskFlag: "YELLOW",
    riskReason: "Country mismatch; Enhanced due diligence required",
  },
  {
    customerNo: "CUS-005",
    documentName: "Alexander Petrov",
    birthCountry: "Belarus",
    citizenship: "Belarus",
    nationality: "Belarusian",
    mainAccount: "Premium",
    riskScore: 92,
    riskFlag: "RED",
    riskReason: "Sanction list match; FATF high risk; Adverse media found; PEP declared",
    localBlackListFlag: "Y",
  },
];

function getRiskLevel(score: number): { level: string; color: string; bgColor: string } {
  if (score <= 30) return { level: "Low", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
  if (score <= 70) return { level: "Medium", color: "text-amber-400", bgColor: "bg-amber-500/20" };
  return { level: "High", color: "text-red-400", bgColor: "bg-red-500/20" };
}

function getFlagColor(flag: string): { color: string; bgColor: string; borderColor: string } {
  switch (flag.toUpperCase()) {
    case "GREEN":
      return { color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/30" };
    case "YELLOW":
      return { color: "text-amber-400", bgColor: "bg-amber-500/20", borderColor: "border-amber-500/30" };
    case "RED":
      return { color: "text-red-400", bgColor: "bg-red-500/20", borderColor: "border-red-500/30" };
    default:
      return { color: "text-slate-400", bgColor: "bg-slate-500/20", borderColor: "border-slate-500/30" };
  }
}

export default function Demo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRiskData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [customerData, setCustomerData] = useState<CustomerRiskData[]>([]);
  const [overallScore, setOverallScore] = useState(87);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        validFiles.push(file);
      }
    });
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    } else {
      setError("Please upload Excel (.xlsx, .xls) files only. The API requires Excel format.");
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send file to API and get results
  const analyzeFiles = async () => {
    setIsAnalyzing(true);
    setError(null);
    setShowResults(false);
    setShowReport(false);

    try {
      if (uploadedFiles.length > 0) {
        const allCustomers: CustomerRiskData[] = [];
        
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', file);

          console.log('Sending file to API:', file.name);

          const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }

          const data = await response.json();
          console.log('API Response:', data);
          
          // Map API response to our data structure
          if (data.users && Array.isArray(data.users)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedCustomers = data.users.map((user: any) => {
              const originalData = user.originalData || {};
              const network = user.network || {};
              return {
                customerNo: String(user.id || user.customerNo || 'N/A'),
                documentName: String(user.name || user.documentName || 'Unknown'),
                birthCountry: String(originalData.birthCountry || network.ipCountry || 'N/A'),
                citizenship: String(originalData.citizenship || 'N/A'),
                nationality: String(originalData.nationality || ''),
                mainAccount: String(originalData.mainAccount || ''),
                riskScore: Number(user.riskScore || 0),
                riskFlag: mapRiskScoreToFlag(Number(user.riskScore || 0)),
                riskReason: Array.isArray(user.reasonCodes) 
                  ? user.reasonCodes.join('; ')
                  : String(originalData.riskReason || 'No specific risks identified'),
                pinfl: String(originalData.pinfl || ''),
                localBlackListFlag: String(originalData.localBlackListFlag || ''),
                residentStatus: String(originalData.residentStatus || ''),
                district: String(originalData.district || ''),
                region: String(originalData.region || ''),
              };
            });
            allCustomers.push(...mappedCustomers);
          }
          
          // Set overall score
          if (data.overallScore !== undefined) {
            setOverallScore(data.overallScore);
          }
        }
        
        if (allCustomers.length > 0) {
          setCustomerData(allCustomers);
        } else {
          console.log('No customers parsed from API response, using sample data');
          setCustomerData(sampleCustomerData);
          setOverallScore(65);
        }
      } else {
        // No files uploaded - use sample data for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCustomerData(sampleCustomerData);
        setOverallScore(65);
      }

      setShowResults(true);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze files. Using demo data.');
      setCustomerData(sampleCustomerData);
      setOverallScore(65);
      setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Map risk score to flag
  const mapRiskScoreToFlag = (score: number): "GREEN" | "YELLOW" | "RED" => {
    if (score <= 30) return "GREEN";
    if (score <= 70) return "YELLOW";
    return "RED";
  };

  const handleReset = () => {
    setShowResults(false);
    setIsAnalyzing(false);
    setShowReport(false);
    setSelectedCustomer(null);
    setUploadedFiles([]);
    setCustomerData([]);
    setError(null);
  };

  const handleViewReport = () => {
    setShowReport(true);
  };

  // Export as CSV matching the Excel output format
  const handleExportCSV = () => {
    const headers = [
      "CustomerNo",
      "DocumentName",
      "BirthCountry",
      "Citizenship",
      "Nationality",
      "MainAccount",
      "RiskScore",
      "RiskFlag",
      "RiskReason",
      "LocalBlackListFlag",
      "ResidentStatus",
      "District",
      "Region"
    ];
    
    const rows = customerData.map(customer => [
      customer.customerNo,
      customer.documentName,
      customer.birthCountry,
      customer.citizenship,
      customer.nationality || "",
      customer.mainAccount || "",
      customer.riskScore,
      customer.riskFlag,
      customer.riskReason,
      customer.localBlackListFlag || "",
      customer.residentStatus || "",
      customer.district || "",
      customer.region || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `risk_assessment_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Calculate risk summary
  const riskSummary = {
    total: customerData.length,
    green: customerData.filter(c => c.riskFlag === "GREEN").length,
    yellow: customerData.filter(c => c.riskFlag === "YELLOW").length,
    red: customerData.filter(c => c.riskFlag === "RED").length,
  };

  // Parse risk reasons into array
  const parseRiskReasons = (reasonString: string): string[] => {
    return reasonString.split(';').map(r => r.trim()).filter(Boolean);
  };

  return (
    <section id="demo" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
            {t.demo.badge}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t.demo.title}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {t.demo.subtitle}
          </p>
        </div>

        {/* Demo Interface */}
        {!showReport ? (
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Upload Panel */}
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {t.demo.upload.title}
              </h3>

              {/* Required Columns Info */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-blue-400 text-sm font-medium mb-2">Required Excel Columns:</h4>
                <div className="text-slate-400 text-xs space-y-1">
                  <p><span className="text-white font-mono">CustomerNo</span> - Customer identifier</p>
                  <p><span className="text-white font-mono">DocumentName</span> - Full name</p>
                  <p><span className="text-white font-mono">BirthCountry</span> - Country of birth</p>
                  <p><span className="text-white font-mono">Citizenship</span> - Citizenship</p>
                </div>
              </div>

              {/* Download Sample File */}
              <a
                href="/example_list.xlsx"
                download="example_list.xlsx"
                className="flex items-center justify-center gap-2 w-full mb-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Sample Excel Template
              </a>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer transition-all ${
                  isDragging
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 hover:border-cyan-500/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <svg className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? "text-cyan-400" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={`text-sm transition-colors ${isDragging ? "text-cyan-400" : "text-slate-400"}`}>
                  {isDragging ? "Drop files here..." : t.demo.upload.dropzone}
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  Excel files only (.xlsx, .xls)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-slate-500">Uploaded files:</p>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                            <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Files (shown when no files uploaded) */}
              {uploadedFiles.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 mb-3">{t.demo.upload.sampleLoaded}</p>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                          <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">customers_example_list.xlsx</p>
                        <p className="text-slate-500 text-xs">Excel Spreadsheet (Demo)</p>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">Sample</span>
                  </div>
                  <p className="text-xs text-slate-600 text-center mt-4">
                    Upload your Excel file or click Analyze to see demo data
                  </p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={showResults ? handleReset : analyzeFiles}
                disabled={isAnalyzing}
                className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  isAnalyzing
                    ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                    : showResults
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing with AI...
                  </>
                ) : showResults ? (
                  t.demo.button.reset
                ) : (
                  <>
                    {uploadedFiles.length > 0 ? `Analyze ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}` : t.demo.button.analyze}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </button>
            </Card>

            {/* Results Panel */}
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t.demo.results.title}
              </h3>

              {!showResults && !isAnalyzing && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-500">{t.demo.results.runAnalysis}</p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg className="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <p className="text-cyan-400 font-medium">{t.demo.results.processing}</p>
                    <p className="text-slate-500 text-sm mt-2">Checking sanctions, PEP, FATF lists...</p>
                  </div>
                </div>
              )}

              {showResults && (
                <div className="space-y-4 animate-fade-in">
                  {/* Compliance Score */}
                  <div className="bg-slate-800/50 rounded-xl p-6 text-center mb-6">
                    <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                      {overallScore}%
                    </div>
                    <p className="text-slate-400 text-sm">{t.demo.results.overallScore}</p>
                    {uploadedFiles.length > 0 && (
                      <p className="text-cyan-400 text-xs mt-2">
                        Analyzed {customerData.length} customers
                      </p>
                    )}
                  </div>

                  {/* Risk Distribution */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{riskSummary.green}</div>
                      <div className="text-emerald-400/70 text-xs">GREEN</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-amber-400">{riskSummary.yellow}</div>
                      <div className="text-amber-400/70 text-xs">YELLOW</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-400">{riskSummary.red}</div>
                      <div className="text-red-400/70 text-xs">RED</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={handleViewReport}
                    className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    {t.demo.results.viewReport}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Full Report View */
          <div className="animate-fade-in">
            {/* Report Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowReport(false)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-2xl font-bold text-white">Risk Assessment Report</h3>
                  <p className="text-slate-400 text-sm">
                    {riskSummary.total} customers analyzed • {new Date().toLocaleDateString()}
                    {uploadedFiles.length > 0 && ` • ${uploadedFiles.map(f => f.name).join(', ')}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 text-emerald-400 font-medium rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">{riskSummary.total}</div>
                <div className="text-slate-500 text-sm">Total Customers</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">{riskSummary.green}</div>
                <div className="text-emerald-400/70 text-sm">GREEN Flag</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">{riskSummary.yellow}</div>
                <div className="text-amber-400/70 text-sm">YELLOW Flag</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{riskSummary.red}</div>
                <div className="text-red-400/70 text-sm">RED Flag</div>
              </div>
            </div>

            {/* Customer Risk Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">CustomerNo</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">DocumentName</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Country</th>
                      <th className="text-center p-4 text-slate-400 font-medium text-sm">RiskScore</th>
                      <th className="text-center p-4 text-slate-400 font-medium text-sm">RiskFlag</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">RiskReason</th>
                      <th className="text-center p-4 text-slate-400 font-medium text-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.map((customer, index) => {
                      const flagStyle = getFlagColor(customer.riskFlag);
                      return (
                        <tr key={index} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <span className="text-cyan-400 font-mono text-sm">{customer.customerNo}</span>
                          </td>
                          <td className="p-4">
                            <div className="text-white font-medium">{customer.documentName}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300 text-sm">{customer.birthCountry}</div>
                            {customer.citizenship !== customer.birthCountry && (
                              <div className="text-slate-500 text-xs">Citizenship: {customer.citizenship}</div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getRiskLevel(customer.riskScore).bgColor}`}>
                              <span className={`text-lg font-bold ${getRiskLevel(customer.riskScore).color}`}>{customer.riskScore}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${flagStyle.bgColor} ${flagStyle.color} border ${flagStyle.borderColor}`}>
                              {customer.riskFlag}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {parseRiskReasons(customer.riskReason).slice(0, 2).map((reason, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
                                  {reason}
                                </span>
                              ))}
                              {parseRiskReasons(customer.riskReason).length > 2 && (
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-xs">
                                  +{parseRiskReasons(customer.riskReason).length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Detail Modal */}
            {selectedCustomer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
                <div 
                  className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-white">{selectedCustomer.documentName}</h4>
                      <p className="text-cyan-400 text-sm font-mono">{selectedCustomer.customerNo}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Risk Score & Flag */}
                    <div className="flex items-center gap-6">
                      <div className={`w-24 h-24 rounded-2xl ${getRiskLevel(selectedCustomer.riskScore).bgColor} flex flex-col items-center justify-center`}>
                        <span className={`text-4xl font-bold ${getRiskLevel(selectedCustomer.riskScore).color}`}>
                          {selectedCustomer.riskScore}
                        </span>
                        <span className={`text-xs ${getRiskLevel(selectedCustomer.riskScore).color}`}>Score</span>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Risk Flag</div>
                        <span className={`px-6 py-2 rounded-full text-lg font-bold ${getFlagColor(selectedCustomer.riskFlag).bgColor} ${getFlagColor(selectedCustomer.riskFlag).color} border ${getFlagColor(selectedCustomer.riskFlag).borderColor}`}>
                          {selectedCustomer.riskFlag}
                        </span>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        Customer Information
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Birth Country</div>
                          <div className="text-white font-medium">{selectedCustomer.birthCountry}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Citizenship</div>
                          <div className="text-white font-medium">{selectedCustomer.citizenship}</div>
                        </div>
                        {selectedCustomer.nationality && (
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-slate-400 text-xs mb-1">Nationality</div>
                            <div className="text-white font-medium">{selectedCustomer.nationality}</div>
                          </div>
                        )}
                        {selectedCustomer.mainAccount && (
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-slate-400 text-xs mb-1">Account Type</div>
                            <div className="text-white font-medium">{selectedCustomer.mainAccount}</div>
                          </div>
                        )}
                        {selectedCustomer.localBlackListFlag === 'Y' && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 col-span-2">
                            <div className="text-red-400 text-xs mb-1">⚠️ Local Blacklist Flag</div>
                            <div className="text-red-400 font-medium">YES - Customer is on local blacklist</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Risk Reasons */}
                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Risk Reasons
                      </h5>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="space-y-2">
                          {parseRiskReasons(selectedCustomer.riskReason).map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full mt-2 ${
                                reason.toLowerCase().includes('sanction') || reason.toLowerCase().includes('blacklist')
                                  ? 'bg-red-400'
                                  : reason.toLowerCase().includes('fatf') || reason.toLowerCase().includes('pep')
                                  ? 'bg-amber-400'
                                  : 'bg-slate-400'
                              }`}></span>
                              <span className="text-slate-300">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {(selectedCustomer.residentStatus || selectedCustomer.district || selectedCustomer.region) && (
                      <div>
                        <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Additional Details
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedCustomer.residentStatus && (
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-slate-400 text-xs mb-1">Resident Status</div>
                              <div className="text-white font-medium">{selectedCustomer.residentStatus}</div>
                            </div>
                          )}
                          {selectedCustomer.region && (
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-slate-400 text-xs mb-1">Region</div>
                              <div className="text-white font-medium">{selectedCustomer.region}</div>
                            </div>
                          )}
                          {selectedCustomer.district && (
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-slate-400 text-xs mb-1">District</div>
                              <div className="text-white font-medium">{selectedCustomer.district}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-slate-800 text-white font-medium rounded-full border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                Run New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
