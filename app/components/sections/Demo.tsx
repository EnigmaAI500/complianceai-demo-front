"use client";

import { useState } from "react";
import Card from "../ui/Card";
import { useLanguage } from "../../lib/i18n/LanguageContext";

const sampleDocuments = [
  { name: "GDPR_Policy_2024.pdf", type: "Policy Document" },
  { name: "SOC2_Controls.xlsx", type: "Control Matrix" },
  { name: "Risk_Assessment.docx", type: "Assessment Report" },
];

const analysisResults = [
  { icon: "✓", label: "GDPR Compliance", status: "Compliant", color: "text-emerald-400" },
  { icon: "!", label: "SOC 2 Type II", status: "3 Issues Found", color: "text-amber-400" },
  { icon: "✓", label: "ISO 27001", status: "Compliant", color: "text-emerald-400" },
  { icon: "✓", label: "HIPAA", status: "N/A", color: "text-slate-500" },
];

// Sample user risk data for the report
const userRiskData = [
  {
    id: "USR-001",
    name: "John Smith",
    email: "john.smith@example.com",
    riskScore: 23,
    reasonCodes: ["DEVICE_NEW"],
    aml: { sanctionMatch: false, sanctionConfidence: 0, pepMatch: false, adverseMedia: false },
    fraud: { emailRisk: "Low", phoneRisk: "Low" },
    network: { ipType: "Residential", ipCountry: "United States", mismatch: false },
    device: { usedBefore: true, botLike: false },
  },
  {
    id: "USR-002",
    name: "Maria Garcia",
    email: "m.garcia@tempmail.net",
    riskScore: 67,
    reasonCodes: ["EMAIL_DISPOSABLE", "IP_VPN_DETECTED", "COUNTRY_HIGH_RISK"],
    aml: { sanctionMatch: false, sanctionConfidence: 12, pepMatch: false, adverseMedia: false },
    fraud: { emailRisk: "High", phoneRisk: "Medium" },
    network: { ipType: "VPN", ipCountry: "Russia", mismatch: true },
    device: { usedBefore: false, botLike: false },
  },
  {
    id: "USR-003",
    name: "Ahmed Hassan",
    email: "a.hassan@company.org",
    riskScore: 85,
    reasonCodes: ["SANCTION_MATCH_POSSIBLE", "PEP_MATCH", "ADVERSE_MEDIA"],
    aml: { sanctionMatch: true, sanctionConfidence: 78, pepMatch: true, adverseMedia: true },
    fraud: { emailRisk: "Low", phoneRisk: "Low" },
    network: { ipType: "Residential", ipCountry: "UAE", mismatch: false },
    device: { usedBefore: true, botLike: false },
  },
  {
    id: "USR-004",
    name: "Li Wei",
    email: "liwei88@gmail.com",
    riskScore: 45,
    reasonCodes: ["PHONE_VOIP", "DEVICE_REUSE"],
    aml: { sanctionMatch: false, sanctionConfidence: 5, pepMatch: false, adverseMedia: false },
    fraud: { emailRisk: "Low", phoneRisk: "High" },
    network: { ipType: "Datacenter", ipCountry: "Singapore", mismatch: false },
    device: { usedBefore: true, botLike: true },
  },
  {
    id: "USR-005",
    name: "Anonymous User",
    email: "anon@protonmail.com",
    riskScore: 92,
    reasonCodes: ["EMAIL_DISPOSABLE", "IP_VPN_DETECTED", "DEVICE_REUSE", "BOT_DETECTED"],
    aml: { sanctionMatch: false, sanctionConfidence: 0, pepMatch: false, adverseMedia: false },
    fraud: { emailRisk: "High", phoneRisk: "High" },
    network: { ipType: "Tor", ipCountry: "Unknown", mismatch: true },
    device: { usedBefore: true, botLike: true },
  },
];

function getRiskLevel(score: number): { level: string; color: string; bgColor: string } {
  if (score <= 30) return { level: "Low", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
  if (score <= 70) return { level: "Medium", color: "text-amber-400", bgColor: "bg-amber-500/20" };
  return { level: "High", color: "text-red-400", bgColor: "bg-red-500/20" };
}

function getRiskBadgeColor(risk: string): string {
  switch (risk) {
    case "Low": return "bg-emerald-500/20 text-emerald-400";
    case "Medium": return "bg-amber-500/20 text-amber-400";
    case "High": return "bg-red-500/20 text-red-400";
    default: return "bg-slate-500/20 text-slate-400";
  }
}

export default function Demo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof userRiskData[0] | null>(null);
  const { t } = useLanguage();

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    setShowReport(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const handleReset = () => {
    setShowResults(false);
    setIsAnalyzing(false);
    setShowReport(false);
    setSelectedUser(null);
  };

  const handleViewReport = () => {
    setShowReport(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID", "Name", "Email", "Risk Score", "Risk Level", "Reason Codes",
      "Sanction Match", "Sanction Confidence", "PEP Match", "Adverse Media",
      "Email Risk", "Phone Risk", "IP Type", "IP Country", "Mismatch",
      "Device Used Before", "Bot-like Behavior"
    ];
    
    const rows = userRiskData.map(user => [
      user.id,
      user.name,
      user.email,
      user.riskScore,
      getRiskLevel(user.riskScore).level,
      user.reasonCodes.join("; "),
      user.aml.sanctionMatch ? "Yes" : "No",
      `${user.aml.sanctionConfidence}%`,
      user.aml.pepMatch ? "Yes" : "No",
      user.aml.adverseMedia ? "Yes" : "No",
      user.fraud.emailRisk,
      user.fraud.phoneRisk,
      user.network.ipType,
      user.network.ipCountry,
      user.network.mismatch ? "Yes" : "No",
      user.device.usedBefore ? "Yes" : "No",
      user.device.botLike ? "Yes" : "No"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "compliance_risk_report.csv";
    link.click();
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

              {/* Drop Zone */}
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center mb-6 hover:border-cyan-500/50 transition-colors">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 text-sm">
                  {t.demo.upload.dropzone}
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  {t.demo.upload.supported}
                </p>
              </div>

              {/* Sample Documents */}
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-3">{t.demo.upload.sampleLoaded}</p>
                {sampleDocuments.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{doc.name}</p>
                        <p className="text-slate-500 text-xs">{doc.type}</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 text-xs">{t.demo.upload.ready}</span>
                  </div>
                ))}
              </div>

              {/* Analyze Button */}
              <button
                onClick={showResults ? handleReset : handleAnalyze}
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
                    {t.demo.button.analyzing}
                  </>
                ) : showResults ? (
                  t.demo.button.reset
                ) : (
                  <>
                    {t.demo.button.analyze}
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
                    <p className="text-slate-500 text-sm mt-2">{t.demo.results.aiAnalyzing}</p>
                  </div>
                </div>
              )}

              {showResults && (
                <div className="space-y-4 animate-fade-in">
                  {/* Compliance Score */}
                  <div className="bg-slate-800/50 rounded-xl p-6 text-center mb-6">
                    <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                      87%
                    </div>
                    <p className="text-slate-400 text-sm">{t.demo.results.overallScore}</p>
                  </div>

                  {/* Framework Results */}
                  <div className="space-y-3">
                    {analysisResults.map((result) => (
                      <div
                        key={result.label}
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-lg ${result.color}`}>{result.icon}</span>
                          <span className="text-white font-medium">{result.label}</span>
                        </div>
                        <span className={`text-sm ${result.color}`}>{result.status}</span>
                      </div>
                    ))}
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
                  <h3 className="text-2xl font-bold text-white">Compliance Risk Report</h3>
                  <p className="text-slate-400 text-sm">5 users analyzed • Generated {new Date().toLocaleDateString()}</p>
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
                <div className="text-3xl font-bold text-white">5</div>
                <div className="text-slate-500 text-sm">Total Users</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">1</div>
                <div className="text-emerald-400/70 text-sm">Low Risk</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">2</div>
                <div className="text-amber-400/70 text-sm">Medium Risk</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">2</div>
                <div className="text-red-400/70 text-sm">High Risk</div>
              </div>
            </div>

            {/* User Risk Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">User</th>
                      <th className="text-center p-4 text-slate-400 font-medium text-sm">Risk Score</th>
                      <th className="text-center p-4 text-slate-400 font-medium text-sm">Level</th>
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Reason Codes</th>
                      <th className="text-center p-4 text-slate-400 font-medium text-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRiskData.map((user) => {
                      const risk = getRiskLevel(user.riskScore);
                      return (
                        <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div>
                              <div className="text-white font-medium">{user.name}</div>
                              <div className="text-slate-500 text-sm">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${risk.bgColor}`}>
                              <span className={`text-lg font-bold ${risk.color}`}>{user.riskScore}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(risk.level)}`}>
                              {risk.level}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {user.reasonCodes.slice(0, 3).map((code) => (
                                <span key={code} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
                                  {code}
                                </span>
                              ))}
                              {user.reasonCodes.length > 3 && (
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-xs">
                                  +{user.reasonCodes.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedUser(user)}
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

            {/* User Detail Modal */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
                <div 
                  className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-white">{selectedUser.name}</h4>
                      <p className="text-slate-400 text-sm">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Risk Score */}
                    <div className="flex items-center gap-6">
                      <div className={`w-24 h-24 rounded-2xl ${getRiskLevel(selectedUser.riskScore).bgColor} flex items-center justify-center`}>
                        <span className={`text-4xl font-bold ${getRiskLevel(selectedUser.riskScore).color}`}>
                          {selectedUser.riskScore}
                        </span>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-1">Risk Level</div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRiskBadgeColor(getRiskLevel(selectedUser.riskScore).level)}`}>
                          {getRiskLevel(selectedUser.riskScore).level} Risk
                        </span>
                      </div>
                    </div>

                    {/* Reason Codes */}
                    <div>
                      <h5 className="text-white font-semibold mb-3">Reason Codes</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.reasonCodes.map((code) => (
                          <span key={code} className="px-3 py-1.5 bg-slate-800 text-amber-400 rounded-lg text-sm font-mono border border-amber-500/20">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AML Checks */}
                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        AML Checks
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Sanction Match</div>
                          <div className={`font-medium ${selectedUser.aml.sanctionMatch ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedUser.aml.sanctionMatch ? 'Yes' : 'No'} 
                            <span className="text-slate-500 text-sm ml-1">({selectedUser.aml.sanctionConfidence}% confidence)</span>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">PEP Match</div>
                          <div className={`font-medium ${selectedUser.aml.pepMatch ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedUser.aml.pepMatch ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
                          <div className="text-slate-400 text-xs mb-1">Adverse Media</div>
                          <div className={`font-medium ${selectedUser.aml.adverseMedia ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedUser.aml.adverseMedia ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fraud Checks */}
                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Fraud Checks
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Email Risk</div>
                          <span className={`px-2 py-0.5 rounded text-sm font-medium ${getRiskBadgeColor(selectedUser.fraud.emailRisk)}`}>
                            {selectedUser.fraud.emailRisk}
                          </span>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Phone Risk</div>
                          <span className={`px-2 py-0.5 rounded text-sm font-medium ${getRiskBadgeColor(selectedUser.fraud.phoneRisk)}`}>
                            {selectedUser.fraud.phoneRisk}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Network Checks */}
                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Network Checks
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">IP Type</div>
                          <div className={`font-medium ${
                            ['VPN', 'Tor', 'Proxy'].includes(selectedUser.network.ipType) 
                              ? 'text-amber-400' 
                              : 'text-white'
                          }`}>
                            {selectedUser.network.ipType}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">IP Country</div>
                          <div className="text-white font-medium">{selectedUser.network.ipCountry}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
                          <div className="text-slate-400 text-xs mb-1">Mismatch with Declared</div>
                          <div className={`font-medium ${selectedUser.network.mismatch ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedUser.network.mismatch ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Checks */}
                    <div>
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        Device Checks
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Device Used Before</div>
                          <div className={`font-medium ${selectedUser.device.usedBefore ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {selectedUser.device.usedBefore ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-slate-400 text-xs mb-1">Bot-like Behavior</div>
                          <div className={`font-medium ${selectedUser.device.botLike ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedUser.device.botLike ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>
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
