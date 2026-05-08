const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Khaata's friendly Indian personal-finance coach.
You receive the user's recent transactions, monthly totals, and budgets as JSON context.
Currency is Indian Rupees (₹). Be concise, practical, and warm.

Rules:
- Always look at the provided finance JSON before answering.
- Recognise that EMIs and rent are usually fixed; suggest realistic cuts in discretionary categories (Food delivery, Subscriptions, Shopping, Entertainment).
- Prefer specific, numbered recommendations with rupee amounts ("Reduce Swiggy spend by ~₹1,200 this month").
- Use short bullet points and bold key numbers with **markdown**.
- If data is empty, gently nudge the user to add transactions or scan a receipt.
- Never invent transactions that aren't in the context.`;

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const { messages, finance, provider, apiKey, apiUrl, model: customModel } = await request.json() as any;

    const ctx = `FINANCE_CONTEXT (JSON):\n${JSON.stringify(finance ?? {}, null, 2)}`;
    const fullMessages = [
      { role: "system", content: SYSTEM },
      { role: "system", content: ctx },
      ...(messages ?? []),
    ];

    let url = "";
    let model = "";
    let key = "";
    let body: any = {};

    if (provider === "gemini" && apiKey) {
      url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      key = apiKey;
      model = "gemini-2.5-flash";
      body = { model, messages: fullMessages, stream: true };
    } else if (provider === "custom" && apiKey && apiUrl && customModel) {
      url = `${apiUrl}/chat/completions`;
      key = apiKey;
      model = customModel;
      body = { model, messages: fullMessages, stream: true };
    } else {
      return new Response(JSON.stringify({ error: "AI provider not configured. Please set up your API key in Settings." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!key) {
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached, try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error", response.status, t);
      return new Response(JSON.stringify({ error: "AI provider error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("advisor error", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};
