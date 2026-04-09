"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, Timer, Shuffle, Monitor } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const antiCheatFeatures = [
  { icon: <Monitor size={15} />, label: "Fullscreen enforced" },
  { icon: <Shuffle size={15} />, label: "Randomized questions" },
  { icon: <ShieldCheck size={15} />, label: "Tab-switch detection" },
  { icon: <Timer size={15} />, label: "Strict time limits" },
];

export default function ExamSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.25 });

  return (
    <section
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0A0A0A" }}
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Exam UI mockup */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <ExamMockup />
          </motion.div>

          {/* Right: Copy */}
          <div>
            <SectionHeader
              label="Exam System"
              title={
                <>
                  MCQ exams that
                  <br />
                  <span className="text-[#FF5C00]">actually test you.</span>
                </>
              }
              subtitle="Module-wise and final exams with instant results, performance analytics, and anti-cheat enforcement."
            />

            {/* Anti-cheat features */}
            <div className="mb-8">
              <p
                className="text-[#888888] text-xs font-mono uppercase tracking-widest mb-4"
              >
                Anti-Cheat System
              </p>
              <div className="grid grid-cols-2 gap-3">
                {antiCheatFeatures.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 px-4 py-3 border border-[#1E1E1E] rounded-sm"
                  >
                    <span className="text-[#FF5C00]">{f.icon}</span>
                    <span
                      className="text-[#888888] text-xs"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund connection */}
            <div className="p-5 border border-[#FF5C00]/20 bg-[#FF5C00]/5 rounded-sm">
              <p
                className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-2"
              >
                Exam → Refund Link
              </p>
              <p
                className="text-[#888888] text-sm leading-relaxed"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                Your final exam score directly determines refund eligibility.
                Score ≥ 80% + complete 100% of modules = full refund. The
                admin controls all thresholds from the panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExamMockup() {
  const options = [
    { id: "A", text: "It re-renders on every parent update", correct: false },
    { id: "B", text: "It memoizes the function reference", correct: true },
    { id: "C", text: "It replaces useEffect entirely", correct: false },
    { id: "D", text: "It only works with class components", correct: false },
  ];

  return (
    <div className="border border-[#1E1E1E] rounded-sm overflow-hidden bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-[#1E1E1E] px-5 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-[#FAFAFA] text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
            Module 3 — Final Exam
          </p>
          <p className="text-[#555555] text-xs font-mono">Question 7 of 20</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 border border-[#FF5C00]/30 rounded-sm">
          <Timer size={12} className="text-[#FF5C00]" />
          <span className="text-[#FF5C00] text-xs font-mono font-medium">12:43</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#1E1E1E]">
        <motion.div
          className="h-full bg-[#FF5C00]"
          initial={{ width: "0%" }}
          animate={{ width: "35%" }}
          transition={{ delay: 0.5, duration: 1 }}
        />
      </div>

      {/* Question */}
      <div className="p-6">
        <p
          className="text-[#FAFAFA] text-sm leading-relaxed mb-5"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          What is the primary purpose of{" "}
          <code className="bg-[#1E1E1E] text-[#FF5C00] px-1.5 py-0.5 rounded text-xs font-mono">
            useCallback
          </code>{" "}
          in React?
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {options.map((opt, i) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={`
                flex items-start gap-3 px-4 py-3 border rounded-sm cursor-pointer
                transition-all duration-200
                ${opt.correct
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-[#1E1E1E] hover:border-[#2A2A2A]"
                }
              `}
            >
              <span
                className={`
                  w-6 h-6 rounded-sm border flex items-center justify-center text-xs font-mono flex-shrink-0
                  ${opt.correct
                    ? "border-green-500 text-green-400"
                    : "border-[#2A2A2A] text-[#555555]"
                  }
                `}
              >
                {opt.id}
              </span>
              <span
                className={`text-sm ${opt.correct ? "text-green-400" : "text-[#888888]"}`}
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {opt.text}
              </span>
              {opt.correct && (
                <ShieldCheck size={14} className="text-green-400 ml-auto flex-shrink-0 mt-0.5" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Score preview */}
        <div className="mt-5 pt-4 border-t border-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-5 text-xs font-mono text-[#555555]">
            <span className="text-green-400">6 correct</span>
            <span>1 wrong</span>
            <span>13 remaining</span>
          </div>
          <button
            className="
              h-8 px-5 bg-[#FF5C00] hover:bg-[#FF7A30]
              text-white text-xs font-semibold rounded-sm
              transition-colors duration-200
            "
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
