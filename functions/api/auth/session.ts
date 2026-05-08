interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const cookie = request.headers.get("Cookie");
    const sessionToken = cookie?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

    if (!sessionToken) {
      return Response.json({ user: null }, { status: 401 });
    }

    const session = await env.DB.prepare(
      `SELECT s.user_id, s.expires_at, u.email 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ?`
    ).bind(sessionToken).first() as { user_id: string; email: string; expires_at: string } | null;

    if (!session) {
      return Response.json({ user: null }, { status: 401 });
    }

    if (new Date(session.expires_at) < new Date()) {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(sessionToken).run();
      return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({
      user: { id: session.user_id, email: session.email }
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return Response.json({ user: null }, { status: 401 });
  }
};
