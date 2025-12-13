import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userName, submitCategory, category, receiptData } = await req.json();
    
    // If this is a category submission, send it to the n8n webhook
    if (submitCategory && category) {
      const N8N_CLASSIFY_WEBHOOK = Deno.env.get("N8N_CLASSIFY_RECEIPT_WEBHOOK_URL");
      if (!N8N_CLASSIFY_WEBHOOK) {
        console.error("N8N_CLASSIFY_RECEIPT_WEBHOOK_URL is not configured");
        return new Response(JSON.stringify({ error: "Classification webhook not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Sending category to n8n:", { category, receiptData });
      
      const webhookResponse = await fetch(N8N_CLASSIFY_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          receiptData,
          userName,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("n8n webhook error:", webhookResponse.status, errorText);
        return new Response(JSON.stringify({ error: "Failed to submit classification" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const webhookData = await webhookResponse.json().catch(() => ({}));
      console.log("n8n webhook response:", webhookData);
      
      return new Response(JSON.stringify({ success: true, ...webhookData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an AI assistant for InvoiceIQ helping to extract and categorize receipt information. The user has uploaded a receipt/invoice that needs verification. Your primary goal is to identify the following markers:

CRITICAL FIELDS (highest priority):
- Amount of Money Spent (amount): The total cost on the receipt
- Type of Expenditure (type): The category of expense (e.g., Accommodation, Rent, Business Meals, Payroll Expenses, Office Supplies, Travel, Equipment, Software/Subscriptions, Utilities, Professional Services, Marketing, Training, Miscellaneous)

ADDITIONAL FIELDS:
- Receipt ID (receiptId)
- Receipt Data (receiptData)
- Receipt Date (date)
- Month of the Expenditure (month)
- Name of the Vendor (vendorName)
- Receipt Number (invoiceNumber)
- The Currency Used (amountSigned)
- Any Other Text on the Receipt (rawText)

IMPORTANT: If you cannot determine the TYPE of expenditure from the available information, politely ask the user to clarify what this expenditure was for. Be conversational and helpful.

Once you have identified the type, provide a clear categorization statement: "This is categorized as [TYPE]"

Keep responses short, friendly, and focused on gathering the missing information.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
