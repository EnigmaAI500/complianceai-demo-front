import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

const problems = [
  {
    icon: "⏱️",
    title: "Time-Consuming Manual Processes",
    description:
      "Compliance teams spend 60% of their time on manual document review, data entry, and cross-referencing regulations—tasks that could be automated.",
    stat: "60%",
    statLabel: "time wasted on manual work",
  },
  {
    icon: "💸",
    title: "Skyrocketing Compliance Costs",
    description:
      "The average enterprise spends $5.47 million annually on compliance, with costs increasing 45% over the past 5 years due to regulatory complexity.",
    stat: "$5.47M",
    statLabel: "average annual spend",
  },
  {
    icon: "⚠️",
    title: "Human Error & Risk Exposure",
    description:
      "Manual compliance processes have a 4% error rate, leading to regulatory fines, reputational damage, and potential legal consequences.",
    stat: "4%",
    statLabel: "average error rate",
  },
  {
    icon: "🔄",
    title: "Constantly Changing Regulations",
    description:
      "Regulatory bodies publish an average of 200+ updates daily. Keeping up manually is impossible without dedicated teams monitoring 24/7.",
    stat: "200+",
    statLabel: "daily regulatory updates",
  },
  {
    icon: "📊",
    title: "Fragmented Data & Silos",
    description:
      "Compliance data is scattered across spreadsheets, emails, and legacy systems, making it nearly impossible to get a unified view of compliance status.",
    stat: "73%",
    statLabel: "companies struggle with data silos",
  },
  {
    icon: "🎯",
    title: "Audit Preparation Nightmare",
    description:
      "Organizations spend an average of 6 weeks preparing for audits, pulling documents from multiple sources and creating reports manually.",
    stat: "6 weeks",
    statLabel: "average audit prep time",
  },
];

export default function ProblemPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/3 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10" />

      <Container>
        <PageHeader
          title="The Problem"
          subtitle="Traditional compliance is broken. Organizations are drowning in regulatory complexity, wasting resources on manual processes that don't scale."
          gradient="from-red-400 to-orange-500"
        />

        {/* Problem Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {problems.map((problem, index) => (
            <Card key={index} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-4xl mb-4 block">{problem.icon}</span>
              <h3 className="text-xl font-semibold text-white mb-3">
                {problem.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {problem.description}
              </p>
              <div className="pt-4 border-t border-slate-800">
                <div className="text-2xl font-bold text-red-400">
                  {problem.stat}
                </div>
                <div className="text-slate-500 text-xs">{problem.statLabel}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Impact Section */}
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl p-8 md:p-12 border border-red-500/20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                The Cost of Inaction
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Non-compliance isn&apos;t just expensive—it&apos;s existential. Beyond the
                immediate financial penalties, organizations face reputational
                damage, lost customer trust, and in severe cases, operational
                shutdown.
              </p>
              <ul className="space-y-3">
                {[
                  "Average regulatory fine: $14.8 million",
                  "Stock price drop after breach: 7.5%",
                  "Customer churn post-incident: 31%",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "$14.8M", label: "Avg Fine" },
                { value: "7.5%", label: "Stock Drop" },
                { value: "31%", label: "Churn Rate" },
                { value: "2.3x", label: "Risk Multiplier" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-900/50 rounded-2xl p-6 text-center border border-slate-800"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

