interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { email, password } = await request.json() as { email: string; password: string };

    if (!email || !password) {
      return Response.json({ message: "Email and password required" }, { status: 400 });
    }

    const user = await env.DB.prepare(
      "SELECT id, email, password_hash FROM users WHERE email = ?"
    ).bind(email).first() as { id: string; email: string; password_hash: string } | null;

    if (!user) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await env.DB.prepare(
      "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(sessionToken, user.id, expiresAt.toISOString()).run();

    const response = Response.json({
      user: { id: user.id, email: user.email }
    });

    response.headers.set("Set-Cookie", `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`);

    return response;
  } catch (error: any) {
    console.error("Signin error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
