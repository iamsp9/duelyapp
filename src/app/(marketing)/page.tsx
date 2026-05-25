import Link from "next/link";
import {
  ShieldCheck,
  BellRing,
  CreditCard,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <section className="px-6 pt-24 pb-20 max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 mb-6 backdrop-blur-xl">
            🔐 End-to-end encrypted credit card tracking
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Never miss a
            <span className="text-blue-500">
              {" "}credit card{" "}
            </span>
            payment again.
          </h1>

          <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
            Duely helps you track bills, due dates,
            payments, and outstanding balances securely
            across all your devices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link
              href="/login"
              className="h-12 px-6 rounded-2xl bg-[var(--primary)] hover:opacity-90 transition flex items-center justify-center font-medium text-white"
            >
              Get Started
            </Link>

            <Link
              href="/security"
              className="h-12 px-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center font-medium"
            >
              Security
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-24">
          <FeatureCard
            icon={<CreditCard className="size-5" />}
            title="Track All Cards"
            description="Manage multiple credit cards and payment cycles in one place."
          />

          <FeatureCard
            icon={<BellRing className="size-5" />}
            title="Due Date Alerts"
            description="Get notified before due dates and avoid late payment charges."
          />

          <FeatureCard
            icon={<ShieldCheck className="size-5" />}
            title="Encrypted Vault"
            description="Your financial data stays encrypted locally before syncing."
          />
        </div>
      </section>
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
    <div className="rounded-3xl border border-white/10 bg-[var(--card)] p-6 backdrop-blur-xl">
      <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}