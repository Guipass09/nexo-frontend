import type { LucideIcon } from "lucide-react";

export type AgentTabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
};

export function AgentTabsNav({
  tabs,
  active,
  onChange,
}: {
  tabs: AgentTabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <nav className="nexo-premium-surface flex flex-wrap gap-1.5 rounded-[1.5rem] p-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-pressed={isActive}
            className={[
              "group relative flex min-w-[132px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isActive
                ? "bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(124,58,237,0.16))] text-slate-950 shadow-[0_18px_40px_-30px_rgba(37,99,255,0.7)]"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
            ].join(" ")}
          >
            <Icon className={isActive ? "h-4 w-4 text-primary" : "h-4 w-4"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
