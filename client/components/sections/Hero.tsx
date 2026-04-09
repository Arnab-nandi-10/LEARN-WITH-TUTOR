"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { stats } from "@/lib/data";
import type { Stat } from "@/lib/data";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20"
      style={{ background: "#0A0A0A" }}
    >
      {/* Dot grid */}
      <div
        ref={gridRef}
        className="absolute inset-0 dot-grid opacity-60"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at var(--mx, 50%) var(--my, 40%), black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at var(--mx, 50%) var(--my, 40%), black 0%, transparent 100%)",
        }}
      />

      {/* Subtle accent glow — top right corner only */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(255,92,0,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Label */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="flex items-center gap-3 mb-7"
            >
              <span className="section-label">Tutor Labs</span>
              <span className="w-8 h-px bg-[#FF5C00]" />
              <span className="text-[#555555] text-xs font-mono tracking-wide">
                learning.tutorlabs.com
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="font-display text-[#FAFAFA] leading-[1.05] tracking-[-0.03em] mb-6"
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "clamp(2.75rem, 6vw, 5.25rem)",
                fontWeight: 800,
              }}
            >
              Learn.
              <br />
              Build.
              <br />
              <span className="text-[#FF5C00]">Get Refunded.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-[#888888] text-lg leading-relaxed mb-10 max-w-md"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              A premium coding platform where your investment comes back when you
              succeed. Complete your course, pass the exam — claim your refund.
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="#courses"
                className="
                  group inline-flex items-center gap-2
                  h-12 px-7 rounded-sm
                  bg-[#FF5C00] text-white text-sm font-semibold
                  hover:bg-[#FF7A30]
                  transition-all duration-200
                  active:scale-[0.97]
                "
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Explore Courses
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <button
                className="
                  group inline-flex items-center gap-2.5
                  h-12 px-7 rounded-sm
                  border border-[#2A2A2A]
                  text-[#FAFAFA] text-sm font-medium
                  hover:border-[#FF5C00] hover:text-[#FF5C00]
                  transition-all duration-200
                  active:scale-[0.97]
                "
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                <div className="w-7 h-7 rounded-full border border-current flex items-center justify-center flex-shrink-0">
                  <Play size={10} className="ml-0.5" fill="currentColor" />
                </div>
                Watch Demo
              </button>
            </motion.div>

            {/* Refund callout */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-10 inline-flex items-center gap-3 px-4 py-2.5 border border-[#1E1E1E] rounded-sm"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <p
                className="text-[#888888] text-xs"
                style={{ fontFamily: "DM Mono, monospace" }}
              >
                Complete &amp; score ≥ 80% → full refund guaranteed
              </p>
            </motion.div>
          </div>

          {/* Right: Abstract UI visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <HeroVisual />
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-20 pt-10 border-t border-[#1E1E1E]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s: Stat) => (
              <div key={s.label}>
                <p
                  className="text-[#FAFAFA] mb-1"
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.value}
                </p>
                <p
                  className="text-[#555555] text-sm"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ——— Abstract hero visual ——— */
function HeroVisual() {
  return (
    <div className="relative w-full aspect-square max-w-[520px] ml-auto">
      {/* Outer border frame */}
      <div className="absolute inset-0 border border-[#1E1E1E] rounded-sm line-grid opacity-40" />

      {/* Course progress card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute top-8 left-8 right-20 bg-[#111111] border border-[#1E1E1E] rounded-sm p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="section-label text-[10px] mb-1">Currently Learning</p>
            <p
              className="text-[#FAFAFA] text-sm font-semibold"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Full Stack Development
            </p>
          </div>
          <span className="text-[#FF5C00] text-xs font-mono">88%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF5C00] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "68%" }}
            transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
          />
        </div>
        {/* Modules */}
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= 5 ? "bg-[#FF5C00]" : "bg-[#1E1E1E]"
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Exam result card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-24 right-6 w-48 bg-[#111111] border border-[#1E1E1E] rounded-sm p-4"
      >
        <p className="section-label text-[10px] mb-3">Module 5 Exam</p>
        <div className="flex items-end justify-between">
          <div>
            <p
              className="text-[#FAFAFA] text-2xl font-bold"
              style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.04em" }}
            >
              88
            </p>
            <p className="text-[#555555] text-xs">/100 marks</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-sm font-mono">
              PASS
            </span>
          </div>
        </div>
        <div className="mt-3 h-px bg-[#1E1E1E]" />
        <p className="text-[#555555] text-xs mt-2 font-mono">Refund eligibility ↑</p>
      </motion.div>

      {/* Refund badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute bottom-6 left-8 flex items-center gap-3 bg-[#111111] border border-[#FF5C00]/30 rounded-sm px-4 py-3"
      >
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <div>
          <p
            className="text-[#FAFAFA] text-xs font-semibold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Refund Unlocked
          </p>
          <p className="text-[#555555] text-[10px] font-mono">₹12,999 → returning</p>
        </div>
      </motion.div>

      {/* Floating module tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute top-36 right-4 flex flex-col gap-2"
      >
        {["React.js", "Node.js", "MongoDB"].map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1 + i * 0.1 }}
            className="px-3 py-1 border border-[#1E1E1E] text-[#555555] text-xs rounded-sm font-mono"
          >
            {tag}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
