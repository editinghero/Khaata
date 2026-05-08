import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Category, Transaction, TxType, categoriesFor } from "@/lib/finance";
import { cn } from "@/lib/utils";

const TYPES: { v: TxType; label: string; cls: string }[] = [
  { v: "expense", label: "Expense", cls: "data-[on=true]:bg-gradient-expense data-[on=true]:text-primary-foreground" },
  { v: "bill", label: "Bill", cls: "data-[on=true]:bg-gradient-bill data-[on=true]:text-primary-foreground" },
  { v: "emi", label: "EMI", cls: "data-[on=true]:bg-gradient-emi data-[on=true]:text-primary-foreground" },
  { v: "income", label: "Income", cls: "data-[on=true]:bg-gradient-primary data-[on=true]:text-primary-foreground" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: Transaction | null;
  onSave: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
}

export function EditTransactionDialog({ open, onOpenChange, transaction, onSave }: Props) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [note, setNote] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!transaction) return;
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setNote(transaction.note);
    setMerchant(transaction.merchant ?? "");
    setDate(new Date(transaction.date).toISOString().slice(0, 10));
    setDueDate(transaction.dueDate ? new Date(transaction.dueDate).toISOString().slice(0, 10) : "");
  }, [transaction]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    const n = parseFloat(amount);
    if (!n || n <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    onSave(transaction.id, {
      type, amount: +n.toFixed(2), category,
      note: note.trim() || category,
      merchant: merchant.trim() || undefined,
      date: new Date(date).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      recurring: type === "bill" || type === "emi",
    });
    toast({ title: "Transaction updated" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] glass-card border-border">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
          <DialogDescription>Update the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map(t => (
              <button key={t.v} type="button" data-on={type === t.v} onClick={() => {
                  setType(t.v);
                  const cats = categoriesFor(t.v);
                  if (!cats.includes(category)) setCategory(cats[0]);
                }}
                className={cn("rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-xs font-semibold transition-all hover:bg-secondary", t.cls)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eamt">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input id="eamt" type="number" step="0.01" min="0" className="pl-7 font-mono-num"
                  value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categoriesFor(type).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emerch">Merchant</Label>
              <Input id="emerch" placeholder="e.g. Swiggy, Amazon" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edate">Date</Label>
              <Input id="edate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {(type === "bill" || type === "emi") && (
            <div className="space-y-1.5">
              <Label htmlFor="edue">Due date</Label>
              <Input id="edue" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="enote">Note</Label>
            <Textarea id="enote" rows={2} maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
