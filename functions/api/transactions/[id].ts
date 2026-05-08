import { d1Repo } from "../../../db/d1";

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

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id as string;
  const body = await request.json() as any;
  const { userId: _, ...patch } = body;

  const repo = d1Repo(env.DB);
  await repo.update(id, patch, userId);

  return Response.json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id as string;

  const repo = d1Repo(env.DB);
  await repo.remove(id, userId);

  return Response.json({ success: true });
};
