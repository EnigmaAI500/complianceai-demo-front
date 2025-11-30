interface PageHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: string;
}

export default function PageHeader({
  title,
  subtitle,
  gradient = "from-cyan-400 to-blue-500",
}: PageHeaderProps) {
  return (
    <div className="text-center mb-16">
      <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-6`}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

