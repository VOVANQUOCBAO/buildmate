"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/badge";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";
type Status = { kind: "idle" | "error" | "info"; message: string };

const supabase = createClient();

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });
  const [pending, setPending] = useState(false);

  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  async function handlePasswordAuth() {
    if (!supabase) return;
    setPending(true);
    setStatus({ kind: "idle", message: "" });

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo, data: { name } }
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
      } else {
        setStatus({ kind: "info", message: "Check your inbox to confirm your email, then sign in." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus({ kind: "error", message: error.message });
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setPending(false);
  }

  async function handleMagicLink() {
    if (!supabase) return;
    if (!email) {
      setStatus({ kind: "error", message: "Enter your email first." });
      return;
    }
    setPending(true);
    setStatus({ kind: "idle", message: "" });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });

    setStatus(
      error
        ? { kind: "error", message: error.message }
        : { kind: "info", message: "Magic link sent. Check your email to finish signing in." }
    );
    setPending(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    if (!supabase) return;
    setPending(true);
    setStatus({ kind: "idle", message: "" });

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });

    if (error) {
      setStatus({ kind: "error", message: error.message });
      setPending(false);
    }
    // On success the browser is redirected to the provider — no further work.
  }

  return (
    <main className="grid-paper min-h-screen px-6 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-slate-600 hover:text-slate-950">
          ← Back to dashboard
        </Link>

        <section className="glass-panel mt-8 rounded-[2rem] p-6">
          <Badge>Builder account</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950">
            {mode === "signin" ? "Welcome back, builder." : "Create your BuildMate account."}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Sign in to save recommendations, sync your profile, and track your build journey across devices.
          </p>

          {!supabase ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
              Running in demo mode — accounts are off until Supabase is configured. Add{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in.
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleOAuth("google")}
                  className="rounded-full border border-slate-950/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleOAuth("github")}
                  className="rounded-full border border-slate-950/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  Continue with GitHub
                </button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                <span className="h-px flex-1 bg-slate-950/10" />
                or
                <span className="h-px flex-1 bg-slate-950/10" />
              </div>

              <div className="flex flex-col gap-3">
                {mode === "signup" ? (
                  <label className="block text-sm font-bold text-slate-700">
                    Name
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                    />
                  </label>
                ) : null}

                <label className="block text-sm font-bold text-slate-700">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </label>

                <label className="block text-sm font-bold text-slate-700">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </label>

                <button
                  type="button"
                  disabled={pending}
                  onClick={handlePasswordAuth}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {mode === "signin" ? "Sign in" : "Create account"}
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={handleMagicLink}
                  className="rounded-full border border-slate-950/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  Email me a magic link
                </button>
              </div>

              {status.kind !== "idle" ? (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    status.kind === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-950"
                      : "border-cyan-200 bg-cyan-50 text-cyan-950"
                  }`}
                >
                  {status.message}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setStatus({ kind: "idle", message: "" });
                }}
                className="mt-6 text-sm font-bold text-slate-600 hover:text-slate-950"
              >
                {mode === "signin"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
