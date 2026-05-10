export interface Env {
  DB: D1Database;
}

export function getSessionToken(request: Request): string | undefined {
  const cookie = request.headers.get("Cookie");
  return cookie?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];
}

export async function getUserFromSession(request: Request, env: Env): Promise<string | null> {
  const sessionToken = getSessionToken(request);

  if (!sessionToken) return null;

  const session = await env.DB.prepare(
    "SELECT user_id, expires_at FROM sessions WHERE token = ?"
  ).bind(sessionToken).first() as { user_id: string; expires_at: string } | null;

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session.user_id;
}
