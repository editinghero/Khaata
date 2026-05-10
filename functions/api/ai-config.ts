import { Env, getUserFromSession } from "./_auth";

async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = encoder.encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", keyBuffer),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    dataBuffer
  );

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedData: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", keyBuffer),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await env.DB.prepare(
    "SELECT ai_provider, ai_config_encrypted FROM users WHERE id = ?"
  ).bind(userId).first() as { ai_provider: string | null; ai_config_encrypted: string | null } | null;

  if (!user || !user.ai_config_encrypted) {
    return Response.json({
      provider: user?.ai_provider || "gemini",
      config: {}
    });
  }

  try {
    const decrypted = await decryptData(user.ai_config_encrypted, userId);
    const config = JSON.parse(decrypted);
    
    return Response.json({
      provider: user.ai_provider || "gemini",
      config
    });
  } catch (error) {
    console.error("Decryption error:", error);
    return Response.json({
      provider: user.ai_provider || "gemini",
      config: {}
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, config } = await request.json() as {
    provider: string;
    config: {
      geminiKey?: string;
      customApiUrl?: string;
      customApiKey?: string;
      customModel?: string;
    };
  };

  const encrypted = await encryptData(JSON.stringify(config), userId);

  await env.DB.prepare(
    "UPDATE users SET ai_provider = ?, ai_config_encrypted = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(provider, encrypted, userId).run();

  return Response.json({ success: true });
};
