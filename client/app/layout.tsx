import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Syne } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Tutor Labs — Learn. Build. Refund.",
  description:
    "Premium coding education platform. Master full-stack development, crack exams, and earn your refund. Built by Tutor Labs.",
  keywords: ["coding", "eLearning", "full stack", "MERN", "courses", "Tutor Labs"],
  authors: [{ name: "Tutor Labs" }],
  openGraph: {
    title: "Tutor Labs — Learn. Build. Refund.",
    description: "Premium coding education platform. Master full-stack development.",
    url: "https://learning.tutorlabs.com",
    siteName: "Tutor Labs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="noise min-h-screen bg-bg-primary font-body text-text-primary antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
