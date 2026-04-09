interface SectionHeaderProps {
  label: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionHeader({
  label,
  title,
  subtitle,
  align = "left",
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div className={`mb-14 ${isCenter ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}`}>
      <div
        className={`flex items-center gap-3 mb-5 ${isCenter ? "justify-center" : ""}`}
      >
        <span className="section-label">{label}</span>
        <span className="w-6 h-px bg-[#FF5C00]" />
      </div>
      <h2
        className="text-[#FAFAFA] leading-tight tracking-tight mb-4"
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: "clamp(1.75rem, 3.5vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.025em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-[#888888] text-base leading-relaxed"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
