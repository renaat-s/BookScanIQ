// Sync the user's Google Sheets bookkeeping ledger into a durable
// public.ledger_entries table so historical analytics survive sheet edits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeadersFor } from "../_shared/cors.ts";

const json = (b: unknown, headers: Record<string, string>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...headers, "Content-Type": "application/json" } });

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth client credentials not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token exchange failed: ${data.error_description || data.error || res.status}`);
  }
  return data.access_token as string;
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
  const iso = new Date(s);
  if (!isNaN(iso.getTime()) && (/[a-zA-Z]/.test(s) || /^\d{4}-\d{1,2}-\d{1,2}/.test(s))) return iso;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, a, b, y] = m;
    if (y.length === 2) y = `20${y}`;
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    const dayFirst = na > 12 || (nb <= 12 && na <= 12);
    const day = dayFirst ? na : nb;
    const mon = dayFirst ? nb : na;
    const d = new Date(Date.UTC(parseInt(y, 10), mon - 1, day));
    if (!isNaN(d.getTime())) return d;
  }
  return isNaN(iso.getTime()) ? null : iso;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractDriveFileId(v: unknown): string | null {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function inferDocumentType(v: unknown): string {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("invoice")) return "invoice";
  if (s.includes("receipt")) return "receipt";
  if (s.includes("bill")) return "bill";
  return "other";
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
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
    if (!user) return json({ error: "Not authenticated" }, corsHeaders, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: creds } = await admin
      .from("user_credentials")
      .select("google_refresh_token, user_spreadsheet_id, last_ledger_sync_at")
      .eq("user_id", user.id)
      .single();

    if (!creds?.google_refresh_token || !creds?.user_spreadsheet_id) {
      return json({ synced: 0, error: "Google not connected" }, corsHeaders);
    }

    // Throttle: skip sync if last one was under 15 min ago, unless body.force
    let force = false;
    try {
      const body = await req.clone().json();
      force = body?.force === true;
    } catch { /* no body */ }
    if (!force && creds.last_ledger_sync_at) {
      const age = Date.now() - new Date(creds.last_ledger_sync_at).getTime();
      if (age < 15 * 60 * 1000) {
        return json({ synced: 0, skipped: true, reason: "throttled" }, corsHeaders);
      }
    }

    const accessToken = await exchangeRefreshToken(creds.google_refresh_token);
    const spreadsheetId = creds.user_spreadsheet_id;

    // Fetch first sheet title
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!metaRes.ok) throw new Error(`Sheets metadata error: ${await metaRes.text()}`);
    const meta = await metaRes.json();
    const title = meta.sheets?.[0]?.properties?.title ?? "Sheet1";

    const valRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${title}!A1:Z10000`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!valRes.ok) throw new Error(`Sheets values error: ${await valRes.text()}`);
    const vals = await valRes.json();
    const rows: string[][] = vals.values ?? [];

    // Locate header row
    let headerIdx = -1;
    const colIdx: Record<string, number> = {};
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i].map((c) => (c || "").toString().trim().toLowerCase());
      const t = r.findIndex((c) => c === "type");
      const a = r.findIndex((c) => c === "amount" || c.startsWith("amount"));
      if (t >= 0 && a >= 0) {
        headerIdx = i;
        colIdx.type = t;
        colIdx.amount = a;
        colIdx.date = r.findIndex((c) => c === "date" || c.includes("date"));
        colIdx.vendor = r.findIndex((c) => c === "vendor" || c.includes("vendor") || c === "merchant" || c === "supplier");
        colIdx.category = r.findIndex((c) => c === "category" || c.includes("category"));
        // No dedicated category column in most ledgers: the Drive "Folder"
        // column carries the classification (e.g. Subscriptions, Refunds).
        colIdx.folder = r.findIndex(
          (c) => c === "folder" || c.includes("folder") || c === "classification" || c.includes("expense type") || c === "sub-type",
        );
        colIdx.link = r.findIndex((c) => c.includes("link") || c.includes("url") || c === "file");
        colIdx.docType = r.findIndex((c) => c.includes("document") || c === "kind");
        break;
      }
    }
    if (headerIdx < 0) {
      await admin.from("user_credentials").update({ last_ledger_sync_at: new Date().toISOString() }).eq("user_id", user.id);
      return json({ synced: 0, reason: "no_header" }, corsHeaders);
    }

    // Review queue gate: when enabled, brand-new rows land as "pending".
    const { data: profileRow } = await admin
      .from("profiles")
      .select("review_queue_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    const gateEnabled = Boolean(profileRow?.review_queue_enabled);

    const { data: existingRows } = await admin
      .from("ledger_entries")
      .select("sheet_row_hash")
      .eq("user_id", user.id);
    const existingHashes = new Set<string>(
      (existingRows || []).map((e: { sheet_row_hash: string }) => e.sheet_row_hash),
    );

    const seenHashes = new Set<string>();
    const upserts: Array<Record<string, unknown>> = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;

      const typeRaw = (r[colIdx.type] ?? "").toString().toLowerCase();
      const amt = parseNum(r[colIdx.amount]);
      const vendor = colIdx.vendor >= 0 ? String(r[colIdx.vendor] ?? "").trim() : "";
      const categoryCol = colIdx.category >= 0 ? String(r[colIdx.category] ?? "").trim() : "";
      const folderCol = colIdx.folder >= 0 ? folderToCategory(r[colIdx.folder]) : "";
      const category = categoryCol || folderCol;
      const link = colIdx.link >= 0 ? r[colIdx.link] : null;

      const isUncategorized = r.some((c) => (c ?? "").toString().trim().toLowerCase() === "uncategorized");
      let type: "income" | "expense" | "uncategorized" = "uncategorized";
      if (!isUncategorized) {
        if (typeRaw.includes("income") || typeRaw.includes("↗")) type = "income";
        else if (typeRaw.includes("expense") || typeRaw.includes("↘")) type = "expense";
        else continue; // unrecognized row, skip
      }

      if (type !== "uncategorized" && amt === 0) continue;

      const d = colIdx.date >= 0 ? parseDate(r[colIdx.date]) : null;
      const entryDate = d ? d.toISOString().slice(0, 10) : null;
      const month = d
        ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
        : "unknown";

      const hashInput = [
        entryDate ?? "",
        type,
        amt.toFixed(2),
        vendor.toLowerCase(),
        categoryCol.toLowerCase(), // folder-derived category deliberately excluded: keeps hashes stable
        String(r[colIdx.link] ?? ""),
      ].join("|");
      const hash = await sha256Hex(hashInput);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      upserts.push({
        user_id: user.id,
        entry_date: entryDate,
        month,
        type,
        amount: Math.abs(amt),
        vendor: vendor || null,
        category: category || null,
        document_type: colIdx.docType >= 0 ? inferDocumentType(r[colIdx.docType]) : inferDocumentType(category || vendor),
        drive_file_id: extractDriveFileId(link),
        source: "sheet_sync",
        sheet_row_hash: hash,
        verified_present: true,
        last_seen_at: new Date().toISOString(),
      });
    }

    // Upsert in batches. New rows carry a review_status; existing rows omit it
    // so a user's approve/reject decision is never overwritten by a re-sync.
    const freshRows = upserts
      .filter((u) => !existingHashes.has(u.sheet_row_hash as string))
      .map((u) => ({ ...u, review_status: gateEnabled ? "pending" : "approved" }));
    const knownRows = upserts.filter((u) => existingHashes.has(u.sheet_row_hash as string));

    let synced = 0;
    for (const set of [freshRows, knownRows]) {
      for (let i = 0; i < set.length; i += 500) {
        const chunk = set.slice(i, i + 500);
        const { error } = await admin
          .from("ledger_entries")
          .upsert(chunk, { onConflict: "user_id,sheet_row_hash" });
        if (error) throw new Error(`upsert error: ${error.message}`);
        synced += chunk.length;
      }
    }

    // Mark rows not seen this run as no longer present in sheet (they're kept
    // in the log — the point of the permanent log — but flagged).
    if (seenHashes.size > 0) {
      const missing = Array.from(existingHashes).filter((h) => !seenHashes.has(h));
      if (missing.length > 0) {
        await admin
          .from("ledger_entries")
          .update({ verified_present: false })
          .eq("user_id", user.id)
          .in("sheet_row_hash", missing);
      }
    }

    await admin
      .from("user_credentials")
      .update({ last_ledger_sync_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return json({ synced, seen: seenHashes.size }, corsHeaders);
  } catch (e) {
    console.error("sync-ledger-log error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, corsHeaders, 500);
  }
});
