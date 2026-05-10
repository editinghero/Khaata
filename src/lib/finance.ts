import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export type TxType = "expense" | "bill" | "emi" | "income";
export type Category =
  | "Food" | "Shopping" | "Transport" | "Entertainment"
  | "Housing" | "Utilities" | "Health" | "Education"
  | "Loan" | "CreditCard" | "Subscription" | "Salary" | "Groceries" | "Other";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: Category;
  note: string;
  date: string;
  recurring?: boolean;
  dueDate?: string;
  merchant?: string;
}

export const INCOME_CATEGORIES: Category[] = ["Salary", "Other"];
export const EXPENSE_CATEGORIES: Category[] = [
  "Food","Groceries","Shopping","Transport","Entertainment","Housing","Utilities",
  "Health","Education","Loan","CreditCard","Subscription","Other"
];

export const categoriesFor = (type: TxType): Category[] =>
  type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

export function useTransactions() {
  const { user } = useAuth();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await db.list(user.id);
      setItems(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (tx: Omit<Transaction, "id">) => {
    if (!user) return;
    const newTx: Transaction = { ...tx, id: crypto.randomUUID() };
    await db.insert(newTx, user.id);
    setItems(prev => [newTx, ...prev]);
  }, [user]);

  const update = useCallback(async (id: string, patch: Partial<Omit<Transaction, "id">>) => {
    if (!user) return;
    await db.update(id, patch, user.id);
    setItems(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [user]);

  const remove = useCallback(async (id: string) => {
    if (!user) return;
    await db.remove(id, user.id);
    setItems(prev => prev.filter(t => t.id !== id));
  }, [user]);

  return { items, add, update, remove, loading, refresh };
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

export const formatCurrencyShort = (n: number) => {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

export const sameMonth = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

export const sumByType = (txs: Transaction[], type: TxType) =>
  txs.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);

export function monthlySeries(txs: Transaction[], months = 6) {
  const now = new Date();
  const series: { label: string; expense: number; bill: number; emi: number; income: number }[] = [];
  const monthData = new Map<string, { label: string; expense: number; bill: number; emi: number; income: number }>();
  const monthKeys: string[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${ref.getFullYear()}-${ref.getMonth()}`;
    monthKeys.push(key);
    monthData.set(key, {
      label: ref.toLocaleString("en-US", { month: "short" }),
      expense: 0, bill: 0, emi: 0, income: 0,
    });
  }

  for (const t of txs) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const data = monthData.get(key);
    if (data && t.type in data) {
      data[t.type as keyof typeof data] = (data[t.type as keyof typeof data] as number) + t.amount;
    }
  }

  for (const key of monthKeys) {
    const data = monthData.get(key)!;
    series.push({
      label: data.label,
      expense: +data.expense.toFixed(2),
      bill: +data.bill.toFixed(2),
      emi: +data.emi.toFixed(2),
      income: +data.income.toFixed(2),
    });
  }
  return series;
}

export function categoryBreakdown(txs: Transaction[]) {
  const map = new Map<string, number>();
  txs.filter(t => t.type !== "income").forEach(t => {
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value);
}

export const MERCHANT_MAP: { match: RegExp; category: Category; type?: TxType }[] = [
  { match: /swiggy|zomato|dominos|pizza|kfc|mcdonald|burger|eatfit|faasos|behrouz/i, category: "Food" },
  { match: /zepto|blinkit|bigbasket|jiomart|dmart|reliance\s*retail|reliance\s*fresh|grofers|instamart|nature'?s\s*basket/i, category: "Groceries" },
  { match: /amazon|flipkart|myntra|ajio|nykaa|meesho|snapdeal|tatacliq|croma|reliance\s*digital/i, category: "Shopping" },
  { match: /uber|ola|rapido|metro|irctc|indigo|vistara|air\s*india|spicejet|redbus/i, category: "Transport" },
  { match: /netflix|prime|hotstar|spotify|youtube|disney|sony\s*liv|zee5|jiosaavn|gaana/i, category: "Subscription" },
  { match: /bookmyshow|pvr|inox|cinepolis/i, category: "Entertainment" },
  { match: /apollo|1mg|pharmeasy|netmeds|tata\s*1mg|practo|cult\.?fit|cure\s*fit/i, category: "Health" },
  { match: /airtel|jio|vodafone|vi\b|bsnl|tata\s*power|adani|bescom|mseb|act\b|fiber|broadband|electricity|gas\s*bill/i, category: "Utilities", type: "bill" },
  { match: /hdfc|sbi|icici|axis|kotak|bajaj|emi|loan/i, category: "Loan", type: "emi" },
  { match: /byju|unacademy|vedantu|coursera|udemy|upgrad/i, category: "Education" },
];

export function categorizeMerchant(merchant: string): { category: Category; type: TxType } {
  for (const m of MERCHANT_MAP) {
    if (m.match.test(merchant)) return { category: m.category, type: m.type ?? "expense" };
  }
  return { category: "Other", type: "expense" };
}

export const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};
export const formatDateShort = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

export const DEFAULT_BUDGETS: Record<string, number> = {
  Food: 8000, Groceries: 10000, Shopping: 6000, Transport: 4000,
  Entertainment: 3000, Housing: 30000, Utilities: 4000, Health: 3000,
  Subscription: 1500, Loan: 12000, CreditCard: 10000, Education: 5000, Other: 5000,
};
const budgetsKey = (uid: string) => `khaata.budgets.${uid}`;
export function loadBudgets(uid: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(budgetsKey(uid));
    if (raw) return { ...DEFAULT_BUDGETS, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Failed to load budgets:", error);
  }
  return { ...DEFAULT_BUDGETS };
}
export function saveBudgets(uid: string, b: Record<string, number>) {
  localStorage.setItem(budgetsKey(uid), JSON.stringify(b));
}

export type AiProvider = "gemini" | "custom";
export interface AiSettings { 
  provider: AiProvider; 
  geminiKey?: string; 
  customApiUrl?: string;
  customApiKey?: string;
  customModel?: string;
}

export async function loadAiSettings(): Promise<AiSettings> {
  try {
    const response = await fetch("/api/ai-config");
    if (!response.ok) throw new Error("Failed to load AI settings");
    const data = await response.json();
    return {
      provider: data.provider || "gemini",
      geminiKey: data.config.geminiKey,
      customApiUrl: data.config.customApiUrl,
      customApiKey: data.config.customApiKey,
      customModel: data.config.customModel,
    };
  } catch (error) {
    console.error("Failed to load AI settings:", error);
    return { provider: "gemini" };
  }
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  const response = await fetch("/api/ai-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: settings.provider,
      config: {
        geminiKey: settings.geminiKey,
        customApiUrl: settings.customApiUrl,
        customApiKey: settings.customApiKey,
        customModel: settings.customModel,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save AI settings");
  }
}
