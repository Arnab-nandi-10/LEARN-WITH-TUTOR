"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Layers,
  Play,
  BarChart2,
  ClipboardList,
  RotateCcw,
  Activity,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { platformFeatures } from "@/lib/data";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const iconMap: Record<string, React.ReactNode> = {
  layers: <Layers size={18} />,
  play: <Play size={18} />,
  "bar-chart": <BarChart2 size={18} />,
  clipboard: <ClipboardList size={18} />,
  "rotate-ccw": <RotateCcw size={18} />,
  activity: <Activity size={18} />,
};

export default function PlatformFeatures() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feature-block", {
        opacity: 0,
        y: 30,
        stagger: 0.09,
        duration: 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 78%",
          once: true,
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0A0A0A" }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeader
          label="Platform"
          title={
            <>
              Every tool you need,
              <br />
              <span className="text-[#FF5C00]">built in.</span>
            </>
          }
          subtitle="From course creation to refund processing — the full LMS stack, refined."
          align="center"
        />

        <div
          ref={gridRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1E1E1E] border border-[#1E1E1E] rounded-sm overflow-hidden"
        >
          {platformFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className="
                feature-block group
                bg-[#0A0A0A] p-8
                hover:bg-[#111111]
                transition-colors duration-300
              "
            >
              {/* Icon */}
              <div
                className="
                  w-10 h-10 rounded-sm border border-[#1E1E1E]
                  flex items-center justify-center
                  text-[#FF5C00] mb-5
                  group-hover:border-[#FF5C00]/30
                  transition-colors duration-300
                "
              >
                {iconMap[feature.icon]}
              </div>

              {/* Index */}
              <p
                className="text-[#2A2A2A] text-xs font-mono mb-3 group-hover:text-[#FF5C00] transition-colors"
              >
                0{i + 1}
              </p>

              {/* Title */}
              <h3
                className="text-[#FAFAFA] font-semibold mb-2"
                style={{ fontFamily: "Syne, sans-serif", fontSize: "1rem" }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                className="text-[#555555] text-sm leading-relaxed"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
