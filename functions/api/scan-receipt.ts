const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const { imageBase64, provider, apiKey, apiUrl, model } = await request.json() as any;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ error: "AI provider not configured. Please set up your API key in Settings." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert OCR engine specialized in **Indian payment screenshots** — UPI apps, bank apps, e-commerce orders, transaction history lists and printed receipts. You understand layouts of:

UPI apps: PhonePe, Google Pay (GPay), Paytm, BHIM, Amazon Pay, Cred, MobiKwik, WhatsApp Pay, Slice, Fampay, Jupiter, Fi Money, Navi, Groww Pay
Bank apps: HDFC, SBI YONO, ICICI iMobile, Axis Mobile, Kotak 811, IDFC First, Yes Bank, PNB One, BoB World, Federal FedMobile
E-commerce / food / grocery: Swiggy, Zomato, Blinkit, Zepto, BigBasket, JioMart, Reliance Retail, DMart, Amazon, Flipkart, Myntra, Ajio, Nykaa, Croma, XpressBees, Uber, Ola, IRCTC, BookMyShow, 1mg, PharmEasy
Subscriptions / utilities: Netflix, Prime, Hotstar, Spotify, Airtel, Jio, Vi, BSNL, Tata Power, Adani, BESCOM

## CRITICAL — Detect the screenshot type first:

**TYPE A — "single"**: One single transaction detail screen (a payment success page, an order confirmation, a single SMS, a printed receipt). Extract ONE transaction.

**TYPE B — "list"**: A transaction history / passbook / statement list showing MULTIPLE entries stacked vertically — typical in GPay/PhonePe/Paytm history, bank passbooks, "Transaction History" screens, monthly statements. Extract EVERY visible transaction as a separate item. Do NOT merge them. Even partially-visible rows at the bottom should be skipped only if amount or merchant is unreadable. Skip promotional banners/ads. Ignore section headers like "March 2026", "April 2026" — but use them to date entries that only show a day-month.

## Per-transaction extraction rules:
- **merchant**: Payee / shop / biller. For UPI prefer "Paid to / To:" name. Strip honorifics, UPI handles, "LIMITED", "PRIVATE LTD", trailing "..." truncation if obvious. For person-to-person UPI keep the person's name.
- **amount**: Final paid amount in INR as a plain number. Strip ₹, "Rs.", commas. Use the row's amount, not running totals.
- **date**: ISO YYYY-MM-DD. If only "25 Mar" visible, infer year from nearest section header ("March 2026" -> 2026-03-25). If only "Today/Yesterday" use empty string.
- **transactionType**: "debit" if money sent (red ↑ arrow, "Sent", "Debited", "Paid", "DR"), "credit" if received (green ↓, "Received", "Credited", "CR", "Refund"). NOTE: in some apps green up-arrow still means "sent via UPI" — read the label, not just the color.
- **status**: "success" (default), "declined", "pending", "failed" — set if explicitly shown.
- **upiId / referenceId / paymentMethod / note / confidence**: as before.

Skip: Declined/Failed transactions can still be extracted but mark status accordingly. Skip ad banners, "Spend analytics" links, footer nav, and totals/summary cards (e.g. "Total Cashback").

Be tolerant of regional language text — numbers are usually digits.`;

    let endpoint = "";
    let modelName = "";

    if (provider === "gemini") {
      endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      modelName = "gemini-2.5-flash";
    } else if (provider === "custom" && apiUrl && model) {
      endpoint = `${apiUrl}/chat/completions`;
      modelName = model;
    } else {
      return new Response(JSON.stringify({ error: "Invalid provider configuration" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Detect whether this is a single payment screen or a transaction-history list, then extract every transaction. Return ONLY the tool call." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_receipts",
            description: "Return one or many extracted transactions plus the screenshot type.",
            parameters: {
              type: "object",
              properties: {
                screenshotType: { type: "string", enum: ["single", "list"], description: "single transaction screen vs list/history screen" },
                transactions: {
                  type: "array",
                  description: "All transactions found. Length 1 for single, N for list.",
                  items: {
                    type: "object",
                    properties: {
                      merchant: { type: "string" },
                      amount: { type: "number" },
                      date: { type: "string", description: "YYYY-MM-DD or empty" },
                      transactionType: { type: "string", enum: ["debit", "credit"] },
                      status: { type: "string", enum: ["success", "declined", "pending", "failed"] },
                      upiId: { type: "string" },
                      referenceId: { type: "string" },
                      paymentMethod: { type: "string", enum: ["UPI", "Card", "NetBanking", "Wallet", "Cash", "Unknown"] },
                      note: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["merchant", "amount", "transactionType", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["screenshotType", "transactions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_receipts" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Could not parse receipt" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("scan-receipt error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
