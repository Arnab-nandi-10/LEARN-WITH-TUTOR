"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeader from "@/components/ui/SectionHeader";
import { reasons } from "@/lib/data";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function WhyUs() {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reason-row", {
        opacity: 0,
        x: -30,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, listRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0F0F0F" }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 items-start">
          {/* Left sticky */}
          <div className="lg:sticky lg:top-28">
            <SectionHeader
              label="Why Tutor"
              title={
                <>
                  Not just another
                  <br />
                  <span className="text-[#FF5C00]">coding course.</span>
                </>
              }
              subtitle="We built the platform we wish existed when we were learning. Structured, accountable, and rewarding."
            />

            {/* Quote */}
            <blockquote className="mt-8 pl-4 border-l-2 border-[#FF5C00]">
              <p
                className="text-[#888888] text-sm italic leading-relaxed"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                "The refund model flips the incentive. We only succeed if you
                succeed — so we built the best system we could."
              </p>
              <footer className="mt-3 text-[#555555] text-xs font-mono">
                — Tutor Labs Team
              </footer>
            </blockquote>
          </div>

          {/* Right: Reasons list */}
          <div ref={listRef} className="flex flex-col">
            {reasons.map((reason, i) => (
              <div
                key={reason.number}
                className={`reason-row group flex gap-6 py-6 ${
                  i !== 0 ? "border-t border-[#1E1E1E]" : ""
                } hover:bg-[#111111] -mx-4 px-4 transition-colors duration-200 rounded-sm cursor-default`}
              >
                {/* Number */}
                <span
                  className="text-[#2A2A2A] font-bold flex-shrink-0 pt-0.5 group-hover:text-[#FF5C00] transition-colors duration-300"
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {reason.number}
                </span>

                {/* Content */}
                <div>
                  <h3
                    className="text-[#FAFAFA] font-semibold mb-1.5"
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: "1rem",
                    }}
                  >
                    {reason.title}
                  </h3>
                  <p
                    className="text-[#555555] text-sm leading-relaxed"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
