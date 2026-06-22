import { Badge } from "@/components/badge";
import { BuildMateAsgDashboard } from "@/components/buildmate-dashboard";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  return (
    <main className="grid-paper min-h-screen overflow-hidden">
      <Header />
      <BuildMateAsgDashboard />
      <Launch />
    </main>
  );
}

function Header() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-cyan-300">
          BM
        </div>
        <div>
          <p className="text-sm font-bold text-slate-950">BuildMate ASG</p>
          <p className="text-xs text-slate-500">Builder copilot + skill graph</p>
        </div>
      </div>
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
        <a href="#copilot" className="hover:text-slate-950">Copilot</a>
        <a href="#recommendations" className="hover:text-slate-950">Recommendations</a>
        <a href="#journey" className="hover:text-slate-950">Journey</a>
        <a href="/onboarding" className="hover:text-slate-950">Onboarding</a>
        <a href="#launch" className="hover:text-slate-950">Run</a>
      </nav>
      <div className="flex items-center gap-3">
        <AccountControls />
        <a
          href="#launch"
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-900/20"
        >
          Launch Demo
        </a>
      </div>
    </header>
  );
}

async function AccountControls() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return (
      <a
        href="/auth"
        className="rounded-full border border-slate-950/10 bg-white/70 px-5 py-3 text-sm font-bold text-slate-950 hover:border-slate-950/30"
      >
        Sign in
      </a>
    );
  }

  const label =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) || user.email || "Builder";

  return (
    <div className="flex items-center gap-2">
      <a
        href="/dashboard"
        className="rounded-full border border-slate-950/10 bg-white/70 px-5 py-3 text-sm font-bold text-slate-950 hover:border-slate-950/30"
      >
        Dashboard
      </a>
      <span className="hidden max-w-[12rem] truncate rounded-full border border-slate-950/10 bg-white/70 px-4 py-2.5 text-sm font-bold text-slate-700 sm:inline">
        {label}
      </span>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full border border-slate-950/10 bg-white/70 px-5 py-3 text-sm font-bold text-slate-950 hover:border-slate-950/30"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Launch() {
  return (
    <section id="launch" className="section-launch">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="dark-card grid gap-8 rounded-[2rem] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div>
            <Badge tone="dark">Launch BuildMate ASG</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">Run the builder copilot UI</h2>
            <p className="mt-5 text-sm leading-7 text-white/65">
              Day 1 turns the demo into an API-backed shell: JSON fixtures feed API routes, and the UI fetches dashboard
              data with loading, refresh, and error states.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/70">
              {[
                "1. Inspect JSON fixtures in buildmate-asg/data",
                "2. Start the Next.js dev server",
                "3. Complete onboarding preview",
                "4. Open workshop and mentor detail pages"
              ].map((step) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  {step}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5 font-mono text-xs leading-6 text-cyan-100">
            <p className="text-white/45"># run BuildMate ASG</p>
            <p className="mt-2">cd buildmate-asg</p>
            <p>npm install</p>
            <p>npm run dev</p>

            <p className="mt-5 text-white/45"># inspect API routes</p>
            <p className="mt-2">GET /api/profile</p>
            <p>GET /api/recommendations</p>
            <p>GET /api/journey</p>
            <p>GET /api/skill-graph</p>
            <p>GET /api/dashboard</p>
            <p>GET /api/explain?id=agent-workflow-lab</p>
          </div>
        </div>
      </div>
    </section>
  );
}
