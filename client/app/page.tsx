import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import MarqueeTicker from "@/components/ui/MarqueeTicker";
import Courses from "@/components/sections/Courses";
import WhyUs from "@/components/sections/WhyUs";
import PlatformFeatures from "@/components/sections/PlatformFeatures";
import LearningExperience from "@/components/sections/LearningExperience";
import ExamSection from "@/components/sections/ExamSection";
import PaymentRefund from "@/components/sections/PaymentRefund";
import Testimonials from "@/components/sections/Testimonials";
import CTABanner from "@/components/sections/CTABanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <MarqueeTicker />
      <Courses />
      <WhyUs />
      <PlatformFeatures />
      <LearningExperience />
      <ExamSection />
      <PaymentRefund />
      <Testimonials />
      <CTABanner />
      <Footer />
    </main>
  );
}
