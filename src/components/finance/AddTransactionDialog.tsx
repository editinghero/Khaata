import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  onAdd: (tx: Omit<Transaction, "id">) => void;
}

export function AddTransactionDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [note, setNote] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();

  const reset = () => {
    setAmount(""); setNote(""); setMerchant(""); setDueDate(""); setCategory("Food"); setType("expense");
    setDate(new Date().toISOString().slice(0,10));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (note.length > 120) { toast({ title: "Note too long", variant: "destructive" }); return; }
    onAdd({
      type, amount: +n.toFixed(2), category,
      note: note.trim() || category,
      merchant: merchant.trim() || undefined,
      date: new Date(date).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      recurring: type === "bill" || type === "emi",
    });
    toast({ title: "Transaction added", description: `${type} · ₹${n.toFixed(2)}` });
    reset(); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold px-2.5 sm:px-4">
          <Plus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">New transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] glass-card border-border">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>Log an expense, bill, EMI or income.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map(t => (
              <button
                key={t.v}
                type="button"
                data-on={type === t.v}
                onClick={() => {
                  setType(t.v);
                  const cats = categoriesFor(t.v);
                  if (!cats.includes(category)) setCategory(cats[0]);
                }}
                className={cn(
                  "rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-xs font-semibold transition-all",
                  "hover:border-border hover:bg-secondary",
                  t.cls
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amt">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input id="amt" type="number" step="0.01" min="0" max="10000000"
                  className="pl-7 font-mono-num" placeholder="0.00"
                  value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriesFor(type).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="merch">Merchant <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="merch" placeholder="e.g. Swiggy, Zepto" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {(type === "bill" || type === "emi") && (
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" placeholder="Add a short description…" rows={2} maxLength={120}
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
              Add transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
