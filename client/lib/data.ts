// ============================================================
// COURSES DATA
// ============================================================
export const courses = [
  {
    id: 1,
    title: "Artificial Intelligence Fundamentals",
    description:
      "Master AI from basics to advanced. Learn machine learning algorithms, neural networks, NLP, and build intelligent systems with Python.",
    level: "Beginner → Advanced",
    duration: "5 Months",
    modules: 14,
    tag: "Most Popular",
    price: "₹11,999",
  },
  {
    id: 2,
    title: "Machine Learning & Deep Learning",
    description:
      "Deep dive into ML models, supervised/unsupervised learning, TensorFlow, PyTorch. Build recommendation systems and computer vision apps.",
    level: "Intermediate",
    duration: "4 Months",
    modules: 12,
    tag: "Trending",
    price: "₹10,999",
  },
  {
    id: 3,
    title: "Cybersecurity & Ethical Hacking",
    description:
      "Learn network security, penetration testing, firewalls, encryption. Get hands-on with Kali Linux and build secure systems.",
    level: "Intermediate",
    duration: "6 Months",
    modules: 16,
    tag: "High Demand",
    price: "₹12,999",
  },
  {
    id: 4,
    title: "Data Science & Analytics",
    description:
      "Master data manipulation with Pandas, visualization with Matplotlib, statistical analysis, and predictive modeling with real datasets.",
    level: "Beginner → Advanced",
    duration: "4 Months",
    modules: 11,
    tag: "Bestseller",
    price: "₹9,999",
  },
  {
    id: 5,
    title: "Data Structures & Algorithms",
    description:
      "Crack tech interviews. 400+ DSA problems, design patterns, system design for FAANG. LeetCode-style practice with solutions.",
    level: "Advanced",
    duration: "5 Months",
    modules: 18,
    tag: "Interview Prep",
    price: "₹9,999",
  },
  {
    id: 6,
    title: "Full Stack Web Development",
    description:
      "Master MERN stack from scratch. Build production-ready applications with React, Node.js, MongoDB, and AWS deployment.",
    level: "Beginner → Advanced",
    duration: "6 Months",
    modules: 13,
    tag: "New",
    price: "₹11,999",
  },
  {
    id: 7,
    title: "Python for Everyone",
    description:
      "Learn Python programming from zero. Variables, loops, functions, OOP, file handling, and real-world automation projects.",
    level: "Beginner",
    duration: "2 Months",
    modules: 8,
    tag: "Beginner-Friendly",
    price: "₹4,999",
  },
  {
    id: 8,
    title: "Cloud Computing & DevOps",
    description:
      "Master AWS, Docker, Kubernetes, CI/CD pipelines. Deploy applications at scale and become a DevOps engineer.",
    level: "Intermediate",
    duration: "4 Months",
    modules: 10,
    tag: "Emerging Tech",
    price: "₹10,999",
  },
];

// ============================================================
// WHY CHOOSE US
// ============================================================
export const reasons = [
  {
    number: "01",
    title: "Expert Instructors",
    description:
      "Learn from engineers who've built production systems at scale. No theory-only teachers.",
  },
  {
    number: "02",
    title: "Project-First Learning",
    description:
      "Every module ends with a real project. You ship code, not just watch videos.",
  },
  {
    number: "03",
    title: "Structured Curriculum",
    description:
      "Carefully sequenced modules that build on each other. No random jumping around.",
  },
  {
    number: "04",
    title: "Career Acceleration",
    description:
      "Resume reviews, mock interviews, and job referrals built into the program.",
  },
  {
    number: "05",
    title: "Refund on Completion",
    description:
      "Complete your course, pass the exam, and claim your money back. We bet on you.",
  },
  {
    number: "06",
    title: "Lifetime Access",
    description:
      "Your enrollment never expires. Access updated content, new modules, and community forever.",
  },
];

// ============================================================
// PLATFORM FEATURES
// ============================================================
export const platformFeatures = [
  {
    icon: "layers",
    title: "Course Builder",
    description: "Faculty create courses with drag-and-drop modules, video lessons, text content, and downloadable resources.",
  },
  {
    icon: "play",
    title: "Smart Video Player",
    description: "Resume where you left off. Speed controls, chapter markers, and offline download support.",
  },
  {
    icon: "bar-chart",
    title: "Progress Tracking",
    description: "Real-time progress bars per module and overall course. See exactly where every student stands.",
  },
  {
    icon: "clipboard",
    title: "MCQ Exam Engine",
    description: "Timed exams with anti-cheat detection. Tab-switch monitoring, randomized questions, instant results.",
  },
  {
    icon: "rotate-ccw",
    title: "Refund Eligibility",
    description: "Automated refund tracking based on completion %, exam scores, and time constraints. 100% transparent.",
  },
  {
    icon: "activity",
    title: "Analytics Dashboard",
    description: "Admin and faculty get full visibility into revenue, engagement, course performance, and refund data.",
  },
];

// ============================================================
// TESTIMONIALS
// ============================================================
export const testimonials = [
  {
    name: "Aryan Mehta",
    role: "SDE-1 at Razorpay",
    content:
      "Joined with zero backend knowledge. 5 months later, I shipped my first production API at a funded startup. The refund was a bonus I actually claimed.",
    initials: "AM",
  },
  {
    name: "Priya Sharma",
    role: "Frontend Dev at Groww",
    content:
      "The React course isn't just tutorials — it's how actual engineers think. The exam system kept me accountable throughout.",
    initials: "PS",
  },
  {
    name: "Siddharth Roy",
    role: "Freelancer → Full-time",
    content:
      "Went from ₹500 freelance gigs to ₹1.2L/month package. The project-first approach made my portfolio undeniable.",
    initials: "SR",
  },
  {
    name: "Neha Banerjee",
    role: "CS Student, NIT",
    content:
      "DSA + System Design course broke down concepts I'd been struggling with for 2 years. Got my Infosys offer in Month 4.",
    initials: "NB",
  },
];

// ============================================================
// STATS
// ============================================================
export const stats = [
  { value: "4,200+", label: "Students Enrolled" },
  { value: "96%", label: "Completion Rate" },
  { value: "₹38L+", label: "Refunds Processed" },
  { value: "4.9/5", label: "Average Rating" },
];

export type Stat = (typeof stats)[number];

// ============================================================
// LEARNING STEPS
// ============================================================
export const learningSteps = [
  {
    step: "01",
    title: "Enroll & Unlock",
    description: "Purchase your course and instantly access the full structured curriculum.",
  },
  {
    step: "02",
    title: "Learn by Module",
    description: "Work through videos, text lessons, and downloadable resources — at your pace.",
  },
  {
    step: "03",
    title: "Attempt Exams",
    description: "Clear module exams and the final assessment to prove your understanding.",
  },
  {
    step: "04",
    title: "Claim Your Refund",
    description: "Meet the completion + score criteria and get your investment back automatically.",
  },
];
