import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

const implementationSteps = [
  {
    step: 1,
    title: "Discovery & Planning",
    duration: "1-2 weeks",
    description:
      "We analyze your current compliance landscape, identify key pain points, and design a customized implementation roadmap.",
    deliverables: [
      "Compliance gap analysis report",
      "Custom implementation plan",
      "Integration architecture design",
      "Success metrics definition",
    ],
  },
  {
    step: 2,
    title: "Platform Setup & Integration",
    duration: "2-3 weeks",
    description:
      "Our team configures the platform to your specifications, sets up integrations with your existing tools, and imports historical data.",
    deliverables: [
      "Configured ComplianceAI instance",
      "Connected integrations (Slack, Jira, etc.)",
      "Data migration from legacy systems",
      "Custom dashboards & reports",
    ],
  },
  {
    step: 3,
    title: "AI Model Training",
    duration: "1-2 weeks",
    description:
      "We fine-tune our AI models on your specific documents, policies, and compliance frameworks for maximum accuracy.",
    deliverables: [
      "Custom-trained document classifiers",
      "Industry-specific entity extraction",
      "Calibrated risk scoring models",
      "Accuracy validation report",
    ],
  },
  {
    step: 4,
    title: "Testing & Validation",
    duration: "1-2 weeks",
    description:
      "Rigorous testing with your team to ensure everything works perfectly. We validate accuracy and fine-tune based on feedback.",
    deliverables: [
      "UAT test results",
      "Performance benchmarks",
      "Security audit certification",
      "Compliance validation report",
    ],
  },
  {
    step: 5,
    title: "Training & Go-Live",
    duration: "1 week",
    description:
      "Comprehensive training for your team followed by a supported go-live. We're with you every step of the way.",
    deliverables: [
      "User training sessions (recorded)",
      "Admin training & documentation",
      "Go-live support (24/7 for first week)",
      "Knowledge base access",
    ],
  },
  {
    step: 6,
    title: "Ongoing Support & Optimization",
    duration: "Continuous",
    description:
      "Dedicated customer success manager, regular check-ins, and continuous optimization to maximize your ROI.",
    deliverables: [
      "Dedicated CSM",
      "Quarterly business reviews",
      "Continuous model improvements",
      "Priority support access",
    ],
  },
];

const techSpecs = [
  {
    category: "Deployment Options",
    items: ["Cloud (AWS, GCP, Azure)", "On-premise", "Hybrid", "Private cloud"],
  },
  {
    category: "Security & Compliance",
    items: ["SOC 2 Type II", "ISO 27001", "GDPR compliant", "HIPAA ready"],
  },
  {
    category: "Integrations",
    items: ["REST API", "GraphQL", "Webhooks", "50+ native integrations"],
  },
  {
    category: "Data & AI",
    items: ["Custom model training", "Multi-language support", "OCR processing", "Real-time analysis"],
  },
];

export default function ImplementationPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10" />

      <Container>
        <PageHeader
          title="Implementation"
          subtitle="A proven, low-friction implementation process designed to get you up and running quickly with minimal disruption to your operations."
          gradient="from-amber-400 to-orange-500"
        />

        {/* Timeline Overview */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-6 mb-16 border border-amber-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Typical Implementation: 6-10 Weeks
              </h3>
              <p className="text-slate-400 text-sm">
                From kickoff to go-live, we&apos;ll have you operational faster than traditional solutions
              </p>
            </div>
            <div className="flex items-center gap-8">
              {[
                { value: "6-10", label: "Weeks" },
                { value: "99%", label: "On-time" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                  <div className="text-slate-500 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Implementation Steps */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Implementation Process
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            A structured, proven approach that ensures success
          </p>

          <div className="space-y-6">
            {implementationSteps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <div className="pl-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Step Header */}
                    <div className="lg:w-1/3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                          {step.step}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                          {step.duration}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-slate-400 text-sm">{step.description}</p>
                    </div>

                    {/* Deliverables */}
                    <div className="lg:w-2/3 lg:pl-8 lg:border-l lg:border-slate-800">
                      <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                        Deliverables
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {step.deliverables.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-slate-300 text-sm"
                          >
                            <svg
                              className="w-4 h-4 text-amber-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Technical Specifications
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Enterprise-grade infrastructure built for scale and security
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techSpecs.map((spec, index) => (
              <Card key={index} hover={false} className="bg-slate-900/30">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {spec.category}
                </h3>
                <ul className="space-y-2">
                  {spec.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-slate-400 text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl p-8 md:p-12 border border-amber-500/20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Schedule a call with our implementation team to discuss your specific
            requirements and get a customized implementation plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
            >
              Schedule Implementation Call
            </a>
            <a
              href="/#demo"
              className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-full border border-slate-700 hover:border-amber-500/50 transition-all duration-300"
            >
              Try Demo First
            </a>
          </div>
        </div>
      </Container>
    </main>
  );
}

