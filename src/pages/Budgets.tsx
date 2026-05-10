import { useState } from "react";
import { AppShell } from "@/components/finance/AppShell";
import { categoryBreakdown, sameMonth, formatCurrency, useBudgets } from "@/lib/finance";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BudgetsPage() {
  const { toast } = useToast();
  const { budgets, update, reset, loading } = useBudgets();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const handleReset = async () => {
    await reset();
    toast({ title: "Budgets reset to defaults" });
  };

  return (
    <AppShell>
      {({ items }) => {
        const cur = items.filter(t => sameMonth(t.date, new Date()));
        const breakdown = categoryBreakdown(cur);
        // Show every budgeted category, even with no spending
        const allCats = Array.from(new Set([...Object.keys(budgets), ...breakdown.map(b => b.name)]));
        const spendBy = new Map(breakdown.map(b => [b.name, b.value]));

        return (
          <>
            <section className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">Limits</p>
                <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight">Budgets</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">Tap a row to edit your monthly cap</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset</Button>
            </section>
            <section className="glass-card p-5 space-y-4">
              {loading && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {allCats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No budgets yet.</p>
              )}
              {allCats.map(name => {
                const cap = budgets[name] ?? 5000;
                const spent = spendBy.get(name) ?? 0;
                const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
                const over = spent > cap;
                const isEditing = editing === name;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-foreground">{name}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">₹</span>
                          <Input
                            autoFocus type="number" min="0" value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { update(name, Math.max(0, parseFloat(draft) || 0)); setEditing(null); }
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="h-8 w-28 font-mono-num"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => { update(name, Math.max(0, parseFloat(draft) || 0)); setEditing(null); }}>
                            <Check className="h-4 w-4 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className={`font-mono-num ${over ? "text-expense" : "text-muted-foreground"}`}>
                            {formatCurrency(spent)} <span className="text-muted-foreground">/ {formatCurrency(cap)}</span>
                          </span>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => { setEditing(name); setDraft(String(cap)); }} aria-label="Edit budget">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Progress value={pct} className={over ? "[&>*]:bg-expense" : ""} />
                  </div>
                );
              })}
            </section>
          </>
        );
      }}
    </AppShell>
  );
}
