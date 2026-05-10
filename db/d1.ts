import type { Transaction } from "../src/lib/finance";

export interface D1Database {
  prepare(query: string): {
    bind(...values: any[]): {
      all<T = unknown>(): Promise<{ results: T[] }>;
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
}

const ROW_TO_TX = (r: any): Transaction => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  category: r.category,
  note: r.note ?? "",
  merchant: r.merchant ?? undefined,
  date: r.date,
  dueDate: r.due_date ?? undefined,
  recurring: !!r.recurring,
});

export function d1Repo(db: D1Database) {
  return {
    async list(userId: string): Promise<Transaction[]> {
      const { results } = await db
        .prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC")
        .bind(userId)
        .all();
      return results.map(ROW_TO_TX);
    },

    async insert(tx: Transaction, userId: string): Promise<void> {
      await db
        .prepare(
          `INSERT INTO transactions
           (id, user_id, type, amount, category, note, merchant, date, due_date, recurring)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          tx.id, userId, tx.type, tx.amount, tx.category, tx.note,
          tx.merchant ?? null, tx.date, tx.dueDate ?? null, tx.recurring ? 1 : 0
        )
        .run();
    },

    async update(id: string, patch: Partial<Transaction>, userId: string): Promise<void> {
      const fields: string[] = [];
      const values: any[] = [];
      const map: Record<string, string> = {
        type: "type", amount: "amount", category: "category", note: "note",
        merchant: "merchant", date: "date", dueDate: "due_date", recurring: "recurring",
      };
      for (const [k, col] of Object.entries(map)) {
        if (k in patch) {
          fields.push(`${col} = ?`);
          const v = (patch as any)[k];
          values.push(k === "recurring" ? (v ? 1 : 0) : v ?? null);
        }
      }
      if (!fields.length) return;
      fields.push("updated_at = datetime('now')");
      values.push(id, userId);
      await db
        .prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
        .bind(...values)
        .run();
    },

    async remove(id: string, userId: string): Promise<void> {
      await db
        .prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?")
        .bind(id, userId)
        .run();
    },
    budgets: {
      async list(userId: string): Promise<Record<string, number>> {
        const { results } = await db
          .prepare("SELECT category, amount FROM budgets WHERE user_id = ?")
          .bind(userId)
          .all<{ category: string; amount: number }>();
        const budgets: Record<string, number> = {};
        for (const r of results) budgets[r.category] = Number(r.amount);
        return budgets;
      },
      async update(userId: string, category: string, amount: number): Promise<void> {
        const id = crypto.randomUUID();
        await db
          .prepare(
            `INSERT INTO budgets (id, user_id, category, amount)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id, category) DO UPDATE SET
             amount = excluded.amount, updated_at = datetime('now')`
          )
          .bind(id, userId, category, amount)
          .run();
      },
    },
  };
}
