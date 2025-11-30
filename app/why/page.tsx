import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI-First Architecture",
    description: "Built from the ground up with AI at its core, not as an afterthought. Our models are specifically trained on regulatory documents and compliance frameworks.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Real-Time Processing",
    description: "Analyze thousands of documents in seconds, not days. Get instant compliance assessments and risk scores as documents are uploaded.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption. Your data never leaves your control, with on-premise deployment options available.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: "Unified Dashboard",
    description: "One platform for all your compliance needs. Monitor GDPR, SOC 2, HIPAA, ISO 27001, and more from a single, intuitive interface.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    title: "Actionable Insights",
    description: "Go beyond detection. Get specific, prioritized recommendations for addressing compliance gaps with step-by-step remediation guides.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: "Seamless Integrations",
    description: "Connect with your existing tools—Slack, Jira, ServiceNow, and 50+ other platforms. No disruption to your current workflows.",
  },
];

const comparisons = [
  { feature: "Document Processing Time", traditional: "2-3 days", complianceAI: "< 30 seconds" },
  { feature: "Accuracy Rate", traditional: "96%", complianceAI: "99.9%" },
  { feature: "Regulatory Coverage", traditional: "5-10 frameworks", complianceAI: "50+ frameworks" },
  { feature: "Audit Prep Time", traditional: "6 weeks", complianceAI: "< 1 week" },
  { feature: "Cost per Assessment", traditional: "$15,000+", complianceAI: "$500" },
];

export default function WhyPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />

      <Container>
        <PageHeader
          title="Why ComplianceAI?"
          subtitle="We've reimagined compliance from the ground up. Our AI-powered platform delivers faster, more accurate, and more affordable compliance management."
          gradient="from-emerald-400 to-cyan-500"
        />

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {features.map((feature, index) => (
            <Card key={index} className="group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Traditional vs ComplianceAI
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            See how our AI-powered approach stacks up against manual compliance processes
          </p>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-800/50">
              <div className="p-4 text-slate-400 font-medium">Feature</div>
              <div className="p-4 text-slate-400 font-medium text-center">Traditional</div>
              <div className="p-4 text-cyan-400 font-medium text-center">ComplianceAI</div>
            </div>
            {comparisons.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-3 border-t border-slate-800 hover:bg-slate-800/30 transition-colors"
              >
                <div className="p-4 text-white">{row.feature}</div>
                <div className="p-4 text-slate-500 text-center">{row.traditional}</div>
                <div className="p-4 text-emerald-400 text-center font-medium">{row.complianceAI}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <a
              href="/#demo"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
            >
              See It In Action
            </a>
            <a
              href="/implementation"
              className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-full border border-slate-700 hover:border-emerald-500/50 transition-all duration-300"
            >
              View Implementation
            </a>
          </div>
        </div>
      </Container>
    </main>
  );
}

