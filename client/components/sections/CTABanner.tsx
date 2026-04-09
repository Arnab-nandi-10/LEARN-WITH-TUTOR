"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export default function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0F0F0F" }}
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="border border-[#1E1E1E] rounded-sm p-10 md:p-16 relative overflow-hidden">
          {/* Dot grid bg */}
          <div className="absolute inset-0 dot-grid opacity-30" />

          {/* Accent corner */}
          <div
            className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, rgba(255,92,0,0.05) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="section-label mb-5"
            >
              Limited Cohort
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#FAFAFA] mb-5"
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Start learning today.
              <br />
              <span className="text-[#FF5C00]">Get your money back</span> tomorrow.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-[#888888] text-base mb-8 leading-relaxed"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Join 4,200+ engineers who bet on themselves — and won.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="#courses"
                className="
                  group inline-flex items-center gap-2
                  h-12 px-8 rounded-sm
                  bg-[#FF5C00] hover:bg-[#FF7A30]
                  text-white text-sm font-semibold
                  transition-all duration-200 active:scale-[0.97]
                "
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Browse Courses
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link
                href="#contact"
                className="
                  h-12 px-8 rounded-sm
                  border border-[#2A2A2A] hover:border-[#FF5C00]
                  text-[#888888] hover:text-[#FF5C00]
                  text-sm font-medium
                  transition-all duration-200
                "
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                Talk to Us
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-5 mt-8"
            >
              {[
                "Secure Payment via Paytm",
                "Lifetime Access",
                "Refund Eligible",
              ].map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-2 text-[#333333] text-xs font-mono"
                >
                  <span className="w-1 h-1 rounded-full bg-[#FF5C00]" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
