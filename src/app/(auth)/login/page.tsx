"use client";

import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-card p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">
          💳
        </div>

        <h1 className="text-3xl font-bold">
          Welcome to Duely
        </h1>

        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          Securely manage your credit card bills.
        </p>
      </div>

      <button
        onClick={signInWithGoogle}
        className="w-full h-12 rounded-2xl bg-primary hover:opacity-90 transition mt-8 font-medium text-white"
      >
        Continue with Google
      </button>

      <p className="text-xs text-slate-500 text-center mt-6 leading-relaxed">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}