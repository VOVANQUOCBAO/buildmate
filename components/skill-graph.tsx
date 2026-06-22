export function SkillGraph({ nodes }: { nodes: string[] }) {
  return (
    <div className="dark-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Skill Graph</p>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">Builder context map</h3>
        </div>
        <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-bold text-slate-950">Live context</span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {nodes.map((node, index) => (
          <div
            key={node}
            className={`rounded-3xl border border-white/10 p-4 ${
              index === 0 ? "bg-cyan-300 text-slate-950" : "bg-white/[0.06] text-white"
            }`}
          >
            <p className="font-mono text-xs opacity-60">0{index + 1}</p>
            <p className="mt-4 text-sm font-bold">{node}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
