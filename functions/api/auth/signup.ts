interface Env {
  DB: D1Database;
  DISABLE_SIGNUPS?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (env.DISABLE_SIGNUPS === "true") {
      return Response.json({ message: "New signups are disabled" }, { status: 403 });
    }

    const { email, password } = await request.json() as { email: string; password: string };

    if (!email || !password) {
      return Response.json({ message: "Email and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existing) {
      return Response.json({ message: "Email already registered" }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(userId, email, passwordHash).run();

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await env.DB.prepare(
      "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(sessionToken, userId, expiresAt.toISOString()).run();

    const response = Response.json({
      user: { id: userId, email }
    });

    response.headers.set("Set-Cookie", `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`);

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
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
