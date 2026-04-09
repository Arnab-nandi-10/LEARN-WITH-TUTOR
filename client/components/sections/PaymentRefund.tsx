"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Lock, RefreshCw } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const plans = [
  {
    name: "Single Course",
    price: "₹7,999",
    subtext: "starting from",
    description: "Access one complete course with all modules, exams, and resources.",
    features: [
      "Full course access",
      "Module-wise exams",
      "Final exam",
      "Resources & downloads",
      "Refund eligibility",
    ],
    cta: "Enroll",
    highlight: false,
  },
  {
    name: "All Access",
    price: "₹19,999",
    subtext: "one-time",
    description: "Unlimited access to all current and future courses on the platform.",
    features: [
      "All courses unlocked",
      "Priority support",
      "All exams included",
      "New courses as added",
      "Full refund eligibility",
      "Certificate of completion",
    ],
    cta: "Get All Access",
    highlight: true,
  },
  {
    name: "Custom Bundle",
    price: "Custom",
    subtext: "contact us",
    description: "Pick 2–4 courses and get a negotiated bundle price for your team.",
    features: [
      "Choose your courses",
      "Team accounts",
      "Shared analytics",
      "Bulk enrollment",
      "Priority onboarding",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

const refundSteps = [
  { label: "Complete all modules", detail: "100% course completion required" },
  { label: "Score ≥ 80% on final exam", detail: "Admin-configurable threshold" },
  { label: "No cheating flags", detail: "Tab-switch or fullscreen violations" },
  { label: "Within 1 year", detail: "From enrollment date" },
];

export default function PaymentRefund() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section
      className="py-section border-t border-[#1E1E1E]"
      style={{ background: "#0F0F0F" }}
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeader
          label="Pricing"
          title={
            <>
              Invest in yourself.
              <br />
              <span className="text-[#FF5C00]">Get it back.</span>
            </>
          }
          subtitle="Transparent pricing. Secure payments via Paytm. Refunds processed when you earn them."
          align="center"
        />

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`
                relative flex flex-col p-7 rounded-sm border transition-all duration-300
                ${plan.highlight
                  ? "bg-[#111111] border-[#FF5C00]/40"
                  : "bg-[#0A0A0A] border-[#1E1E1E] hover:border-[#2A2A2A]"
                }
              `}
            >
              {plan.highlight && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 px-4 py-0.5 bg-[#FF5C00] text-white text-[10px] font-mono tracking-widest uppercase rounded-b-sm">
                  Best Value
                </span>
              )}

              {/* Plan name */}
              <p
                className="text-[#888888] text-xs font-mono uppercase tracking-widest mb-4"
              >
                {plan.name}
              </p>

              {/* Price */}
              <div className="mb-1">
                <span
                  className="text-[#FAFAFA]"
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {plan.price}
                </span>
              </div>
              <p className="text-[#555555] text-xs font-mono mb-5">{plan.subtext}</p>

              <p
                className="text-[#555555] text-sm leading-relaxed mb-6"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {plan.description}
              </p>

              <div className="h-px bg-[#1E1E1E] mb-6" />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check size={13} className="text-green-400 flex-shrink-0" />
                    <span
                      className="text-[#888888] text-sm"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`
                  w-full h-11 rounded-sm text-sm font-semibold
                  transition-all duration-200 active:scale-[0.98]
                  ${plan.highlight
                    ? "bg-[#FF5C00] hover:bg-[#FF7A30] text-white"
                    : "bg-[#161616] hover:bg-[#1E1E1E] border border-[#1E1E1E] text-[#888888] hover:text-[#FAFAFA]"
                  }
                `}
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Refund Logic */}
        <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#1E1E1E] flex items-center gap-3">
            <RefreshCw size={16} className="text-[#FF5C00]" />
            <h3
              className="text-[#FAFAFA] font-semibold"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              How the Refund Works
            </h3>
            <span className="ml-auto text-[#555555] text-xs font-mono flex items-center gap-1.5">
              <Lock size={10} />
              Admin controlled
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E1E1E]">
            {refundSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.09 }}
                className="p-6"
              >
                <div className="w-7 h-7 rounded-sm bg-[#111111] border border-[#1E1E1E] flex items-center justify-center mb-4">
                  <span className="text-[#FF5C00] text-xs font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p
                  className="text-[#FAFAFA] text-sm font-semibold mb-1"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {step.label}
                </p>
                <p
                  className="text-[#555555] text-xs"
                  style={{ fontFamily: "DM Mono, monospace" }}
                >
                  {step.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
