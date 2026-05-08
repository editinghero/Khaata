import { useRef, useState } from "react";
import { ScanLine, Upload, Loader2, Sparkles, Check, List, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Transaction, categorizeMerchant, formatCurrency, loadAiSettings } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface Props {
  onAdd: (tx: Omit<Transaction, "id">) => void;
}

interface ExtractedTx {
  merchant: string;
  amount: number;
  date?: string;
  transactionType?: "debit" | "credit";
  status?: "success" | "declined" | "pending" | "failed";
  note?: string;
  confidence?: string;
  upiId?: string;
  paymentMethod?: string;
}

interface ExtractedResult {
  screenshotType: "single" | "list";
  transactions: ExtractedTx[];
}

export function ScanReceiptDialog({ onAdd }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => { setPreview(null); setResult(null); setLoading(false); setSelected(new Set()); };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image", variant: "destructive" }); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image too large (max 8 MB)", variant: "destructive" }); return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setLoading(true);
      setResult(null);

      try {
        if (!user) {
          toast({ title: "Please sign in first", variant: "destructive" });
          return;
        }

        const ai = await loadAiSettings();
        
        const response = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrl,
            provider: ai.provider,
            apiKey: ai.provider === "gemini" ? ai.geminiKey : ai.customApiKey,
            apiUrl: ai.provider === "custom" ? ai.customApiUrl : undefined,
            model: ai.provider === "custom" ? ai.customModel : undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to scan receipt");
        }

        const data = await response.json();
        if (data?.error) throw new Error(data.error);
        const r = data as ExtractedResult;
        // skip declined/failed by default
        const usable = r.transactions
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => t.status !== "declined" && t.status !== "failed");
        setResult(r);
        setSelected(new Set(usable.map(({ i }) => i)));
      } catch (e: any) {
        toast({ title: "Scan failed", description: e?.message ?? "Try a clearer image", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }
    setSelected(next);
  };

  const confirm = () => {
    if (!result) return;
    const picks = result.transactions.filter((_, i) => selected.has(i));
    if (picks.length === 0) {
      toast({ title: "Nothing selected", variant: "destructive" }); return;
    }
    picks.forEach((tx) => {
      const isCredit = tx.transactionType === "credit";
      const { category, type } = isCredit
        ? { category: "Salary" as const, type: "income" as const }
        : categorizeMerchant(tx.merchant);
      onAdd({
        type,
        amount: +tx.amount.toFixed(2),
        category,
        merchant: tx.merchant,
        note: tx.note?.trim() || `${tx.merchant}${isCredit ? " — received" : ""}`,
        date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
        recurring: false,
      });
    });
    toast({
      title: `Added ${picks.length} transaction${picks.length > 1 ? "s" : ""}`,
      description: result.screenshotType === "list" ? "Imported from history screenshot" : `${picks[0].merchant} · ${formatCurrency(picks[0].amount)}`,
    });
    reset(); setOpen(false);
  };

  const totalSelected = result ? result.transactions
    .filter((_, i) => selected.has(i))
    .reduce((s, t) => s + (t.transactionType === "credit" ? 0 : t.amount), 0) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border bg-secondary/40 hover:bg-secondary px-2.5 sm:px-4">
          <ScanLine className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Scan</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto glass-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Scan payment or history
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Single payment screen or a full transaction-history list — Khaata reads both. Works with PhonePe, GPay, Paytm, bank apps, Swiggy, Amazon, and more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!preview && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-secondary/30 transition-colors p-8 sm:p-10 text-center"
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Tap to upload screenshot</p>
              <p className="text-xs text-muted-foreground mt-1">PNG · JPG · up to 8 MB</p>
            </button>
          )}

          {preview && (
            <div className="rounded-xl overflow-hidden border border-border bg-secondary/20 p-2 sm:p-3">
              <img src={preview} alt="Receipt preview" className="w-full max-h-48 sm:max-h-56 object-contain rounded-lg" />
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading with AI…</p>
            </div>
          )}

          {result && !loading && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  {result.screenshotType === "list" ? <List className="h-3.5 w-3.5" /> : <FileImage className="h-3.5 w-3.5" />}
                  {result.screenshotType === "list" ? `History · ${result.transactions.length} found` : "Single payment"}
                </div>
                {result.transactions.length > 1 && (
                  <button
                    onClick={() => setSelected(new Set(result.transactions.map((_, i) => i)))}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >Select all</button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
                {result.transactions.map((t, i) => {
                  const isCredit = t.transactionType === "credit";
                  const declined = t.status === "declined" || t.status === "failed";
                  const checked = selected.has(i);
                  return (
                    <label
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors",
                        checked ? "border-primary/50 bg-primary/10" : "border-border bg-secondary/30 hover:bg-secondary/50",
                        declined && "opacity-60"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(i)}
                        className="mt-1 h-4 w-4 accent-primary shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{t.merchant}</p>
                          {declined && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-expense/15 text-expense">{t.status}</span>}
                          {isCredit && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">credit</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {categorizeMerchant(t.merchant).category}
                          {t.date && ` · ${t.date}`}
                          {t.paymentMethod && ` · ${t.paymentMethod}`}
                        </p>
                      </div>
                      <div className={cn("font-mono-num font-bold text-sm whitespace-nowrap", isCredit ? "text-primary" : "text-foreground")}>
                        {isCredit ? "+" : "−"}{formatCurrency(t.amount)}
                      </div>
                    </label>
                  );
                })}
              </div>

              {selected.size > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <span className="text-muted-foreground">{selected.size} selected</span>
                  <span className="font-mono-num font-bold text-foreground">{formatCurrency(totalSelected)}</span>
                </div>
              )}
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div className="flex justify-end gap-2">
            {preview && (
              <Button variant="ghost" onClick={reset}>Try another</Button>
            )}
            <Button
              onClick={confirm}
              disabled={!result || loading || selected.size === 0}
              className={cn("bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold",
                (!result || loading || selected.size === 0) && "opacity-50")}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Add {selected.size > 0 ? selected.size : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
