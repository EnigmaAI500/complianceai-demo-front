"use client";

import { useState, useRef, useCallback } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

// API endpoint
const API_ENDPOINT = "/api/analyze?use_llm=true";

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
  pinfl?: string;
  localBlackListFlag?: string;
  residentStatus?: string;
  district?: string;
  region?: string;
}

// Sample data
const sampleCustomerData: CustomerRiskData[] = [
  {
    customerNo: "CUS-001",
    documentName: "John Smith",
    birthCountry: "United States",
    citizenship: "United States",
    riskScore: 15,
    riskFlag: "GREEN",
    riskReason: "Low risk profile; Standard customer",
  },
  {
    customerNo: "CUS-002",
    documentName: "Maria Garcia",
    birthCountry: "Russia",
    citizenship: "Russia",
    riskScore: 65,
    riskFlag: "YELLOW",
    riskReason: "FATF High-Risk Country; Large transactions detected",
  },
  {
    customerNo: "CUS-003",
    documentName: "Ahmed Hassan",
    birthCountry: "Iran",
    citizenship: "UAE",
    riskScore: 85,
    riskFlag: "RED",
    riskReason: "Sanction match possible; PEP connection; FATF blacklist country",
    localBlackListFlag: "Y",
  },
];

function getFlagColor(flag: string) {
  switch (flag.toUpperCase()) {
    case "GREEN": return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
    case "YELLOW": return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" };
    case "RED": return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" };
    default: return { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" };
  }
}

export default function DemoDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"upload" | "results" | "history">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerRiskData[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRiskData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisHistory, setAnalysisHistory] = useState<{ date: string; files: number; customers: number; }[]>([]);

  // Stats
  const stats = {
    total: customerData.length,
    green: customerData.filter(c => c.riskFlag === "GREEN").length,
    yellow: customerData.filter(c => c.riskFlag === "YELLOW").length,
    red: customerData.filter(c => c.riskFlag === "RED").length,
    avgScore: customerData.length > 0 
      ? Math.round(customerData.reduce((sum, c) => sum + c.riskScore, 0) / customerData.length)
      : 0,
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

  const mapRiskScoreToFlag = (score: number): "GREEN" | "YELLOW" | "RED" => {
    if (score <= 30) return "GREEN";
    if (score <= 70) return "YELLOW";
    return "RED";
  };

  const analyzeFiles = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      if (uploadedFiles.length > 0) {
        const allCustomers: CustomerRiskData[] = [];
        
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(API_ENDPOINT, { method: 'POST', body: formData });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }

          const data = await response.json();
          
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
                riskScore: Number(user.riskScore || 0),
                riskFlag: mapRiskScoreToFlag(Number(user.riskScore || 0)),
                riskReason: Array.isArray(user.reasonCodes) 
                  ? user.reasonCodes.join('; ')
                  : String(originalData.riskReason || 'No specific risks'),
                localBlackListFlag: String(originalData.localBlackListFlag || ''),
              };
            });
            allCustomers.push(...mappedCustomers);
          }
        }
        
        if (allCustomers.length > 0) {
          setCustomerData(allCustomers);
          setAnalysisHistory(prev => [...prev, {
            date: new Date().toLocaleString(),
            files: uploadedFiles.length,
            customers: allCustomers.length,
          }]);
          setActiveTab("results");
        } else {
          setCustomerData(sampleCustomerData);
          setActiveTab("results");
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCustomerData(sampleCustomerData);
        setAnalysisHistory(prev => [...prev, {
          date: new Date().toLocaleString(),
          files: 1,
          customers: sampleCustomerData.length,
        }]);
        setActiveTab("results");
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setCustomerData(sampleCustomerData);
      setActiveTab("results");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["CustomerNo", "DocumentName", "BirthCountry", "Citizenship", "RiskScore", "RiskFlag", "RiskReason"];
    const rows = customerData.map(c => [c.customerNo, c.documentName, c.birthCountry, c.citizenship, c.riskScore, c.riskFlag, c.riskReason]);
    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `risk_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const parseReasons = (s: string) => s.split(';').map(r => r.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      {/* Dashboard Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-slate-900/50 border-r border-slate-800">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                RA
              </span>
              Risk Analysis
            </h2>
            <p className="text-slate-500 text-xs mt-1">AI-Powered Screening</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => setActiveTab("upload")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "upload"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Data
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "results"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Results
              {customerData.length > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                  {customerData.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </nav>

          {/* Sidebar Footer - Risk Legend */}
          <div className="p-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-3 font-medium">RISK LEVELS</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">GREEN (0-30)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-400">YELLOW (31-70)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-400">RED (71-100)</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {/* Top Bar */}
          <div className="sticky top-16 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">
                  {activeTab === "upload" && "Upload Customer Data"}
                  {activeTab === "results" && "Analysis Results"}
                  {activeTab === "history" && "Analysis History"}
                </h1>
                <p className="text-sm text-slate-500">
                  {activeTab === "upload" && "Upload Excel file with customer data for risk screening"}
                  {activeTab === "results" && `${stats.total} customers analyzed`}
                  {activeTab === "history" && `${analysisHistory.length} analyses completed`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === "results" && customerData.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                )}
                {/* Mobile Tab Buttons */}
                <div className="lg:hidden flex bg-slate-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTab === "upload" ? "bg-cyan-500 text-white" : "text-slate-400"
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => setActiveTab("results")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTab === "results" ? "bg-cyan-500 text-white" : "text-slate-400"
                    }`}
                  >
                    Results
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Stats Cards (shown when there are results) */}
            {customerData.length > 0 && activeTab === "results" && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-slate-500">Total Customers</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-emerald-400">{stats.green}</div>
                  <div className="text-xs text-emerald-400/70">Low Risk</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-amber-400">{stats.yellow}</div>
                  <div className="text-xs text-amber-400/70">Medium Risk</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-400">{stats.red}</div>
                  <div className="text-xs text-red-400/70">High Risk</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-cyan-400">{stats.avgScore}</div>
                  <div className="text-xs text-slate-500">Avg. Score</div>
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="max-w-3xl mx-auto">
                {/* Required Columns */}
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h3 className="text-blue-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Required Excel Columns
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <code className="bg-slate-800/50 px-2 py-1 rounded text-cyan-300">CustomerNo</code>
                    <code className="bg-slate-800/50 px-2 py-1 rounded text-cyan-300">DocumentName</code>
                    <code className="bg-slate-800/50 px-2 py-1 rounded text-cyan-300">BirthCountry</code>
                    <code className="bg-slate-800/50 px-2 py-1 rounded text-cyan-300">Citizenship</code>
                  </div>
                </div>

                {/* Download Sample */}
                <a
                  href="/example_list.xlsx"
                  download
                  className="flex items-center justify-center gap-2 w-full mb-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Sample Template
                </a>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    isDragging ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 hover:border-cyan-500/50 bg-slate-900/30"
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
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                    isDragging ? "bg-cyan-500/20" : "bg-slate-800"
                  }`}>
                    <svg className={`w-8 h-8 ${isDragging ? "text-cyan-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className={`text-sm font-medium ${isDragging ? "text-cyan-400" : "text-slate-300"}`}>
                    {isDragging ? "Drop files here" : "Drag & drop Excel files here"}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">or click to browse</p>
                  <p className="text-slate-600 text-xs mt-4">.xlsx, .xls files supported</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm text-slate-500 mb-2">Ready to analyze:</p>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{file.name}</p>
                            <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(index)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={analyzeFiles}
                  disabled={isAnalyzing}
                  className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isAnalyzing
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {uploadedFiles.length > 0 ? `Analyze ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}` : "Run Demo Analysis"}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === "results" && (
              <>
                {customerData.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-400 mb-4">No analysis results yet</p>
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="px-6 py-2 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                      Upload Data to Start
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-800/50">
                            <th className="text-left p-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Customer</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Country</th>
                            <th className="text-center p-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Score</th>
                            <th className="text-center p-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Flag</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Reasons</th>
                            <th className="text-center p-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerData.map((customer, index) => {
                            const flagStyle = getFlagColor(customer.riskFlag);
                            return (
                              <tr key={index} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${flagStyle.bg} ${flagStyle.text}`}>
                                      {customer.documentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                      <div className="text-white font-medium text-sm">{customer.documentName}</div>
                                      <div className="text-slate-500 text-xs font-mono">{customer.customerNo}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="text-slate-300 text-sm">{customer.birthCountry}</div>
                                  {customer.citizenship !== customer.birthCountry && (
                                    <div className="text-slate-500 text-xs">{customer.citizenship}</div>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${flagStyle.bg} ${flagStyle.text}`}>
                                    {customer.riskScore}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${flagStyle.bg} ${flagStyle.text} border ${flagStyle.border}`}>
                                    {customer.riskFlag}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {parseReasons(customer.riskReason).slice(0, 2).map((r, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs truncate max-w-[120px]">
                                        {r}
                                      </span>
                                    ))}
                                    {parseReasons(customer.riskReason).length > 2 && (
                                      <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-xs">
                                        +{parseReasons(customer.riskReason).length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                  >
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
                )}
              </>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="max-w-2xl mx-auto">
                {analysisHistory.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-400">No analysis history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisHistory.map((item, index) => (
                      <div key={index} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{item.customers} customers analyzed</p>
                            <p className="text-slate-500 text-xs">{item.files} file(s) • {item.date}</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-500/10 rounded">Completed</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">{selectedCustomer.documentName}</h4>
                <p className="text-cyan-400 text-sm font-mono">{selectedCustomer.customerNo}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Risk Score */}
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${getFlagColor(selectedCustomer.riskFlag).bg}`}>
                  <span className={`text-3xl font-bold ${getFlagColor(selectedCustomer.riskFlag).text}`}>{selectedCustomer.riskScore}</span>
                  <span className={`text-xs ${getFlagColor(selectedCustomer.riskFlag).text}`}>Score</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Risk Level</p>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getFlagColor(selectedCustomer.riskFlag).bg} ${getFlagColor(selectedCustomer.riskFlag).text} border ${getFlagColor(selectedCustomer.riskFlag).border}`}>
                    {selectedCustomer.riskFlag}
                  </span>
                </div>
              </div>
              
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">Birth Country</p>
                  <p className="text-white text-sm font-medium">{selectedCustomer.birthCountry}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">Citizenship</p>
                  <p className="text-white text-sm font-medium">{selectedCustomer.citizenship}</p>
                </div>
              </div>

              {/* Blacklist */}
              {selectedCustomer.localBlackListFlag === 'Y' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">⚠️ On Local Blacklist</p>
                </div>
              )}

              {/* Reasons */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Risk Reasons</p>
                <div className="space-y-2">
                  {parseReasons(selectedCustomer.riskReason).map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        reason.toLowerCase().includes('sanction') || reason.toLowerCase().includes('blacklist') ? 'bg-red-400' :
                        reason.toLowerCase().includes('fatf') || reason.toLowerCase().includes('pep') ? 'bg-amber-400' : 'bg-slate-400'
                      }`}></span>
                      <span className="text-slate-300">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
