import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-white space-y-12">
      
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

      {/* Header Section */}
      <div className="space-y-4 border-b border-zinc-800 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Security Architecture
        </h1>
        <p className="text-lg text-zinc-400">
          Industry-standard, zero-knowledge encryption designed to keep your private data completely secure.
        </p>
      </div>

      {/* Core Principle / Zero Knowledge */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center space-x-3 text-zinc-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-zinc-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <h2 className="text-xl font-bold">Zero-Knowledge Trust Model</h2>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Your data belongs to you alone. We use a strict Zero-Knowledge architecture, meaning your master secret keys are generated and held entirely on your local machine. Your plain text items are never sent to our servers, giving you absolute ownership over your encrypted vault.
        </p>
      </section>

      {/* Highlights Grid */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-500">
          How Your Data Is Protected
        </h3>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="p-5 border border-zinc-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-zinc-200 text-sm">Strong Encryption</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              All data stored within your personal vault is secured using <strong>AES-256-GCM authenticated encryption</strong> before being backed up.
            </p>
          </div>

          <div className="p-5 border border-zinc-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-zinc-200 text-sm">Key Protection</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              We employ cryptographic key stretching techniques via the <strong>PBKDF2 standard</strong> to make unauthorized brute-force attempts impractical.
            </p>
          </div>

          <div className="p-5 border border-zinc-800 rounded-lg space-y-2">
            <h4 className="font-semibold text-zinc-200 text-sm">Secure Cloud Sync</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Your data is encrypted safely in your device memory before transmitting completely scrambled ciphertext backups over encrypted TLS connections.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}