"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Video,
  FileText,
  Download,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { learningSteps } from "@/lib/data";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LearningExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".step-item", {
        opacity: 0,
        x: -24,
        stagger: 0.12,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".steps-list",
          start: "top 80%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0F0F0F" }}
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Steps */}
          <div>
            <SectionHeader
              label="Learning Flow"
              title={
                <>
                  From enrollment
                  <br />
                  to <span className="text-[#FF5C00]">refund.</span>
                </>
              }
              subtitle="Four clear stages. No confusion, no dead ends."
            />

            <div className="steps-list flex flex-col gap-0">
              {learningSteps.map((step, i) => (
                <div
                  key={step.step}
                  className={`step-item flex gap-5 py-5 ${
                    i !== learningSteps.length - 1 ? "border-b border-[#1E1E1E]" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-sm bg-[#111111] border border-[#1E1E1E] flex items-center justify-center flex-shrink-0 text-[#FF5C00]"
                      style={{ fontFamily: "DM Mono, monospace", fontSize: "0.65rem" }}
                    >
                      {step.step}
                    </div>
                    {i < learningSteps.length - 1 && (
                      <div className="w-px flex-1 bg-[#1E1E1E] mt-1 min-h-[16px]" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h4
                      className="text-[#FAFAFA] font-semibold mb-1"
                      style={{ fontFamily: "Syne, sans-serif", fontSize: "0.9375rem" }}
                    >
                      {step.title}
                    </h4>
                    <p
                      className="text-[#555555] text-sm leading-relaxed"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Fake video player UI */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <PlayerMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PlayerMockup() {
  return (
    <div className="border border-[#1E1E1E] rounded-sm overflow-hidden bg-[#0A0A0A]">
      {/* Top bar */}
      <div className="border-b border-[#1E1E1E] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {["#FF5C00", "#1E1E1E", "#1E1E1E"].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[#333333] text-xs font-mono">
            Module 3 — React Hooks Deep Dive
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#555555] text-xs font-mono">68% complete</span>
        </div>
      </div>

      {/* Video area */}
      <div className="relative aspect-video bg-[#0D0D0D] flex items-center justify-center line-grid">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border border-[#FF5C00]/40 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:border-[#FF5C00] transition-colors">
            <div className="w-0 h-0 ml-1"
              style={{
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                borderLeft: "16px solid #FF5C00",
              }}
            />
          </div>
          <p className="text-[#333333] text-xs font-mono">Lesson 3.4 — useCallback & useMemo</p>
        </div>

        {/* Time indicator */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="h-0.5 bg-[#1E1E1E] rounded-full">
            <motion.div
              className="h-full bg-[#FF5C00] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "42%" }}
              transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-[#333333] font-mono">
            <span>14:32</span>
            <span>34:10</span>
          </div>
        </div>
      </div>

      {/* Resource tabs */}
      <div className="border-t border-[#1E1E1E]">
        {/* Tab bar */}
        <div className="flex border-b border-[#1E1E1E]">
          {["Notes", "Resources", "Q&A"].map((tab, i) => (
            <button
              key={tab}
              className={`px-5 py-3 text-xs font-mono transition-colors ${
                i === 0
                  ? "text-[#FF5C00] border-b-2 border-[#FF5C00] -mb-px"
                  : "text-[#333333] hover:text-[#888888]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Resource list */}
        <div className="p-4 flex flex-col gap-2">
          {[
            { icon: <FileText size={13} />, name: "Lecture Notes — Module 3.pdf" },
            { icon: <Download size={13} />, name: "Starter Code — useCallback.zip" },
            { icon: <BookOpen size={13} />, name: "Reference Docs Link" },
          ].map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-3 py-2 px-3 rounded-sm hover:bg-[#111111] cursor-pointer group transition-colors"
            >
              <span className="text-[#333333] group-hover:text-[#FF5C00] transition-colors">
                {r.icon}
              </span>
              <span className="text-[#555555] text-xs font-mono group-hover:text-[#888888] transition-colors flex-1">
                {r.name}
              </span>
              <ChevronRight size={12} className="text-[#333333] group-hover:text-[#555555] transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="border-t border-[#1E1E1E] px-5 py-3 flex items-center gap-4">
        <span className="text-[#555555] text-[10px] font-mono flex-shrink-0">Course Progress</span>
        <div className="flex-1 h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF5C00] rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "68%" }}
            transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <span className="text-[#FF5C00] text-[10px] font-mono flex-shrink-0">68%</span>
      </div>
    </div>
  );
}
