"use client";

const items = [
  "Full Stack Development",
  "React.js Mastery",
  "Node.js Engineering",
  "MongoDB & Databases",
  "AWS Deployment",
  "System Design",
  "DSA & Interviews",
  "REST APIs",
  "Authentication & Security",
];

export default function MarqueeTicker() {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-[#1E1E1E] py-4 bg-[#0F0F0F]">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0F0F0F, transparent)" }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #0F0F0F, transparent)" }} />

      <div
        className="flex gap-10 whitespace-nowrap"
        style={{
          animation: "marquee 35s linear infinite",
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span
              className="text-[#555555] text-xs tracking-widest uppercase"
              style={{ fontFamily: "DM Mono, monospace" }}
            >
              {item}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#FF5C00] flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
