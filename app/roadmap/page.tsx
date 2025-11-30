"use client";

import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function RoadmapPage() {
  const { t } = useLanguage();

  const statusConfig = {
    completed: {
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      label: t.roadmap.completed,
      bgGlow: "from-emerald-500/20",
    },
    "in-progress": {
      color: "bg-cyan-500",
      textColor: "text-cyan-400",
      label: t.roadmap.inProgress,
      bgGlow: "from-cyan-500/20",
    },
    upcoming: {
      color: "bg-slate-600",
      textColor: "text-slate-400",
      label: t.roadmap.upcoming,
      bgGlow: "from-slate-500/20",
    },
  };

  const roadmapPhases = [
    {
      phase: "Phase 1",
      title: "Foundation",
      timeline: "Q1 2024",
      status: "completed",
      items: [
        "Core AI document analysis engine",
        "GDPR & SOC 2 framework support",
        "Basic dashboard & reporting",
        "API for document upload",
        "Slack integration",
      ],
    },
    {
      phase: "Phase 2",
      title: "Expansion",
      timeline: "Q2 2024",
      status: "completed",
      items: [
        "HIPAA & ISO 27001 frameworks",
        "Real-time monitoring dashboard",
        "Automated remediation suggestions",
        "Jira & ServiceNow integrations",
        "Custom policy builder",
      ],
    },
    {
      phase: "Phase 3",
      title: "Intelligence",
      timeline: "Q3 2024",
      status: "in-progress",
      items: [
        "Predictive risk scoring",
        "Natural language query interface",
        "Multi-language document support",
        "Advanced analytics & trends",
        "Audit trail & evidence collection",
      ],
    },
    {
      phase: "Phase 4",
      title: "Enterprise",
      timeline: "Q4 2024",
      status: "upcoming",
      items: [
        "On-premise deployment option",
        "SSO & advanced RBAC",
        "Custom AI model training",
        "Industry-specific compliance packs",
        "White-label solution",
      ],
    },
    {
      phase: "Phase 5",
      title: "Ecosystem",
      timeline: "2025",
      status: "upcoming",
      items: [
        "Marketplace for compliance apps",
        "Third-party AI model integrations",
        "Global regulatory database",
        "Automated regulatory change tracking",
        "Compliance workflow automation",
      ],
    },
  ];

  return (
    <main className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <Container>
        <PageHeader
          title={t.roadmap.title}
          subtitle={t.roadmap.subtitle}
          gradient="from-blue-400 to-indigo-500"
        />

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${config.color}`} />
              <span className="text-slate-400 text-sm">{config.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-slate-700" />

          {/* Phases */}
          <div className="space-y-12">
            {roadmapPhases.map((phase, index) => {
              const config = statusConfig[phase.status as keyof typeof statusConfig];
              const isEven = index % 2 === 0;

              return (
                <div
                  key={phase.phase}
                  className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 z-10">
                    <div
                      className={`w-4 h-4 rounded-full ${config.color} ring-4 ring-slate-900 shadow-lg`}
                    />
                  </div>

                  {/* Content Card */}
                  <div
                    className={`ml-20 md:ml-0 md:w-[calc(50%-3rem)] ${
                      isEven ? "md:pr-8 md:text-right" : "md:pl-8"
                    }`}
                  >
                    <div
                      className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all relative overflow-hidden`}
                    >
                      {/* Glow effect */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${config.bgGlow} to-transparent opacity-50`}
                      />

                      <div className="relative">
                        {/* Phase Header */}
                        <div
                          className={`flex items-center gap-3 mb-4 ${
                            isEven ? "md:justify-end" : ""
                          }`}
                        >
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${config.textColor} bg-slate-800`}
                          >
                            {phase.phase}
                          </span>
                          <span className="text-slate-500 text-sm">
                            {phase.timeline}
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-4">
                          {phase.title}
                        </h3>

                        {/* Status Badge */}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.textColor} bg-slate-800/50 mb-4`}
                        >
                          {config.label}
                        </span>

                        {/* Features List */}
                        <ul
                          className={`space-y-2 ${
                            isEven ? "md:text-right" : ""
                          }`}
                        >
                          {phase.items.map((item, i) => (
                            <li
                              key={i}
                              className={`flex items-center gap-2 text-slate-400 text-sm ${
                                isEven ? "md:flex-row-reverse" : ""
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${config.color}`}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <p className="text-slate-400 mb-6">
            {t.roadmap.feedback}
          </p>
          <a
            href="mailto:roadmap@complianceai.io"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-full border border-slate-700 hover:border-blue-500/50 transition-all"
          >
            {t.roadmap.shareFeedback}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </a>
        </div>
      </Container>
    </main>
  );
}
