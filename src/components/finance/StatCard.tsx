import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/finance";

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  accent: "primary" | "expense" | "bill" | "emi";
  hint?: string;
  onClick?: () => void;
}

const accentMap = {
  primary: { grad: "bg-gradient-primary", text: "text-primary", glow: "shadow-glow" },
  expense: { grad: "bg-gradient-expense", text: "text-expense", glow: "" },
  bill: { grad: "bg-gradient-bill", text: "text-bill", glow: "" },
  emi: { grad: "bg-gradient-emi", text: "text-emi", glow: "" },
};

export function StatCard({ label, value, icon: Icon, trend, accent, hint, onClick }: Props) {
  const a = accentMap[accent];
  const positive = (trend ?? 0) >= 0;
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
      className={cn(
        "glass-card group relative overflow-hidden p-4 sm:p-5 transition-smooth hover:border-border hover:-translate-y-0.5",
        onClick && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      )}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <span className="stat-ring" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight font-mono-num text-foreground truncate">
            {formatCurrency(value)}
          </p>
          {hint && <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">{hint}</p>}
        </div>
        <div className={cn("h-9 w-9 sm:h-10 sm:w-10 rounded-xl grid place-items-center shrink-0", a.grad, accent === "primary" && a.glow)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" strokeWidth={2.4} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="relative mt-4 flex items-center gap-1.5 text-xs">
          <span className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
            positive ? "bg-primary/10 text-primary" : "bg-expense/10 text-expense"
          )}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
