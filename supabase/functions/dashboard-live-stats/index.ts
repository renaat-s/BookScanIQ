// Live dashboard stats: counts Drive files in InvoiceIQ folder (recursively) and
// sums current-month Income/Expense rows from the user's Bookkeeping spreadsheet.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Count any real financial-document file routed into the InvoiceIQ directory.
// Covers PDFs plus all common receipt/invoice image formats. Folders and Google
// Workspace docs (Docs/Sheets/Slides) are excluded — only actual uploaded files.
const COUNTED_MIMES = new Set([
  "application/pdf",
  "text/html",
  "application/xhtml+xml",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/bmp",
  "image/gif",
]);
const FOLDER_MIME = "application/vnd.google-apps.folder";

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth client credentials not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: refreshToken, grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token exchange failed: ${data.error_description || data.error || res.status}`);
  }
  return data.access_token as string;
}

async function countDriveFiles(accessToken: string, rootFolderId: string): Promise<number> {
  let count = 0;
  const queue: string[] = [rootFolderId];
  const headers = { Authorization: `Bearer ${accessToken}` };

  while (queue.length) {
    const folderId = queue.shift()!;
    let pageToken: string | undefined;
    do {
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
      url.searchParams.set("fields", "nextPageToken,files(id,mimeType)");
      url.searchParams.set("pageSize", "1000");
      url.searchParams.set("supportsAllDrives", "true");
      url.searchParams.set("includeItemsFromAllDrives", "true");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Drive list error: ${await res.text()}`);
      const data = await res.json();
      for (const f of data.files ?? []) {
        if (f.mimeType === FOLDER_MIME) queue.push(f.id);
        else if (COUNTED_MIMES.has(f.mimeType)) count++;
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  }
  return count;
}

function parseNum(v: unknown): number {
  if (v == null) return 0;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;

  // ISO / RFC / long-form ("Jul 3, 2026", "3 Jul 2026", etc.)
  const iso = new Date(s);
  if (!isNaN(iso.getTime()) && /[a-zA-Z]/.test(s) || /^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    if (!isNaN(iso.getTime())) return iso;
  }

  // Numeric DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, etc.
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, a, b, y] = m;
    if (y.length === 2) y = `20${y}`;
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    // Disambiguate: >12 means it must be the day.
    const dayFirst = na > 12 || (nb <= 12 && na <= 12); // prefer DD/MM when ambiguous
    const day = dayFirst ? na : nb;
    const mon = dayFirst ? nb : na;
    const d = new Date(Date.UTC(parseInt(y, 10), mon - 1, day));
    if (!isNaN(d.getTime()) && d.getUTCMonth() === mon - 1) return d;
  }

  // Last-ditch: let Date parse whatever it can
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

async function fetchSheetTotals(accessToken: string, spreadsheetId: string) {
  // Get first sheet's title
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!metaRes.ok) throw new Error(`Sheets metadata error: ${await metaRes.text()}`);
  const meta = await metaRes.json();
  const title = meta.sheets?.[0]?.properties?.title ?? "Sheet1";

  const range = `${title}!A1:Z10000`;
  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!valRes.ok) throw new Error(`Sheets values error: ${await valRes.text()}`);
  const vals = await valRes.json();
  const rows: string[][] = vals.values ?? [];
  if (!rows.length) return { income: 0, expense: 0 };

  // Find header row — first row with both "type" and "amount"
  let headerIdx = -1;
  let typeCol = -1, amountCol = -1, dateCol = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map((c) => (c || "").toString().trim().toLowerCase());
    const t = r.findIndex((c) => c === "type");
    const a = r.findIndex((c) => c === "amount" || c.startsWith("amount"));
    if (t >= 0 && a >= 0) {
      headerIdx = i; typeCol = t; amountCol = a;
      dateCol = r.findIndex((c) => c === "date" || c.includes("date"));
      break;
    }
  }
  if (headerIdx < 0) return { income: 0, expense: 0 };
  // Current-month totals require a real date column — otherwise we'd sum the
  // full ledger history and mislabel it as "this month".
  if (dateCol < 0) return { income: 0, expense: 0 };

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  let income = 0, expense = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.length) continue;
    const typeRaw = (r[typeCol] || "").toString().toLowerCase();
    const amt = parseNum(r[amountCol]);
    if (!amt) continue;

    const isIncome = typeRaw.includes("income") || typeRaw.includes("↗");
    const isExpense = typeRaw.includes("expense") || typeRaw.includes("↘");
    if (!isIncome && !isExpense) continue;

    const d = parseDate(r[dateCol]);
    if (!d) continue;
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== m) continue;
    }

    if (isIncome) income += Math.abs(amt);
    else expense += Math.abs(amt);
  }
  return { income, expense };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: creds } = await admin
      .from("user_credentials")
      .select("google_refresh_token, root_folder_id, user_spreadsheet_id")
      .eq("user_id", user.id)
      .single();

    if (!creds?.google_refresh_token) {
      return json({ totalDocuments: 0, income: 0, expense: 0, error: "Google not connected" });
    }

    const accessToken = await exchangeRefreshToken(creds.google_refresh_token);

    const [totalDocuments, totals] = await Promise.all([
      creds.root_folder_id ? countDriveFiles(accessToken, creds.root_folder_id).catch((e) => {
        console.error("drive count error", e); return 0;
      }) : Promise.resolve(0),
      creds.user_spreadsheet_id ? fetchSheetTotals(accessToken, creds.user_spreadsheet_id).catch((e) => {
        console.error("sheet totals error", e); return { income: 0, expense: 0 };
      }) : Promise.resolve({ income: 0, expense: 0 }),
    ]);

    return json({
      totalDocuments,
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    });
  } catch (e) {
    console.error("dashboard-live-stats error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
