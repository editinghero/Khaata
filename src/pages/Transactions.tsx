import { useState } from "react";
import { AppShell } from "@/components/finance/AppShell";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TxType } from "@/lib/finance";
import { cn } from "@/lib/utils";

const FILTERS: { v: TxType | "all"; label: string }[] = [
  { v: "all", label: "All" },
  { v: "expense", label: "Expenses" },
  { v: "bill", label: "Bills" },
  { v: "emi", label: "EMI" },
  { v: "income", label: "Income" },
];

export default function TransactionsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TxType | "all">("all");

  return (
    <AppShell>
      {({ items, remove, update }) => {
        const list = items.filter(t => {
          if (filter !== "all" && t.type !== filter) return false;
          if (!q.trim()) return true;
          const s = q.toLowerCase();
          return t.note.toLowerCase().includes(s)
            || t.category.toLowerCase().includes(s)
            || (t.merchant ?? "").toLowerCase().includes(s);
        });

        return (
          <>
            <section>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">All transactions</p>
              <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{list.length} of {items.length} entries</p>
            </section>

            <section className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search merchant, note, category…" className="pl-9 bg-secondary/40" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map(f => (
                  <button key={f.v} onClick={() => setFilter(f.v)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                      filter === f.v
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            <TransactionsTable items={list} onRemove={remove} onUpdate={update} />
          </>
        );
      }}
    </AppShell>
  );
}
