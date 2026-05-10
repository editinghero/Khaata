import { d1Repo } from "../../db/d1";
import { Env, getUserFromSession } from "./_auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = d1Repo(env.DB);
  const transactions = await repo.list(userId);

  return Response.json(transactions);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as any;
  const { userId: _, ...tx } = body;

  const repo = d1Repo(env.DB);
  await repo.insert(tx, userId);

  return Response.json({ success: true });
};
