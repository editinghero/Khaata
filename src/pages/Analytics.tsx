import { AppShell } from "@/components/finance/AppShell";
import { SpendChart } from "@/components/finance/SpendChart";
import { CategoryDonut } from "@/components/finance/CategoryDonut";
import { categoryBreakdown, monthlySeries, sameMonth, sumByType, formatCurrency } from "@/lib/finance";
import { StatCard } from "@/components/finance/StatCard";
import { Wallet, TrendingUp, ArrowDownRight, PiggyBank } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <AppShell>
      {({ items }) => {
        const series = monthlySeries(items, 6);
        const breakdown = categoryBreakdown(items.filter(t => sameMonth(t.date, new Date())));
        const now = new Date();
        const cur = items.filter(t => sameMonth(t.date, now));
        const income = sumByType(cur, "income");
        const out = sumByType(cur, "expense") + sumByType(cur, "bill") + sumByType(cur, "emi");
        const savings = income - out;
        const rate = income > 0 ? (savings / income) * 100 : 0;
        const avg = series.reduce((s, m) => s + m.expense + m.bill + m.emi, 0) / Math.max(series.length, 1);

        return (
          <>
            <section>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">Insights</p>
              <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">Trends across the last 6 months</p>
            </section>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard label="Income (month)" value={income} icon={Wallet} accent="primary" hint="All credits" />
              <StatCard label="Outflow (month)" value={out} icon={ArrowDownRight} accent="expense" hint="Expenses + bills + EMI" />
              <StatCard label="Net savings" value={savings} icon={PiggyBank} accent="primary" hint={`${rate.toFixed(0)}% of income`} />
              <StatCard label="6-mo avg spend" value={Math.round(avg)} icon={TrendingUp} accent="bill" hint="Including bills & EMI" />
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2"><SpendChart data={series} /></div>
              <div><CategoryDonut data={breakdown} /></div>
            </section>
            <p className="text-xs text-muted-foreground">Tip: export a custom range from the topbar to share a clean PDF report.</p>
          </>
        );
      }}
    </AppShell>
  );
}
