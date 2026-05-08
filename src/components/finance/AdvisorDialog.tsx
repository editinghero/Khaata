import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Transaction, sameMonth, sumByType, categoryBreakdown, formatCurrency, loadAiSettings } from "@/lib/finance";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

interface Props { items: Transaction[]; }

const SUGGESTIONS = [
  "How can I reduce my spending this month?",
  "Where am I overspending vs my budgets?",
  "What's a realistic savings target for next month?",
  "Suggest 3 subscriptions I should review.",
];

function buildContext(items: Transaction[]) {
  const now = new Date();
  const cur = items.filter(t => sameMonth(t.date, now));
  const breakdown = categoryBreakdown(cur);
  return {
    month: now.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    income: sumByType(cur, "income"),
    expense: sumByType(cur, "expense"),
    bills: sumByType(cur, "bill"),
    emi: sumByType(cur, "emi"),
    totalSpend: sumByType(cur, "expense") + sumByType(cur, "bill") + sumByType(cur, "emi"),
    categoryBreakdown: breakdown,
    recentTransactions: items.slice(0, 25).map(t => ({
      date: t.date.slice(0, 10), type: t.type, amount: t.amount,
      category: t.category, merchant: t.merchant, note: t.note,
    })),
  };
}

const memKey = (uid: string) => `khaata.advisor.${uid}`;

export function AdvisorDialog({ items }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memory: load on mount per user
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(memKey(user.id));
      if (raw) setMessages(JSON.parse(raw));
    } catch (error) {
      console.error("Failed to load advisor messages:", error);
    }
  }, [user]);
  useEffect(() => {
    if (user) localStorage.setItem(memKey(user.id), JSON.stringify(messages.slice(-40)));
  }, [messages, user]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!user || !text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const ai = await loadAiSettings();
    const finance = buildContext(items);
    const apiKey = ai.provider === "gemini" ? ai.geminiKey : ai.customApiKey;
    const apiUrl = ai.provider === "custom" ? ai.customApiUrl : undefined;
    const model = ai.provider === "custom" ? ai.customModel : undefined;

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const url = "/api/advisor";
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].slice(-20),
          finance,
          provider: ai.provider,
          apiKey,
          apiUrl,
          model,
        }),
      });

      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "Failed to reach AI");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf; break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Couldn't get a reply", description: e.message ?? "Try again.", variant: "destructive" });
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    if (user) localStorage.removeItem(memKey(user.id));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"
          className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 px-2 sm:px-3"
          aria-label="AI advisor">
          <Sparkles className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">AI Advisor</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-border/60">
        <SheetHeader className="px-4 sm:px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> AI Money Coach
              </SheetTitle>
              <SheetDescription className="text-xs">Personal advice based on your transactions</SheetDescription>
            </div>
            {messages.length > 0 && (
              <Button size="icon" variant="ghost" onClick={clear} className="h-8 w-8 text-muted-foreground" aria-label="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
                👋 Hi! I've read your recent transactions. Ask me anything about your money.
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-left text-xs sm:text-sm rounded-lg border border-border bg-secondary/40 hover:bg-secondary px-3 py-2 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary/60 text-foreground rounded-bl-md border border-border/60"
              )}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_strong]:text-primary">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 p-3 bg-background/80 backdrop-blur">
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
            <Textarea
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              rows={1} maxLength={500}
              placeholder="Ask about your spending…"
              className="min-h-[40px] max-h-32 resize-none bg-secondary/40 border-border/60"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shrink-0 h-10 w-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
