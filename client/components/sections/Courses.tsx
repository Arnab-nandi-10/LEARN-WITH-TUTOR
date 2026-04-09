"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Layers, ArrowUpRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { courses } from "@/lib/data";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Courses() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Temporarily disable animation to debug first card visibility
      // gsap.from(".course-card", {
      //   opacity: 0,
      //   y: 40,
      //   stagger: 0.08,
      //   duration: 0.8,
      //   ease: "power3.out",
      //   scrollTrigger: {
      //     trigger: gridRef.current,
      //     start: "top 80%",
      //     once: true,
      //     invalidateOnRefresh: true,
      //   },
      // });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="courses"
      className="py-section max-w-7xl mx-auto px-5 sm:px-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <SectionHeader
          label="Curriculum"
          title={
            <>
              Courses built for
              <br />
              <span className="text-[#FF5C00]">real engineers.</span>
            </>
          }
          subtitle="Each course is a structured path from foundations to production-ready skills."
        />
        <Link
          href="#"
          className="
            flex-shrink-0 inline-flex items-center gap-2
            text-sm text-[#888888] hover:text-[#FAFAFA]
            border border-[#1E1E1E] hover:border-[#2A2A2A]
            px-5 h-10 rounded-sm
            transition-all duration-200 mb-14 md:mb-0 self-start md:self-auto
          "
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          View All Courses
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: (typeof courses)[0] }) {
  return (
    <div
      className="
        course-card group
        relative flex flex-col
        bg-[#111111] border border-[#1E1E1E]
        rounded-sm p-6
        hover:border-[#2A2A2A] hover:-translate-y-1
        transition-all duration-300
        cursor-pointer
      "
    >
      {/* Tag */}
      <div className="flex items-center justify-between mb-5">
        <span
          className="px-2.5 py-1 bg-[#FF5C00]/10 text-[#FF5C00] text-[10px] rounded-sm"
          style={{ fontFamily: "DM Mono, monospace", letterSpacing: "0.05em" }}
        >
          {course.tag}
        </span>
        <ArrowUpRight
          size={14}
          className="text-[#333333] group-hover:text-[#FF5C00] transition-colors duration-200"
        />
      </div>

      {/* Title */}
      <h3
        className="text-[#FAFAFA] text-base font-semibold mb-2 leading-snug"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        {course.title}
      </h3>

      {/* Description */}
      <p
        className="text-[#555555] text-sm leading-relaxed flex-1 mb-6"
        style={{ fontFamily: "DM Sans, sans-serif" }}
      >
        {course.description}
      </p>

      {/* Meta */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center gap-2 text-[#555555] text-xs">
          <Clock size={12} />
          <span style={{ fontFamily: "DM Mono, monospace" }}>{course.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-[#555555] text-xs">
          <Layers size={12} />
          <span style={{ fontFamily: "DM Mono, monospace" }}>
            {course.modules} modules · {course.level}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1E1E1E] mb-4" />

      {/* Price + CTA */}
      <div className="flex items-center justify-between">
        <span
          className="text-[#FAFAFA] font-bold"
          style={{ fontFamily: "Syne, sans-serif", fontSize: "1.125rem" }}
        >
          {course.price}
        </span>
        <button
          className="
            text-xs px-4 h-8 rounded-sm
            bg-[#1E1E1E] hover:bg-[#FF5C00]
            text-[#888888] hover:text-white
            transition-all duration-200
          "
          style={{ fontFamily: "Syne, sans-serif", fontWeight: 600 }}
        >
          Enroll
        </button>
      </div>
    </div>
  );
}
