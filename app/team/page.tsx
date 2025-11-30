"use client";

import Image from "next/image";
import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { useLanguage } from "../lib/i18n/LanguageContext";

const teamMembers = [
  {
    name: "Aziza Abdurakhmonova",
    role: "CEO & Founder",
    bio: "Software Engineer at EPAM | Ex-KDB Bank Software Engineer | IUT 2020 Alumna | ML Research in Information Retrieval (Python) at Nagaoka University of Technology, Japan (2019) | Women Techmakers @ Google | Co-Founder of MDCU",
    image: "/team/Aziza.JPEG",
    initials: "AA",
    color: "from-violet-500 to-purple-600",
    linkedin: "https://www.linkedin.com/in/aziza-abdurakhmonova-721844192/",
    github: "https://github.com/EnigmaAI500",
  },
  {
    name: "Timurxon",
    role: "CTO & Co-founder",
    bio: ".NET Developer @ Openbank | Mentor | Microsoft Developers Community Uzbekistan Organizer",
    image: "/team/T.jpg",
    initials: "T",
    color: "from-cyan-500 to-blue-600",
    linkedin: "https://www.linkedin.com/in/temurxon-shodiyev/",
    github: "",
  },
  {
    name: "Firdavs Muzaffarov",
    role: "Software Engineer",
    bio: ".NET Software Engineer @ EPAM. | AWS Cloud certified developer",
    image: "/team/F.jpg",
    initials: "FM",
    color: "from-pink-500 to-rose-600",
    linkedin: "https://www.linkedin.com/in/firdavs-muzaffarov/",
    github: "",
  },
  {
    name: "Abdujabbor Imomkulov",
    role: "Sales Manager, Marketing Manager",
    bio: "WIUT Students Union General Manager",
    image: "/team/AB.jpg",
    initials: "AI",
    color: "from-amber-500 to-orange-600",
    linkedin: "https://www.linkedin.com/in/abdujabbor-imomkulov-1a4493347/",
    github: "",
  },
  {
    name: "Muhammadamin Akbarov",
    role: "Full Stack Developer",
    bio: "Full Stack Developer @ OpenBank",
    image: "/team/MA.jpg",
    initials: "MA",
    color: "from-emerald-500 to-teal-600",
    linkedin: "https://www.linkedin.com/in/muhammadamin-akbarov-27207b297/",
    github: "",
  },
];

export default function TeamPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed top-1/4 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10" />

      <Container>
        <PageHeader
          title={t.team.title}
          subtitle={t.team.subtitle}
          gradient="from-violet-400 to-pink-500"
        />

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {teamMembers.map((member, index) => (
            <Card key={index} className="text-center group">
              {/* Avatar */}
              <div
                className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-2xl font-bold mb-5 group-hover:scale-110 transition-transform shadow-lg overflow-hidden`}
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  member.initials
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {member.name}
              </h3>
              <p className="text-cyan-400 text-sm font-medium mb-4">
                {member.role}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                {member.bio}
              </p>
              <div className="flex items-center justify-center gap-4">
                {/* LinkedIn */}
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
                {/* GitHub - only show if URL exists */}
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
