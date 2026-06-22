type BadgeProps = {
  children: React.ReactNode;
  tone?: "mint" | "violet" | "dark" | "amber";
};

const tones = {
  mint: "border-cyan-300/70 bg-cyan-200/60 text-slate-950",
  violet: "border-violet-300/70 bg-violet-200/50 text-slate-950",
  dark: "border-white/15 bg-white/10 text-white",
  amber: "border-amber-300/80 bg-amber-200/60 text-slate-950"
};

export function Badge({ children, tone = "mint" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
