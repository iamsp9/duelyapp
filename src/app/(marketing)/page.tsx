import Link from "next/link";
import {
  ShieldCheck,
  BellRing,
  CreditCard,
  LockKeyhole,
  Smartphone,
  Zap,
  DatabaseBackup
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-slate-50 selection:bg-blue-500/30 flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-12 lg:pt-32 lg:pb-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 flex-grow w-full">
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-blue-600/20 blur-[100px] lg:blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[250px] lg:w-[400px] h-[250px] lg:h-[400px] bg-purple-600/10 blur-[100px] lg:blur-[120px] rounded-full pointer-events-none" />

        {/* Left Column: Copy & CTA */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
          <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs sm:text-sm text-blue-200 mb-6 lg:mb-8 backdrop-blur-md">
            <LockKeyhole className="size-4 mr-2" />
            End-to-End Encryption
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Your credit cards, <br className="hidden lg:block" />
            <span className="text-blue-500 bg-none">securely mastered.</span>
          </h1>

          <p className="mt-4 lg:mt-6 text-base sm:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl lg:max-w-xl">
            Duely helps you track billing cycles, due dates, and outstanding balances.
            Everything is encrypted on your device before it ever reaches our servers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 lg:mt-10 w-full sm:w-auto">
            <Link
              href="/login"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center font-semibold text-white shadow-lg shadow-blue-500/20 text-sm sm:text-base"
            >
              Start Tracking Free
            </Link>

            <Link
              href="/security"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center font-medium text-slate-300 backdrop-blur-md text-sm sm:text-base"
            >
              Read the Security Overview
            </Link>
          </div>
        </div>

        {/* Right Column: Mobile Mockup (Hidden on mobile/tablet, visible on desktop) */}
        <div className="hidden lg:flex flex-1 w-full max-w-md lg:max-w-none justify-center z-10 mt-12 lg:mt-0 relative">
          {/* Decorative elements behind phone */}
          <div className="absolute top-10 -right-4 size-24 bg-blue-500/20 rounded-2xl rotate-12 blur-xl"></div>
          <div className="absolute bottom-10 -left-4 size-32 bg-purple-500/20 rounded-full blur-xl"></div>

          {/* CSS Phone Frame */}
          <div className="relative border-slate-800 dark:border-slate-800 bg-slate-800 border-[14px] rounded-[2.5rem] h-[600px] w-[280px] sm:w-[300px] shadow-2xl shadow-black/50 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
            {/* Notch */}
            <div className="w-[120px] h-[18px] bg-slate-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
            {/* Buttons */}
            <div className="h-[46px] w-[3px] bg-slate-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-slate-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-slate-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-900 relative">
              {/* Fallback Glassmorphism UI */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-blue-900 flex flex-col pt-14 px-5">
                <div className="h-8 w-32 bg-white/10 rounded-lg mb-6"></div>
                <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 rounded-2xl mb-4 backdrop-blur-md p-4">
                  <div className="h-4 w-20 bg-white/20 rounded mb-2"></div>
                  <div className="h-8 w-32 bg-white/30 rounded mb-8"></div>
                  <div className="h-4 w-full bg-white/10 rounded"></div>
                </div>
                <div className="h-20 bg-white/5 rounded-2xl mb-3 border border-white/5"></div>
                <div className="h-20 bg-white/5 rounded-2xl mb-3 border border-white/5"></div>
                <div className="h-20 bg-white/5 rounded-2xl mb-3 border border-white/5"></div>
              </div>

              {/* Actual Screenshot Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mockup.png"
                alt="Duely Mobile Interface"
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 max-w-6xl mx-auto border-t border-white/5 w-full relative z-10 bg-[var(--background)]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Built for peace of mind</h2>
          <p className="text-slate-400 mt-4">We believe your financial data belongs strictly to you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
          <FeatureCard
            icon={<CreditCard className="size-6 text-blue-400" />}
            title="Unified Dashboard"
            description="View all your payment cycles, outstanding amounts, and historical payments across all cards in a single, clean interface."
          />
          <FeatureCard
            icon={<ShieldCheck className="size-6 text-emerald-400" />}
            title="Client-Side Encryption"
            description="Your vault is secured using AES-GCM encryption. We cannot see your balances, your card names, or your notes."
          />
          <FeatureCard
            icon={<BellRing className="size-6 text-amber-400" />}
            title="Smart Reminders"
            description="Get notified before your due dates hit. Avoid late fees and protect your credit score effortlessly."
          />
          <FeatureCard
            icon={<Smartphone className="size-6 text-pink-400" />}
            title="Cross-Device Sync"
            description="Your encrypted blobs are synchronized seamlessly. Access your updated card status on your phone or laptop."
          />
          <FeatureCard
            icon={<Zap className="size-6 text-yellow-400" />}
            title="Instant Insights"
            description="Quickly understand what's due this week versus next month, helping you manage your cash flow."
          />
          <FeatureCard
            icon={<DatabaseBackup className="size-6 text-indigo-400" />}
            title="Encrypted Backups"
            description="Export your encrypted vault at any time. Your data is fully portable and can be safely backed up to your personal cloud."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-white/[0.01] py-12 mt-auto relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Duely. All rights reserved.
          </div>

          <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-sm font-medium">
            <Link
              href="/privacy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="mailto:contact@duely.co.in"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              contact@duely.co.in
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors group">
      <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/10 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-200">
        {title}
      </h3>
      <p className="mt-3 text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}