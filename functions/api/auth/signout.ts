interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const cookie = request.headers.get("Cookie");
    const sessionToken = cookie?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

    if (sessionToken) {
      await env.DB.prepare(
        "DELETE FROM sessions WHERE token = ?"
      ).bind(sessionToken).run();
    }

    const response = Response.json({ success: true });
    response.headers.set("Set-Cookie", "session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");

    return response;
  } catch (error: any) {
    console.error("Signout error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
};
