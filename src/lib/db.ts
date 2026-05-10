import type { Transaction } from "./finance";

interface DbClient {
  list: (userId: string) => Promise<Transaction[]>;
  insert: (tx: Transaction, userId: string) => Promise<void>;
  update: (id: string, patch: Partial<Transaction>, userId: string) => Promise<void>;
  remove: (id: string, userId: string) => Promise<void>;
  budgets: {
    list: (userId: string) => Promise<Record<string, number>>;
    update: (userId: string, category: string, amount: number) => Promise<void>;
    reset: (userId: string, defaultBudgets: Record<string, number>) => Promise<void>;
  };
}

const d1Db: DbClient = {
  async list(userId: string): Promise<Transaction[]> {
    const response = await fetch(`/api/transactions?userId=${userId}`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },

  async insert(tx: Transaction, userId: string): Promise<void> {
    const response = await fetch(`/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tx, userId }),
    });
    if (!response.ok) throw new Error("Failed to insert transaction");
  },

  async update(id: string, patch: Partial<Transaction>, userId: string): Promise<void> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, userId }),
    });
    if (!response.ok) throw new Error("Failed to update transaction");
  },

  async remove(id: string, userId: string): Promise<void> {
    const response = await fetch(`/api/transactions/${id}?userId=${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
  },

  budgets: {
    async list(userId: string): Promise<Record<string, number>> {
      const response = await fetch(`/api/budgets?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch budgets");
      return response.json();
    },
    async update(userId: string, category: string, amount: number): Promise<void> {
      const response = await fetch(`/api/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount, userId }),
      });
      if (!response.ok) throw new Error("Failed to update budget");
    },
    async reset(userId: string, defaultBudgets: Record<string, number>): Promise<void> {
      const response = await fetch(`/api/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgets: defaultBudgets, userId }),
      });
      if (!response.ok) throw new Error("Failed to reset budgets");
    },
  },
};

export const db: DbClient = d1Db;
