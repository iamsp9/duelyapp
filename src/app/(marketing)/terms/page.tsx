import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-slate-300">

      {/* Navigation Quick Links */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-6">
        <Link
          href="/"
          className="group flex items-center space-x-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
        >
          <span className="inline-block transform group-hover:-translate-x-1 transition-transform duration-200">
            ←
          </span>
          <span>Back to Home</span>
        </Link>

        <Link 
          href="/login"
          className="text-xs font-semibold tracking-wide uppercase px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 rounded-lg text-zinc-300 hover:text-white transition-all duration-200"
        >
          Go to Login
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
      <p className="mb-8 text-sm text-slate-500">Last Updated: May 26, 2026</p>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Duely ("the App"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
          <p>
            Duely is a personal utility application designed to help users track credit card due dates and balances. 
            <strong> Duely is not a financial advisor, bank, or payment processor.</strong> The App does not facilitate actual money transfers or bill payments.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities & Data Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your master password and Google account access. 
            Because Duely utilizes client-side encryption, <strong>if you lose your master password or recovery key, we cannot recover your vault data.</strong>
          </p>
          <p className="mt-4">
            You agree to input accurate information and are solely responsible for physically paying your credit card bills on time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">4. Limitation of Liability</h2>
          <p>
            While Duely provides reminders and tracking features, we do not guarantee the accuracy of notifications. 
            In no event shall Duely, its developers, or affiliates be liable for any late fees, interest charges, credit score impacts, or direct/indirect damages arising from your reliance on the App, missed payments, or app downtime.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Modifications to Service</h2>
          <p>
            We reserve the right to modify or discontinue the Service (or any part thereof) with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
          </p>
        </section>
      </div>
    </main>
  );
}