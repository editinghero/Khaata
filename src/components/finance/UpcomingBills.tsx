import { CalendarClock, AlertCircle } from "lucide-react";
import { Transaction, formatCurrency, formatDate } from "@/lib/finance";
import { cn } from "@/lib/utils";

interface Props { items: Transaction[]; }

export function UpcomingBills({ items }: Props) {
  const now = Date.now();
  const upcoming = items
    .filter(t => (t.type === "bill" || t.type === "emi") && t.dueDate && new Date(t.dueDate).getTime() >= now - 86400000)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Upcoming dues</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Bills & EMI due soon</p>
        </div>
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-2.5">
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">All caught up 🎉</p>
        )}
        {upcoming.map(t => {
          const days = Math.ceil((new Date(t.dueDate!).getTime() - now) / 86400000);
          const urgent = days <= 3;
          return (
            <div key={t.id} className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              urgent ? "border-bill/30 bg-bill/5" : "border-border/60 bg-secondary/30"
            )}>
              <div className={cn(
                "h-9 w-9 rounded-lg grid place-items-center shrink-0",
                t.type === "bill" ? "bg-gradient-bill" : "bg-gradient-emi"
              )}>
                {urgent ? <AlertCircle className="h-4 w-4 text-primary-foreground" /> : <CalendarClock className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{t.note}</p>
                <p className="text-xs text-muted-foreground">
                  {days <= 0 ? "Due today" : days === 1 ? "Due tomorrow" : `In ${days} days`} · {formatDate(t.dueDate)}
                </p>
              </div>
              <div className="font-mono-num font-bold text-sm text-foreground">{formatCurrency(t.amount)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
