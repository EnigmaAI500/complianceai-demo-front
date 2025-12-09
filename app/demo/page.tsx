"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// API endpoint
const API_ENDPOINT = "/api/analyze?use_llm=true";

// Types matching the new API response
interface Tag {
  code: string;
  label?: string;
  severity: string;
  source?: string;
  evidence?: Record<string, unknown>;
}

interface RecommendedAction {
  action: string;
  urgency: string;
  reason: string;
}

interface CustomerData {
  customerNo: string;
  fullName: string;
  citizenship: string;
  nationality?: string;
  birthCountry: string;
  document?: {
    type: string;
    number: string;
    serial?: string;
    issuer?: { code: string; place: string };
    issuerCode?: string;
    issuerPlace?: string;
    expiryDate?: string;
  };
  residency?: {
    residentStatus: string;
    district?: string;
    region?: string;
    locality?: string;
    street?: string;
    addressCode?: string;
  };
  business_profile?: {
    mainAccount?: string;
    mainAccountCategory?: string | null;
    categoryRisk?: string | null;
  };
  risk: {
    score: number;
    riskLevel: string;
    confidence?: number;
    riskDrivers?: string[];
    breakdown?: {
      sanctions?: number;
      pep?: number;
      digitalFootprint?: number;
      device?: number;
      profile?: number;
    };
  };
  tags: Tag[];
  recommendedActions?: RecommendedAction[];
  rawInput?: Record<string, unknown>;
}

interface ApiResponse {
  report_id: string;
  generated_at: string;
  file: {
    filename: string;
    rows_processed: number;
    missing_optional_fields?: string[];
    upload_country?: string;
    validation: {
      status: string;
      errors: string[];
      warnings: string[];
    };
  };
  summary: {
    total_customers: number;
    risk_distribution: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
    avg_score: number;
    top_risk_drivers: string[];
    flags_count: Record<string, number>;
  };
  customers: CustomerData[];
  exports?: {
    pdf?: string;
    excel?: string;
    json?: string;
  };
  engine_info?: {
    version: string;
    data_sources: string[];
    scoring_model: string;
    definitions_version?: string;
  };
}

// Risk Level Ranges: LOW (0-30), MEDIUM (31-60), HIGH (61-85), CRITICAL (86-100)
function getRiskLevelFromScore(score: number): string {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 85) return "HIGH";
  return "CRITICAL";
}

function getRiskColor(level: string) {
  switch (level.toUpperCase()) {
    case "LOW": return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500" };
    case "MEDIUM": return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" };
    case "HIGH": return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", dot: "bg-orange-500" };
    case "CRITICAL": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", dot: "bg-red-500" };
    default: return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", dot: "bg-gray-500" };
  }
}

function getSeverityColor(severity: string) {
  switch (severity.toUpperCase()) {
    case "LOW": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
    case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// Chat message interface
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Loading steps for the analysis process
const LOADING_STEPS = [
  { id: 1, label: "Uploading file", duration: 2000 },
  { id: 2, label: "Parsing customer data", duration: 3000 },
  { id: 3, label: "Running sanctions screening", duration: 4000 },
  { id: 4, label: "Checking PEP databases", duration: 3000 },
  { id: 5, label: "Analyzing risk factors", duration: 4000 },
  { id: 6, label: "Generating AI insights", duration: 3000 },
  { id: 7, label: "Preparing report", duration: 2000 },
];

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState<"upload" | "results" | "history">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<ApiResponse | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisHistory, setAnalysisHistory] = useState<{ id: string; date: string; customers: number; }[]>([]);
  
  // Loading state
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your Compliance AI Assistant. I can help you understand the risk analysis results, explain risk factors, or answer questions about specific customers. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Loading progress simulation
  useEffect(() => {
    if (isAnalyzing) {
      setLoadingStep(0);
      setLoadingProgress(0);
      
      let currentStep = 0;
      let progress = 0;
      
      loadingIntervalRef.current = setInterval(() => {
        progress += 1;
        setLoadingProgress(Math.min(progress, 95)); // Cap at 95% until complete
        
        // Advance step based on progress
        const stepThreshold = Math.floor((progress / 100) * LOADING_STEPS.length);
        if (stepThreshold > currentStep && stepThreshold < LOADING_STEPS.length) {
          currentStep = stepThreshold;
          setLoadingStep(currentStep);
        }
      }, 200); // Update every 200ms for ~20 seconds total
      
      return () => {
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
        }
      };
    } else {
      // When analysis completes, jump to 100%
      if (loadingProgress > 0) {
        setLoadingProgress(100);
        setLoadingStep(LOADING_STEPS.length);
        setTimeout(() => {
          setLoadingProgress(0);
          setLoadingStep(0);
        }, 500);
      }
    }
  }, [isAnalyzing]);

  // AI Chat response generator
  const generateAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    // If no report data yet
    if (!reportData) {
      if (msg.includes("help") || msg.includes("what can you do")) {
        return "I can help you analyze compliance risks once you upload a customer data file. Try uploading an Excel file or click 'Run Demo Analysis' to see sample results!";
      }
      return "Please upload a customer data file first, or run the demo analysis. Once we have data, I can help you understand risk scores, explain flags, and provide recommendations.";
    }

    // Questions about summary/overview
    if (msg.includes("summary") || msg.includes("overview") || msg.includes("how many")) {
      const { summary } = reportData;
      return `📊 **Analysis Summary:**\n\n• **Total Customers:** ${summary.total_customers}\n• **Average Risk Score:** ${summary.avg_score}\n• **Risk Distribution:**\n  - 🟢 LOW: ${summary.risk_distribution.LOW}\n  - 🟡 MEDIUM: ${summary.risk_distribution.MEDIUM}\n  - 🟠 HIGH: ${summary.risk_distribution.HIGH}\n  - 🔴 CRITICAL: ${summary.risk_distribution.CRITICAL}\n\nTop risk drivers: ${summary.top_risk_drivers.slice(0, 2).join(", ")}`;
    }

    // Questions about high risk customers
    if (msg.includes("high risk") || msg.includes("critical") || msg.includes("dangerous") || msg.includes("risky")) {
      const highRisk = reportData.customers.filter(c => c.risk.score > 60);
      if (highRisk.length === 0) {
        return "Great news! There are no high-risk customers in this analysis. All customers have scores below 61.";
      }
      const list = highRisk.map(c => `• **${c.fullName}** (${c.citizenship}) - Score: ${c.risk.score} (${c.risk.riskLevel})`).join("\n");
      return `⚠️ **High Risk Customers (${highRisk.length}):**\n\n${list}\n\nThese customers require Enhanced Due Diligence (EDD). Click on any customer in the table to see detailed risk breakdown.`;
    }

    // Questions about specific flags
    if (msg.includes("fatf") || msg.includes("sanction")) {
      const fatfCustomers = reportData.customers.filter(c => c.tags.some(t => t.code.includes("FATF")));
      return `🌍 **FATF Risk Analysis:**\n\nFATF (Financial Action Task Force) flags indicate customers from jurisdictions with weak AML controls.\n\n**Flagged Customers:** ${fatfCustomers.length}\n${fatfCustomers.map(c => `• ${c.fullName} (${c.citizenship})`).join("\n")}\n\n**Recommendation:** Apply Enhanced Due Diligence for all FATF-flagged customers.`;
    }

    if (msg.includes("pep")) {
      const pepCustomers = reportData.customers.filter(c => c.tags.some(t => t.code.includes("PEP")));
      return `👔 **PEP (Politically Exposed Person) Analysis:**\n\nPEP flags indicate potential connections to government officials or their associates.\n\n**Flagged Customers:** ${pepCustomers.length}\n${pepCustomers.length > 0 ? pepCustomers.map(c => `• ${c.fullName}`).join("\n") : "None detected"}\n\n**Recommendation:** PEP customers require ongoing monitoring and senior management approval.`;
    }

    // Questions about recommendations
    if (msg.includes("recommend") || msg.includes("what should") || msg.includes("action") || msg.includes("next step")) {
      const criticalCount = reportData.customers.filter(c => c.risk.score >= 86).length;
      const highCount = reportData.customers.filter(c => c.risk.score >= 61 && c.risk.score < 86).length;
      
      let response = "📋 **Recommended Actions:**\n\n";
      if (criticalCount > 0) {
        response += `🔴 **CRITICAL (${criticalCount}):** Immediate escalation required. Consider blocking transactions pending review.\n\n`;
      }
      if (highCount > 0) {
        response += `🟠 **HIGH RISK (${highCount}):** Conduct Enhanced Due Diligence within 48 hours. Request additional documentation.\n\n`;
      }
      response += "🟢 **LOW RISK:** Standard monitoring. Periodic review during account lifecycle.";
      return response;
    }

    // Questions about specific customer
    const customerMatch = reportData.customers.find(c => 
      msg.includes(c.fullName.toLowerCase()) || 
      msg.includes(c.customerNo.toLowerCase())
    );
    if (customerMatch) {
      return `📄 **Customer Profile: ${customerMatch.fullName}**\n\n• **ID:** ${customerMatch.customerNo}\n• **Citizenship:** ${customerMatch.citizenship}\n• **Country:** ${customerMatch.birthCountry}\n• **Risk Score:** ${customerMatch.risk.score} (${customerMatch.risk.riskLevel})\n• **Confidence:** ${customerMatch.risk.confidence ? Math.round(customerMatch.risk.confidence * 100) + "%" : "N/A"}\n\n**Tags:** ${customerMatch.tags.map(t => t.label || t.code).join(", ")}\n\n${customerMatch.risk.riskDrivers ? "**Risk Drivers:**\n" + customerMatch.risk.riskDrivers.map(d => "• " + d).join("\n") : ""}`;
    }

    // Help question
    if (msg.includes("help") || msg.includes("what can you")) {
      return "I can help you with:\n\n• 📊 **Summary** - Get an overview of the analysis\n• ⚠️ **High Risk** - List high-risk customers\n• 🌍 **FATF** - Explain FATF flags\n• 👔 **PEP** - Explain PEP matches\n• 📋 **Recommendations** - Get action items\n• 👤 **[Customer Name]** - Get details about a specific customer\n\nJust ask your question naturally!";
    }

    // Default response
    return "I can help you understand the compliance analysis. Try asking about:\n• Summary or overview\n• High-risk customers\n• FATF or sanction risks\n• PEP matches\n• Recommendations\n• Specific customer by name";
  };

  // Handle chat submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(chatInput),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    } else {
      setError("Please upload Excel files (.xlsx, .xls) only");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const removeFile = (index: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  const analyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload a file first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create FormData with the uploaded file
      const formData = new FormData();
      formData.append('file', uploadedFiles[0]);

      // Call the API endpoint
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const responseData: ApiResponse = await response.json();
      
      // Sort customers by risk level (CRITICAL first, then HIGH, MEDIUM, LOW)
      const riskOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      responseData.customers.sort((a, b) => {
        const aLevel = getRiskLevelFromScore(a.risk.score);
        const bLevel = getRiskLevelFromScore(b.risk.score);
        if (riskOrder[aLevel] !== riskOrder[bLevel]) {
          return riskOrder[aLevel] - riskOrder[bLevel];
        }
        return b.risk.score - a.risk.score; // Higher score first within same level
      });
      
      setReportData(responseData);
      setAnalysisHistory(prev => [...prev, {
        id: responseData.report_id + '_' + Date.now(),
        date: new Date().toLocaleString(),
        customers: responseData.summary.total_customers,
      }]);
      setActiveTab("results");
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = ["CustomerNo", "FullName", "Citizenship", "BirthCountry", "RiskScore", "RiskLevel", "Tags"];
    const rows = reportData.customers.map(c => [
      c.customerNo, c.fullName, c.citizenship, c.birthCountry, 
      c.risk.score, c.risk.riskLevel, c.tags.map(t => t.code).join('; ')
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportData.report_id}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/30">
                CA
              </span>
              Compliance Analysis
            </h2>
            <p className="text-gray-500 text-xs mt-1">AI-Powered Screening</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "upload", label: "Upload Data", icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
              { id: "results", label: "Results", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { id: "history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as "upload" | "results" | "history")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
                {item.id === "results" && reportData && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded-full font-semibold">
                    {reportData.summary.total_customers}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Risk Levels</p>
            <div className="space-y-2">
              {[
                { level: "LOW", range: "0-30", color: "bg-emerald-500" },
                { level: "MEDIUM", range: "31-60", color: "bg-amber-500" },
                { level: "HIGH", range: "61-85", color: "bg-orange-500" },
                { level: "CRITICAL", range: "86-100", color: "bg-red-500" },
              ].map(item => (
                <div key={item.level} className="flex items-center gap-2 text-xs">
                  <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                  <span className="text-gray-600">{item.level} ({item.range})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Video Section */}
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Demo Video</p>
            <a
              href="https://www.youtube.com/watch?v=Uv7GNXlYCMw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group border border-red-100"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <p className="text-red-700 text-sm font-medium">Watch Demo</p>
                <p className="text-red-500 text-xs">See how it works</p>
              </div>
              <svg className="w-4 h-4 text-red-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* API Documentation Section */}
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">API Documentation</p>
            <a
              href="http://52.172.102.172:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors group border border-violet-100"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-violet-700 text-sm font-medium">API Docs</p>
                <p className="text-violet-500 text-xs">Swagger / OpenAPI</p>
              </div>
              <svg className="w-4 h-4 text-violet-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {/* Top Bar */}
          <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {activeTab === "upload" && "Upload Customer Data"}
                  {activeTab === "results" && "Analysis Results"}
                  {activeTab === "history" && "Analysis History"}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeTab === "upload" && "Upload Excel file for compliance screening"}
                  {activeTab === "results" && reportData && `Report: ${reportData.report_id}`}
                  {activeTab === "history" && `${analysisHistory.length} reports generated`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === "results" && reportData && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                )}
                <div className="lg:hidden flex bg-gray-100 rounded-lg p-1">
                  {["upload", "results"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as "upload" | "results")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                        activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="text-blue-700 text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Required Excel Columns
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {["CustomerNo", "DocumentName", "BirthCountry", "Citizenship"].map(col => (
                      <code key={col} className="bg-white px-2 py-1 rounded text-blue-700 border border-blue-200">{col}</code>
                    ))}
                  </div>
                </div>

                <a href="/example_list.xlsx" download className="flex items-center justify-center gap-2 w-full mb-6 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Sample Template
                </a>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    isDragging ? "border-cyan-500 bg-cyan-50" : "border-gray-300 hover:border-cyan-400 bg-white"
                  }`}
                >
                  <input ref={fileInputRef} type="file" multiple accept=".xlsx,.xls" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDragging ? "bg-cyan-100" : "bg-gray-100"}`}>
                    <svg className={`w-8 h-8 ${isDragging ? "text-cyan-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className={`text-sm font-medium ${isDragging ? "text-cyan-700" : "text-gray-700"}`}>
                    {isDragging ? "Drop files here" : "Drag & drop Excel files here"}
                  </p>
                  <p className="text-gray-400 text-xs mt-4">.xlsx, .xls files supported</p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{file.name}</p>
                            <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(index)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!isAnalyzing ? (
                  <button
                    onClick={analyzeFiles}
                    className="w-full mt-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {uploadedFiles.length > 0 ? `Analyze ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}` : "Run Demo Analysis"}
                  </button>
                ) : (
                  /* Enhanced Loading State */
                  <div className="mt-6 bg-gradient-to-br from-slate-50 to-cyan-50 border border-cyan-100 rounded-2xl p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-ping"></div>
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold">AI Compliance Analysis</h3>
                          <p className="text-sm text-gray-500">Processing your data...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-600">{loadingProgress}%</div>
                        <div className="text-xs text-gray-400">~{Math.max(1, Math.ceil((100 - loadingProgress) / 5))}s remaining</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="grid grid-cols-1 gap-2">
                      {LOADING_STEPS.map((step, index) => {
                        const isCompleted = index < loadingStep;
                        const isCurrent = index === loadingStep;
                        return (
                          <div 
                            key={step.id} 
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                              isCurrent ? 'bg-cyan-100 border border-cyan-200' : isCompleted ? 'bg-emerald-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-cyan-500' : 'bg-gray-300'
                            }`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : isCurrent ? (
                                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <span className="text-xs text-white font-medium">{index + 1}</span>
                              )}
                            </div>
                            <span className={`text-sm ${
                              isCurrent ? 'text-cyan-700 font-medium' : isCompleted ? 'text-emerald-700' : 'text-gray-400'
                            }`}>
                              {step.label}
                              {isCurrent && <span className="ml-2 animate-pulse">...</span>}
                            </span>
                            {isCompleted && (
                              <span className="ml-auto text-xs text-emerald-600 font-medium">Done</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Fun Facts */}
                    <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Did you know?</p>
                          <p className="text-sm text-gray-700">
                            {loadingStep <= 2 && "Our AI analyzes over 50+ risk indicators per customer including sanctions lists, PEP databases, and adverse media."}
                            {loadingStep === 3 && "We check against OFAC, UN, EU, and 200+ other sanctions lists in real-time."}
                            {loadingStep === 4 && "Our PEP database covers 1.5M+ politically exposed persons across 200 countries."}
                            {loadingStep === 5 && "Risk scoring uses a weighted algorithm combining ML predictions with rule-based analysis."}
                            {loadingStep >= 6 && "AI-powered insights help identify complex risk patterns that traditional systems might miss."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results Tab */}
            {activeTab === "results" && reportData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{reportData.summary.total_customers}</div>
                    <div className="text-xs text-gray-500">Total Customers</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-cyan-600">{reportData.summary.avg_score}</div>
                    <div className="text-xs text-gray-500">Avg. Score</div>
                  </div>
                  {Object.entries(reportData.summary.risk_distribution).map(([level, count]) => {
                    const colors = getRiskColor(level);
                    return (
                      <div key={level} className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
                        <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
                        <div className={`text-xs ${colors.text} opacity-80`}>{level}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Top Risk Drivers */}
                {reportData.summary.top_risk_drivers.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Risk Drivers</h3>
                    <div className="flex flex-wrap gap-2">
                      {reportData.summary.top_risk_drivers.map((driver, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                          {driver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flags Summary */}
                {Object.keys(reportData.summary.flags_count).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Flags Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(reportData.summary.flags_count).map(([flag, count]) => (
                        <div key={flag} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600 font-mono">{flag}</span>
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-4 text-gray-600 font-semibold text-xs uppercase">Customer</th>
                          <th className="text-left p-4 text-gray-600 font-semibold text-xs uppercase">Country</th>
                          <th className="text-center p-4 text-gray-600 font-semibold text-xs uppercase">Score</th>
                          <th className="text-center p-4 text-gray-600 font-semibold text-xs uppercase">Level</th>
                          <th className="text-left p-4 text-gray-600 font-semibold text-xs uppercase">Tags</th>
                          <th className="text-center p-4 text-gray-600 font-semibold text-xs uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.customers.map((customer, index) => {
                          const riskColor = getRiskColor(customer.risk.riskLevel);
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${riskColor.bg} ${riskColor.text}`}>
                                    {customer.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </div>
                                  <div>
                                    <div className="text-gray-900 font-medium text-sm">{customer.fullName}</div>
                                    <div className="text-gray-500 text-xs font-mono">{customer.customerNo}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-gray-700 text-sm">{customer.birthCountry}</div>
                                <div className="text-gray-500 text-xs">{customer.citizenship}</div>
                              </td>
                              <td className="p-4 text-center">
                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${riskColor.bg} ${riskColor.text}`}>
                                  {customer.risk.score}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskColor.bg} ${riskColor.text} border ${riskColor.border}`}>
                                  {customer.risk.riskLevel}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {customer.tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className={`px-2 py-0.5 text-xs rounded border ${getSeverityColor(tag.severity)}`}>
                                      {tag.code}
                                    </span>
                                  ))}
                                  {customer.tags.length > 2 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">+{customer.tags.length - 2}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => setSelectedCustomer(customer)} className="p-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Engine Info */}
                {reportData.engine_info && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
                    <span className="font-medium">Engine:</span> {reportData.engine_info.version} | 
                    <span className="font-medium ml-2">Sources:</span> {reportData.engine_info.data_sources?.join(', ')}
                  </div>
                )}
              </div>
            )}

            {activeTab === "results" && !reportData && (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No analysis results yet</p>
                <button onClick={() => setActiveTab("upload")} className="px-6 py-2 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-lg hover:bg-cyan-100 border border-cyan-200">
                  Upload Data to Start
                </button>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="max-w-2xl mx-auto">
                {analysisHistory.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No analysis history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisHistory.map((item, index) => (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{item.customers} customers analyzed</p>
                            <p className="text-gray-500 text-xs font-mono">{item.id} • {item.date}</p>
                          </div>
                        </div>
                        <span className="text-emerald-700 text-xs font-medium px-2 py-1 bg-emerald-50 rounded border border-emerald-200">Completed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{selectedCustomer.fullName}</h4>
                <p className="text-cyan-600 text-sm font-mono">{selectedCustomer.customerNo}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Risk Score & Level */}
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${getRiskColor(selectedCustomer.risk.riskLevel).bg}`}>
                  <span className={`text-3xl font-bold ${getRiskColor(selectedCustomer.risk.riskLevel).text}`}>{selectedCustomer.risk.score}</span>
                  <span className={`text-xs ${getRiskColor(selectedCustomer.risk.riskLevel).text}`}>Score</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Risk Level</p>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getRiskColor(selectedCustomer.risk.riskLevel).bg} ${getRiskColor(selectedCustomer.risk.riskLevel).text} border ${getRiskColor(selectedCustomer.risk.riskLevel).border}`}>
                    {selectedCustomer.risk.riskLevel}
                  </span>
                  {selectedCustomer.risk.confidence && (
                    <p className="text-gray-400 text-xs mt-1">{Math.round(selectedCustomer.risk.confidence * 100)}% confidence</p>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-gray-500 text-xs mb-1">Birth Country</p>
                  <p className="text-gray-900 text-sm font-medium">{selectedCustomer.birthCountry}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-gray-500 text-xs mb-1">Citizenship</p>
                  <p className="text-gray-900 text-sm font-medium">{selectedCustomer.citizenship}</p>
                </div>
              </div>

              {/* Business Profile */}
              {selectedCustomer.business_profile && (selectedCustomer.business_profile.mainAccount || selectedCustomer.business_profile.mainAccountCategory) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-700 text-xs mb-1">Business Category</p>
                  <p className="text-amber-800 text-sm font-medium capitalize">
                    {(selectedCustomer.business_profile.mainAccount || selectedCustomer.business_profile.mainAccountCategory || 'N/A').replace(/_/g, ' ')}
                  </p>
                  {selectedCustomer.business_profile.categoryRisk && (
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${getSeverityColor(selectedCustomer.business_profile.categoryRisk)}`}>
                      {selectedCustomer.business_profile.categoryRisk} RISK
                    </span>
                  )}
                </div>
              )}

              {/* Risk Drivers */}
              {selectedCustomer.risk.riskDrivers && selectedCustomer.risk.riskDrivers.length > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-2 font-medium">Risk Drivers</p>
                  <div className="space-y-1">
                    {selectedCustomer.risk.riskDrivers.map((driver, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></span>
                        <span className="text-gray-700">{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Breakdown */}
              {selectedCustomer.risk.breakdown && (
                <div>
                  <p className="text-gray-600 text-sm mb-2 font-medium">Risk Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(selectedCustomer.risk.breakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-24 capitalize">{key}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${value}%` }}></div>
                        </div>
                        <span className="text-gray-700 text-xs font-medium w-8">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <p className="text-gray-600 text-sm mb-2 font-medium">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag, i) => (
                    <span key={i} className={`px-3 py-1 text-xs rounded-full border ${getSeverityColor(tag.severity)}`}>
                      {tag.label || tag.code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              {selectedCustomer.recommendedActions && selectedCustomer.recommendedActions.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-medium mb-2">⚠️ Recommended Actions</p>
                  {selectedCustomer.recommendedActions.map((action, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-red-800 font-medium">{action.action}</p>
                      <p className="text-red-600 text-xs">{action.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Compliance AI Assistant</h4>
                  <p className="text-cyan-100 text-xs">Ask me about the analysis</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md"
                        : "bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-xs mt-1 ${msg.role === "user" ? "text-cyan-100" : "text-gray-400"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["Summary", "High Risk", "Recommendations", "Help"].map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      setChatInput(action);
                      handleChatSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full whitespace-nowrap transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about the analysis..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isChatOpen 
              ? "bg-gray-600 hover:bg-gray-700" 
              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 hover:shadow-xl"
          }`}
        >
          {isChatOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {/* Notification Badge */}
        {!isChatOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            AI
          </span>
        )}
      </div>
    </div>
  );
}
