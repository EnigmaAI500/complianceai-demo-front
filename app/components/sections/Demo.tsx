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

export default function Demo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { t } = useLanguage();

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const handleReset = () => {
    setShowResults(false);
    setIsAnalyzing(false);
  };

  return (
    <section id="demo" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
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
        <div className="grid lg:grid-cols-2 gap-8">
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
                <button className="w-full mt-4 py-3 rounded-xl bg-slate-800 text-cyan-400 font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  {t.demo.results.viewReport}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
