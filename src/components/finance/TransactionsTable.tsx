import { useState } from "react";
import { Trash2, Pencil, ShoppingBag, ShoppingCart, Utensils, Car, Film, Home, Zap, HeartPulse, GraduationCap, Landmark, CreditCard, Repeat, Briefcase, MoreHorizontal } from "lucide-react";
import { Transaction, formatCurrency, Category, formatDateShort } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { cn } from "@/lib/utils";

const ICONS: Record<Category, any> = {
  Food: Utensils, Groceries: ShoppingCart, Shopping: ShoppingBag, Transport: Car, Entertainment: Film,
  Housing: Home, Utilities: Zap, Health: HeartPulse, Education: GraduationCap,
  Loan: Landmark, CreditCard: CreditCard, Subscription: Repeat, Salary: Briefcase, Other: MoreHorizontal,
};

const TYPE_BADGE = {
  expense: "bg-expense/10 text-expense ring-1 ring-expense/20",
  bill: "bg-bill/10 text-bill ring-1 ring-bill/20",
  emi: "bg-emi/10 text-emi ring-1 ring-emi/20",
  income: "bg-primary/10 text-primary ring-1 ring-primary/20",
};

interface Props {
  items: Transaction[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
}

export function TransactionsTable({ items, onRemove, onUpdate }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Recent transactions</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{items.length} entries · tap to edit</p>
        </div>
      </div>

      <div className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
        {items.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No transactions yet — add your first one.</div>
        )}
        {items.map(t => {
          const Icon = ICONS[t.category] || MoreHorizontal;
          const sign = t.type === "income" ? "+" : "−";
          const amtClass = t.type === "income" ? "text-primary" : "text-foreground";
          return (
            <div key={t.id} className="group flex items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-secondary/40 transition-colors">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary grid place-items-center shrink-0">
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-muted-foreground" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate max-w-[140px] sm:max-w-none">{t.note}</p>
                  <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded", TYPE_BADGE[t.type])}>
                    {t.type}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  {t.merchant ? `${t.merchant} · ` : ""}{t.category} · {formatDateShort(t.date)}
                  {t.recurring && " · recurring"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className={cn("font-mono-num font-bold tabular-nums text-sm whitespace-nowrap", amtClass)}>
                  {sign}{formatCurrency(t.amount)}
                </div>
                <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}
                    className="text-muted-foreground hover:text-primary h-7 w-7 sm:h-8 sm:w-8" aria-label="Edit transaction">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setConfirmId(t.id)}
                    className="text-muted-foreground hover:text-expense h-7 w-7 sm:h-8 sm:w-8" aria-label="Delete transaction">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EditTransactionDialog
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        transaction={editing}
        onSave={onUpdate}
      />

      <AlertDialog open={!!confirmId} onOpenChange={(v) => { if (!v) setConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-primary-foreground hover:bg-expense/90"
              onClick={() => { if (confirmId) onRemove(confirmId); setConfirmId(null); }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
