"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/badge";
import { BUILDMATE_PROFILE_STORAGE_KEY } from "@/lib/profile-storage";
import { createClient } from "@/lib/supabase/client";
import type { BuilderProfile } from "@/lib/types";

const skillOptions = [
  "React",
  "TypeScript",
  "Product Design",
  "Agent orchestration",
  "Vector retrieval",
  "On-chain credentials"
];

const helpOptions = ["Workshops", "Team matches", "Mentors", "Sponsor resources"];

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState("Full-stack builder");
  const [goal, setGoal] = useState("Ship an agentic workflow demo before Demo Day");
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Product Design"]);
  const [needs, setNeeds] = useState<string[]>(["Workshops", "Team matches"]);
  const [saved, setSaved] = useState(false);
  const [builderName, setBuilderName] = useState("Maya Chen");
  const [signedIn, setSignedIn] = useState(false);

  // Prefill the builder's real name (and detect sign-in) from the Supabase session.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setSignedIn(true);
      setBuilderName(
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name) || user.email || "Builder"
      );
    });
  }, []);

  const missingSkills = useMemo(() => {
    return skillOptions.filter((skill) => !skills.includes(skill)).slice(0, 3);
  }, [skills]);

  function toggleValue(value: string, values: string[], setValues: (next: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function saveProfile() {
    const profile: BuilderProfile = {
      name: builderName,
      role,
      goal,
      currentSkills: skills,
      targetSkills: missingSkills
    };

    // Always keep the local copy so the demo + offline flow works instantly.
    window.localStorage.setItem(BUILDMATE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);

    // Persist to the database too when signed in (no-op response otherwise).
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const result = (await response.json().catch(() => null)) as { saved?: boolean } | null;
      // When the profile was persisted for a signed-in user, send them to their dashboard.
      if (result?.saved) {
        router.push("/dashboard");
      }
    } catch {
      // Network/DB unavailable — local copy already saved, so this is non-fatal.
    }
  }

  return (
    <main className="grid-paper min-h-screen px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold text-slate-600 hover:text-slate-950">
          ← Back to dashboard
        </Link>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <Badge>Builder onboarding</Badge>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">
              Tell BuildMate ASG what you are trying to ship.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              Day 3 adds a lightweight intake flow. This currently creates a local preview; the next step is to persist
              it and feed it into the Skill Graph scoring engine.
            </p>

            <label className="mt-6 block text-sm font-bold text-slate-700">
              Role
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-slate-700">
              Goal
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-950/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveProfile()}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                Use this profile
              </button>
              <Link
                href="/"
                className="rounded-full border border-slate-950/10 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950"
              >
                Return to dashboard
              </Link>
            </div>

            {saved ? (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-950">
                {signedIn ? (
                  <>
                    Profile saved. <Link href="/dashboard" className="underline">Open your dashboard →</Link>
                  </>
                ) : (
                  "Profile saved locally. Sign in to sync it and unlock your personal dashboard."
                )}
              </div>
            ) : null}
          </div>

          <div className="dark-card rounded-[2rem] p-6">
            <Badge tone="dark">Profile preview</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">{builderName}</h2>
            <p className="mt-2 text-cyan-100">{role}</p>
            <p className="mt-5 rounded-3xl bg-white/[0.06] p-4 text-sm leading-6 text-white/70">{goal}</p>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Current skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleValue(skill, skills, setSkills)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      skills.includes(skill) ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Help needed</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {helpOptions.map((need) => (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleValue(need, needs, setNeeds)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      needs.includes(need) ? "bg-violet-300 text-slate-950" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-cyan-300 p-4 text-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Detected skill gaps</p>
              <p className="mt-2 text-sm font-semibold">{missingSkills.join(", ") || "No obvious gap selected."}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
