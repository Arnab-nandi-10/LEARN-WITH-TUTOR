"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/stores/authStore";
import { toast } from "sonner";

const navLinks = [
  { label: "Courses", href: "#courses" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboardPage = pathname?.startsWith('/student') || 
                         pathname?.startsWith('/faculty') || 
                         pathname?.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Don't show navbar on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A0A0A]/95 border-b border-[#1E1E1E] backdrop-blur-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#FF5C00] rounded-sm flex items-center justify-center flex-shrink-0">
              <span
                className="text-white font-bold text-xs"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                TL
              </span>
            </div>
            <span
              className="text-[#FAFAFA] font-semibold text-sm tracking-tight hidden sm:block"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Tutor Labs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isDashboardPage && navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[#888888] hover:text-[#FAFAFA] text-sm transition-colors duration-200 font-medium"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {link.label}
              </a>
            ))}
            
            {/* Auth Buttons */}
            {isAuthenticated && user ? (
              <>
                <Link
                  href={
                    user.role === 'student'
                      ? '/student/dashboard'
                      : user.role === 'faculty'
                      ? '/faculty/dashboard'
                      : '/admin/dashboard'
                  }
                  className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-[#161616] border border-[#1E1E1E] rounded-md text-[#FAFAFA] hover:bg-[#2A2A2A] transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login?portal=admin"
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#FAFAFA] transition-colors"
                >
                  Admin Access
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-[#FAFAFA] hover:text-[#FF5C00] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm bg-[#FF5C00] text-white rounded-md hover:bg-[#FF7A30] transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#888888] hover:text-[#FAFAFA] transition-colors p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#0F0F0F]/98 border-b border-[#1E1E1E] backdrop-blur-lg px-5 py-6 md:hidden"
          >
            <div className="flex flex-col gap-5">
              {!isDashboardPage && navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[#888888] hover:text-[#FAFAFA] text-base font-medium transition-colors"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              <hr className="border-[#1E1E1E]" />
              
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={
                      user.role === 'student'
                        ? '/student/dashboard'
                        : user.role === 'faculty'
                        ? '/faculty/dashboard'
                        : '/admin/dashboard'
                    }
                    className="text-[#FAFAFA] text-base font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="text-left text-red-500 text-base font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login?portal=admin"
                    className="text-[#888888] text-base font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Access
                  </Link>
                  <Link
                    href="/login"
                    className="text-[#FAFAFA] text-base font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="w-full text-center py-3 rounded-md text-sm font-semibold bg-[#FF5C00] text-white hover:bg-[#FF7A30] transition-colors"
                    style={{ fontFamily: "Syne, sans-serif" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
