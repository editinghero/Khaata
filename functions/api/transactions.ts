import { d1Repo } from "../../db/d1";

interface Env {
  DB: D1Database;
}

async function getUserFromSession(request: Request, env: Env): Promise<string | null> {
  const cookie = request.headers.get("Cookie");
  const sessionToken = cookie?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

  if (!sessionToken) return null;

  const session = await env.DB.prepare(
    "SELECT user_id, expires_at FROM sessions WHERE token = ?"
  ).bind(sessionToken).first() as { user_id: string; expires_at: string } | null;

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session.user_id;
}

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
