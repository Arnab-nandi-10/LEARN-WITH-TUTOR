import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Courses", href: "#courses" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Refund Policy", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#about" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Refund Terms", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer
      className="border-t border-[#1E1E1E]"
      style={{ background: "#0A0A0A" }}
      id="contact"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Main footer */}
        <div className="py-14 grid md:grid-cols-[1.5fr_repeat(3,1fr)] gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#FF5C00] rounded-sm flex items-center justify-center flex-shrink-0">
                <span
                  className="text-white font-bold text-xs"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  TL
                </span>
              </div>
              <span
                className="text-[#FAFAFA] font-semibold text-sm"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Tutor Labs
              </span>
            </Link>

            <p
              className="text-[#555555] text-sm leading-relaxed mb-6 max-w-xs"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Premium coding education with a performance-based refund system.
              Built by engineers, for engineers.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { icon: <Mail size={12} />, text: "contact@tutorlabs.com" },
                { icon: <Phone size={12} />, text: "+91 62910 74147" },
                { icon: <MapPin size={12} />, text: "Kolkata, West Bengal – 700 063" },
              ].map((c) => (
                <div key={c.text} className="flex items-center gap-2.5 text-[#555555]">
                  {c.icon}
                  <span className="text-xs" style={{ fontFamily: "DM Mono, monospace" }}>
                    {c.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="flex gap-3">
              {[
                { icon: <Github size={15} />, href: "#" },
                { icon: <Twitter size={15} />, href: "#" },
                { icon: <Linkedin size={15} />, href: "#" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="
                    w-8 h-8 rounded-sm border border-[#1E1E1E]
                    flex items-center justify-center
                    text-[#555555] hover:text-[#FF5C00] hover:border-[#FF5C00]/40
                    transition-all duration-200
                  "
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p
                className="text-[#FAFAFA] text-xs font-semibold mb-5 tracking-widest uppercase"
                style={{ fontFamily: "DM Mono, monospace" }}
              >
                {category}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[#555555] hover:text-[#888888] text-sm transition-colors duration-200"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E1E1E] py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-[#333333] text-xs"
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            © {new Date().getFullYear()} Tutor Labs. All rights reserved.
          </p>
          <p
            className="text-[#333333] text-xs"
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            learning.tutorlabs.com
          </p>
        </div>
      </div>
    </footer>
  );
}
