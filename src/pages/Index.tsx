import { useMemo } from "react";
import { AppShell } from "@/components/finance/AppShell";
import { StatCard } from "@/components/finance/StatCard";
import { SpendChart } from "@/components/finance/SpendChart";
import { CategoryDonut } from "@/components/finance/CategoryDonut";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { UpcomingBills } from "@/components/finance/UpcomingBills";
import { sameMonth, sumByType, monthlySeries, categoryBreakdown, formatCurrency } from "@/lib/finance";
import { Wallet, Receipt, CalendarClock, Banknote } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greetingName = user?.email?.split("@")[0] ?? "there";

  return (
    <AppShell>
      {({ items, remove, update }) => {
        const stats = (() => {
          const now = new Date();
          const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const cur = items.filter(t => sameMonth(t.date, now));
          const prev = items.filter(t => sameMonth(t.date, last));
          const trend = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
          const curExp = sumByType(cur, "expense");
          const curBill = sumByType(cur, "bill");
          const curEmi = sumByType(cur, "emi");
          const curIncome = sumByType(cur, "income");
          const totalOut = curExp + curBill + curEmi;
          return {
            totalOut, expense: curExp, bill: curBill, emi: curEmi, income: curIncome,
            tExp: trend(curExp, sumByType(prev, "expense")),
            tBill: trend(curBill, sumByType(prev, "bill")),
            tEmi: trend(curEmi, sumByType(prev, "emi")),
            tOut: trend(totalOut, sumByType(prev, "expense") + sumByType(prev, "bill") + sumByType(prev, "emi")),
          };
        })();
        const series = monthlySeries(items, 6);
        const breakdown = categoryBreakdown(items.filter(t => sameMonth(t.date, new Date())));
        const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
        const monthCount = items.filter(t => sameMonth(t.date, new Date())).length;

        return (
          <>
            <section className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
              <div className="min-w-0 w-full sm:w-auto">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
                <h1 className="mt-1 text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance break-words">
                  Hi, {greetingName} 👋
                </h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground mt-1.5">
                  <span className="text-primary font-semibold">{monthLabel}</span> · spent <span className="text-foreground font-semibold font-mono-num">{formatCurrency(stats.totalOut)}</span> across {monthCount} transactions.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up">
              <StatCard label="Spent this month" value={stats.totalOut} icon={Wallet} accent="primary" trend={stats.tOut} hint="Tap to view all" onClick={() => navigate("/transactions")} />
              <StatCard label="Expenses" value={stats.expense} icon={Receipt} accent="expense" trend={stats.tExp} hint="Daily spending" onClick={() => navigate("/transactions")} />
              <StatCard label="Bills" value={stats.bill} icon={Banknote} accent="bill" trend={stats.tBill} hint="Recurring bills" onClick={() => navigate("/bills")} />
              <StatCard label="EMI & loans" value={stats.emi} icon={CalendarClock} accent="emi" trend={stats.tEmi} hint="Monthly installments" onClick={() => navigate("/bills")} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2"><SpendChart data={series} /></div>
              <div><CategoryDonut data={breakdown} /></div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2"><TransactionsTable items={items.slice(0, 12)} onRemove={remove} onUpdate={update} /></div>
              <div><UpcomingBills items={items} /></div>
            </section>
          </>
        );
      }}
    </AppShell>
  );
};

export default Index;
