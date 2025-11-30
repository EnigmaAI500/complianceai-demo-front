"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/problem", label: "Problem" },
  { href: "/why", label: "Why Us" },
  { href: "/team", label: "Team" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/implementation", label: "Implementation" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ComplianceAI
            </span>
          </Link>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-cyan-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <Link
            href="/#demo"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
          >
            Try Demo
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>

          {/* Mobile Menu Button */}
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

function MobileMenu() {
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <input type="checkbox" id="mobile-menu" className="hidden peer" />
      <label
        htmlFor="mobile-menu"
        className="flex flex-col gap-1.5 p-2 cursor-pointer"
      >
        <span className="w-6 h-0.5 bg-slate-400 transition-all peer-checked:rotate-45 peer-checked:translate-y-2" />
        <span className="w-6 h-0.5 bg-slate-400 transition-all peer-checked:opacity-0" />
        <span className="w-6 h-0.5 bg-slate-400 transition-all peer-checked:-rotate-45 peer-checked:-translate-y-2" />
      </label>
      <div className="fixed inset-x-0 top-16 bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/20 hidden peer-checked:block">
        <div className="flex flex-col p-4 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/#demo"
            className="mt-2 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-full"
          >
            Try Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

