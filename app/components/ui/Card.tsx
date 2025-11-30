interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 ${
        hover ? "hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

