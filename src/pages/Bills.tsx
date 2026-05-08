import { AppShell } from "@/components/finance/AppShell";
import { UpcomingBills } from "@/components/finance/UpcomingBills";
import { TransactionsTable } from "@/components/finance/TransactionsTable";

export default function BillsPage() {
  return (
    <AppShell>
      {({ items, remove, update }) => {
        const billsEmi = items.filter(t => t.type === "bill" || t.type === "emi");
        return (
          <>
            <section>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">Recurring</p>
              <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight">Bills & EMI</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{billsEmi.length} recurring entries</p>
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2"><TransactionsTable items={billsEmi} onRemove={remove} onUpdate={update} /></div>
              <div><UpcomingBills items={items} /></div>
            </section>
          </>
        );
      }}
    </AppShell>
  );
}
