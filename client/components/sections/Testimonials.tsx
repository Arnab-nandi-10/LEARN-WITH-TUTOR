"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0A0A0A" }}
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeader
          label="Students"
          title={
            <>
              What builders
              <br />
              <span className="text-[#FF5C00]">say about us.</span>
            </>
          }
          subtitle="Real students. Real outcomes. Verified results."
          align="center"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="
                group flex flex-col
                bg-[#111111] border border-[#1E1E1E]
                rounded-sm p-6
                hover:border-[#2A2A2A]
                transition-all duration-300
              "
            >
              {/* Quote icon */}
              <Quote
                size={20}
                className="text-[#FF5C00] mb-4 opacity-60"
                fill="currentColor"
              />

              {/* Content */}
              <p
                className="text-[#888888] text-sm leading-relaxed flex-1 mb-6"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {t.content}
              </p>

              {/* Divider */}
              <div className="h-px bg-[#1E1E1E] mb-4" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-9 h-9 rounded-sm bg-[#FF5C00]/10
                    border border-[#FF5C00]/20
                    flex items-center justify-center flex-shrink-0
                    text-[#FF5C00] text-xs font-bold
                  "
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {t.initials}
                </div>
                <div>
                  <p
                    className="text-[#FAFAFA] text-sm font-semibold leading-tight"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {t.name}
                  </p>
                  <p className="text-[#555555] text-xs mt-0.5" style={{ fontFamily: "DM Mono, monospace" }}>
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center"
        >
          <p className="text-[#333333] text-xs font-mono">
            4.9/5 average rating · 4,200+ students · 96% completion rate
          </p>
        </motion.div>
      </div>
    </section>
  );
}
