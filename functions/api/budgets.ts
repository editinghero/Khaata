import { d1Repo } from "../../db/d1";
import { Env, getUserFromSession } from "./_auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = d1Repo(env.DB);
  const budgets = await repo.budgets.list(userId);

  return Response.json(budgets);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { category: string; amount: number } | { budgets: Record<string, number> };
  const repo = d1Repo(env.DB);

  if ("budgets" in body) {
    // Reset or bulk update
    for (const [category, amount] of Object.entries(body.budgets)) {
      await repo.budgets.update(userId, category, amount);
    }
  } else {
    // Single update
    await repo.budgets.update(userId, body.category, body.amount);
  }

  return Response.json({ success: true });
};
