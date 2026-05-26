import Link from "next/link";

export default function PrivacyPage() {
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


      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <p className="mb-8 text-sm text-slate-500">Last Updated: May 26, 2026</p>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
          <p>
            Welcome to Duely. We are committed to protecting your personal information and your right to privacy. 
            Because Duely is a financial utility, we built our architecture with a privacy-first approach, utilizing end-to-end encryption for your sensitive vault data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect via Google OAuth</h2>
          <p>When you register or log in using Google OAuth, we collect the following limited profile information provided by your Google account:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Email Address:</strong> Used strictly to identify your account and synchronize your encrypted vault data.</li>
            <li><strong>Basic Profile Information:</strong> Such as your name or avatar, used solely to personalize your dashboard experience.</li>
          </ul>
          <p className="mt-4">
            <strong>We do not access your Google Drive, Contacts, Gmail, or any other sensitive Google services.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">3. Your Encrypted Financial Data</h2>
          <p>
            The credit card names, billing cycles, balances, and notes you enter into Duely are <strong>end-to-end encrypted</strong> locally on your device (using AES-GCM encryption). 
            Our servers only store the encrypted ciphertext. We do not have the decryption keys and cannot read, sell, or share your financial data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">4. How We Use Your Information</h2>
          <p>The information we collect is used in the following ways:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>To facilitate account creation and the logon process securely.</li>
            <li>To synchronize your encrypted database across your authorized devices.</li>
            <li>To send you important system updates or essential account notifications.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention and Account Deletion</h2>
          <p>
            You have full control over your data. You can request the complete deletion of your account and all associated encrypted vault data at any time from the app settings or by contacting us at contact@duely.co.in. Upon deletion, your email and encrypted vault blobs are permanently purged from our database.
          </p>
        </section>
      </div>
    </main>
  );
}