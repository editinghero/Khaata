import type { Transaction } from "./finance";

interface DbClient {
  list: (userId: string) => Promise<Transaction[]>;
  insert: (tx: Transaction, userId: string) => Promise<void>;
  update: (id: string, patch: Partial<Transaction>, userId: string) => Promise<void>;
  remove: (id: string, userId: string) => Promise<void>;
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
};

export const db: DbClient = d1Db;
