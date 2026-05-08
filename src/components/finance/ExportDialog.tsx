import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction, formatCurrency } from "@/lib/finance";
import { exportCSV, exportPDF } from "@/lib/exporters";
import { cn } from "@/lib/utils";

interface Props { items: Transaction[] }

type Range = "this-month" | "last-month" | "last-3" | "ytd" | "all" | "custom";

const PRESETS: { v: Range; label: string }[] = [
  { v: "this-month", label: "This month" },
  { v: "last-month", label: "Last month" },
  { v: "last-3", label: "Last 3 months" },
  { v: "ytd", label: "This year" },
  { v: "all", label: "All time" },
  { v: "custom", label: "Custom range" },
];

const toIsoDay = (d: Date, end = false) => {
  const x = new Date(d); x.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return x.toISOString();
};

function computeRange(range: Range, from: string, to: string): { start?: Date; end?: Date; label: string } {
  const now = new Date();
  switch (range) {
    case "this-month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: s, end: e, label: s.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
    }
    case "last-month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e, label: s.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
    }
    case "last-3": {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: s, end: now, label: "Last 3 months" };
    }
    case "ytd": {
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: s, end: now, label: `${now.getFullYear()}` };
    }
    case "all":
      return { label: "All time" };
    case "custom": {
      if (!from || !to) return { label: "Custom" };
      const s = new Date(from); const e = new Date(to); e.setHours(23, 59, 59, 999);
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
      return { start: s, end: e, label: `${fmt(s)} – ${fmt(e)}` };
    }
  }
}

export function ExportDialog({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>("this-month");
  const todayStr = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);

  const { filtered, label } = useMemo(() => {
    const r = computeRange(range, from, to);
    const f = items.filter(t => {
      const d = new Date(t.date).getTime();
      if (r.start && d < r.start.getTime()) return false;
      if (r.end && d > r.end.getTime()) return false;
      return true;
    });
    return { filtered: f, label: r.label };
  }, [items, range, from, to]);

  const totalOut = filtered.filter(t => t.type !== "income").reduce((s, t) => s + t.amount, 0);
  const totalIn = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const safeLabel = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const doCSV = () => exportCSV(filtered, `khaata-${safeLabel}.csv`);
  const doPDF = () => exportPDF(filtered, `khaata-${safeLabel}.pdf`, label);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border bg-secondary/40 hover:bg-secondary px-2 sm:px-3">
          <Download className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] glass-card border-border">
        <DialogHeader>
          <DialogTitle>Export transactions</DialogTitle>
          <DialogDescription>Pick a range, then download CSV or PDF.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button key={p.v} type="button" onClick={() => setRange(p.v)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-semibold transition-all",
                  range === p.v
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>
                {p.label}
              </button>
            ))}
          </div>

          {range === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} max={to} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} min={from} />
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Range</span>
              <span className="font-semibold text-foreground">{label}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-mono-num font-semibold">{filtered.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-mono-num font-semibold text-expense">{formatCurrency(totalOut)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Income</span>
              <span className="font-mono-num font-semibold text-primary">{formatCurrency(totalIn)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={filtered.length === 0}
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
                  <Download className="h-4 w-4 mr-1.5" /> Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={doCSV}><FileSpreadsheet className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={doPDF}><FileText className="h-4 w-4 mr-2" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
