# BookScanIQ — Project Context (Memory)

> Canonical cross-session context for the BookScanIQ automation. Update this file when
> infrastructure, workflow status, or file locations change.
> Last deep analysis: 2026-10-05 · Live cloud access verified: 2026-10-05 (see §8).

---

## 1. Naming Rules (IMPORTANT)

- **Product/automation name:** BookScanIQ (rebranded from "InvoiceIQ").
- **Never rename the n8n workflows.** Renaming has caused breakage before. `InvoiceIQ`,
  `Invoice IQ`, and paths like `invoiceiq/invoice-upload` are legacy designations only —
  they stay exactly as they are. They are workflow names/IDs, not branding.
- Legacy project directory (pre-rebrand, historical): `C:\Users\renaa\OneDrive\Pictures\AI AGENT DEV\InvoiceIQ`
- Current project directory (utility + future AI-agent integration): `C:\Users\renaa\AI AGENT DEV 2026\BookScanIQ`

---

## 2. The Three n8n Workflows

**As of 2026-10-11 the live DB contains ONLY these three** — every other workflow (Marketing
Agent V1, legacy V3/V4 copies, ApplyWise, etc.) was deleted; see §11. Treat these three as the
entire scope of BookScanIQ and ignore anything else named in old files or logs.

Live node counts (pulled from the cloud 2026-10-05):

| Workflow | Live nodes | Live status | Local file | n8n URL |
|---|---|---|---|---|
| Invoice IQ V4 (orchestrator) | **106** | active ⚠️ testing needed | stale copies — §4.1 | http://145.241.204.2:5678/workflow/8U4xYx0pgNYDLmWtqn1HE |
| Branch G Worker (backlog sub-workflow) | **23** | active ✅ | legacy dir `Branch G Worker.json` (**matches live exactly**) | http://145.241.204.2:5678/workflow/y357XGcddfmO51Ohs836U |
| InvoiceIQ Approved Export Sweep ("Sweep") | **48** | active ✅ | exported 2026-10-05 → `%TEMP%\opencode\live-export\` (stale — 47 nodes pre-fix) | http://145.241.204.2:5678/workflow/tvZzpbY5aG29rrfQ |

The Sweep is the repaired version from the runbooks: S0–S10 all present, `G1.6A/B/C` token
refresh copied in, plus `IF: S9 Both Pushes OK?`, `IF: Dry Run?`, `I2C QB Account Resolver`,
`SKIP Uncategorized (Keep for Review)`.

### 2.1 🔭 FOCUS SCOPE — only this workflow is under test

**`8U4xYx0pgNYDLmWtqn1HE` — "Invoice IQ V4"** is THE workflow for end-to-end testing.
Verified against the user's criteria (checked 2026-10-05 20:43 UTC):

| Criterion | Required | Actual | Result |
|---|---|---|---|
| URL designation | `8U4xYx0pgNYDLmWtqn1HE` | `8U4xYx0pgNYDLmWtqn1HE` | ✅ |
| Node count | ≥100 | **106 total = 100 functional + 6 sticky notes** | ✅ |
| Created | explicitly 2026-02-13 | `2026-02-13T19:03:57Z` | ✅ |
| Updated | within last 48 h | `2026-10-03T21:45:53Z` (~45 h ago) | ✅ |

The "extra 6" = canvas sticky notes: `Sticky Note`, `Sticky Note3`, `Sticky Note8`,
`Sticky Note9`, `Sticky Note11`, `Sticky Note12`. Functional node breakdown: httpRequest 36,
code 19, if 15, set 9, respondToWebhook 5, executeWorkflow 4, webhook 3, mistralAi 2, noOp 2,
openAi 1, extractFromFile 1, merge 1, splitInBatches 1, wait 1.

### 👻 GHOSTED — do not read, compare, diff, or test these

| Ghosted workflow | Created | Updated | State |
|---|---|---|---|
| `Kig1zzq7J1pRUkaQEgrsY` ("Invoice IQ V4", ~172 nodes) | 2026-02-26 | 2026-02-26 | inactive + archived in n8n |
| `rN9cxhYahzuCHvHR` ("Invoice IQ V4", ~201 nodes) | 2026-03-26 | 2026-03-26 | inactive + archived in n8n |

Both fail the user's keep-criteria (not created Feb 13; not touched in 48 h). They are
**permanently ignored** — never use them as a reference for node counts, structure, or
"canonical" comparisons, and never resurrect them. Also ignore their local exports.

`Branch G Worker` and `InvoiceIQ Approved Export Sweep` have exactly one instance each and are
**done / game-ready** — no testing, no changes.

`Marketing Agent V1.json` is **not** part of the BookScanIQ core three — it is a legacy
marketing/content agent (LinkedIn/Twitter approval loop).

---

## 3. Architecture Map (Invoice IQ V4 — live, 106 nodes)

Node-name prefixes = subsystems:

| Prefix | Subsystem | Notes |
|---|---|---|
| **A** | Payload/reconciliation | `A0 Universal Payload Assembler`, `A1 SaaS GDrive Super Router`, `A2 Data Packager`, `A2.5 Fetch Transactions` → `A4.5 IF: "Match Found?"`, `A5 Financial Logger` (the old `A4. Transcaction Matcher` was removed from live) |
| **F** | Xero export chain | `F2` contact search → `F5` create transaction → `F7` upload attachment; `F6` download receipt |
| **G** | Historical backlog scan | Webhook `POST /start-backfill` → query builder → Gmail search → 4-chunk fan-out to `G6-A..D` workers (all bound to `y357XGcddfmO51Ohs836U`) → cascade merge |
| **H** | Invoice intake | Webhook `POST /invoiceiq/invoice-upload` (headerAuth, CORS `*`, binary file) → PDF/image extract → date parse → ID merge → tokens to Supabase |
| **I** | QuickBooks export chain | `I2` search → `I5/I6` map bill/invoice → `I7/I8` create transaction → `I10` upload attachment |
| **J** | Directory install | Webhook `POST /install-directory` → fetch user vault → refresh Google token → `J4 SaaS Directory Installer` → `J5 Sync Mapping to Backend` |
| **XG/QBG** | Review gates | `XG/QBG Review Gate Check` → `IF: Is Approved?` → `XG/QBG Mark Exported`; plus `G8.5 Report Progress` / `G8.6 Check Limit` per accounting app (live V4 only) |

- All three webhooks use `headerAuth` + `responseMode: responseNode`.
- Credentials referenced: `Header Auth account 2`, `Mistral/InvoiceIQ Extract`, `OpenAi account`.
- AI: GPT-4o (extraction/interpreter), GPT-4o-mini (classification), Mistral OCR (PDF/image/HTML).
- Backend: Supabase project `wdnlblakhdfrpobyxlsa.supabase.co` — tables seen in runbooks:
  `profiles` (`user_id`, `review_queue_enabled`), `user_credentials`, review-gate endpoint.
- SaaS integrations: Google Drive + Google OAuth, Xero OAuth2, QuickBooks OAuth2.

### Branch G Worker pipeline (23 nodes, current)
`Execute Workflow Trigger` → `G7A Keyword Scanner` / `G7B Already Classified?` →
`G8.6 Get Dynamic Message` (HTTP, not gmail node) → `G8.7 Parse Attachment ID` →
`G8.8 Fetch Binary Base64` → `G8.9 Restore n8n Binary` → `G9/G10` binary normalize →
`G12 Is PDF?` → `G13 PDF` / `G14 Image` / `G14.5→G14.6 HTML archive` → `G14.7 Merge` →
`G15 Information Interpreter` (GPT-4o, strict json_schema, **9 fields**, verbatim/no-inference) →
`G15.5 Amount Normalizer` → `G16 Parse Date Components` → `G19/G20 Final Merge & Packaging`.
Also has `G6.7 Empty Input Guard` (handles small/empty batches).

**9 extracted fields:** Invoice Vendor, Invoice Number, Invoice Category, Invoice Type,
Invoice Date, Invoice Vendor Text, Invoice Recipient Text, Invoice Total, Tax Amount.

---

## 4. File Inventory & Canonical Sources

### 4.1 ⚠️ Three different copies of `Invoice IQ V4.json` exist — **LIVE IS CANONICAL**

| Copy | Size | Nodes | Contents |
|---|---|---|---|
| **LIVE** (exported 2026-10-05, `%TEMP%\opencode\live-export\8U4xYx0pgNYDLmWtqn1HE.json`) | 111,985 B | **106** | **SOURCE OF TRUTH** — everything below plus `G8.5/G8.6 Report Progress & Check Limit (Xero)` and `G8.5/G8.6 Report Progress & Check Limit (QB)` |
| `C:\Users\renaa\Downloads\Invoice IQ V4.json` (2026-08-03) | 153,652 B | 103 | Pre-August snapshot — has `A4. Transcaction Matcher`, lacks the 4 rate-limit guard nodes |
| Legacy project dir `...\InvoiceIQ\Invoice IQ V4.json` | 141,412 B | 93 | **STALE** — missing all XG/QBG review-gate nodes (older `Extract from PDF/Image` names) |

Live-vs-Downloads deltas: live **added** `G8.5 Report Progress (Xero/QB)` + `G8.6 Check Limit
(Xero/QB)`; live **no longer has** `A4. Transcaction Matcher` (its chain is now
`A2.5 Fetch Transactions` → `A4.5 IF: "Match Found?"` → `A5/A5.1`, so the matcher was removed,
not broken).

(All files in the legacy dir share mtime 2026-08-08 14:14:27 — a bulk OneDrive sync, so
mtimes there are meaningless. n8n is the source of truth: UI saves are live instantly.)

### 4.2 ✅ Sweep workflow — JSON recovered 2026-10-05
No local copy existed until now. Exported directly from the live instance →
`%TEMP%\opencode\live-export\tvZzpbY5aG29rrfQ.json` (53 KB, 47 nodes). **Not yet saved into
the BookScanIQ directory.** Documentation only:
- `C:\Users\renaa\Downloads\invoiceiq-n8n-sweep-runbook-v2.html` — full node-by-node repair runbook, audited live from the n8n DB read-only on 2026-08-03 (S0 schedule → S1 list users → S2 loop → S3 tokens → S5 review gate → S6 split → S7/S8 payloads → F/I chains → mark-exported → S10).
- `C:\Users\renaa\Downloads\invoiceiq-n8n-sweep-tail-nodes.html` — verified tail-node build for n8n 2.27.4 (S7/S8 payload contract, ok-check before mark-exported, pairedItem recovery of entry id).
- Related docs: `invoiceiq-n8n-feature-b-patch.html`, `invoiceiq-n8n-review-queue.html`, `invoiceiq-frontend-inventory.html`.

**Action item: copy the recovered Sweep export (§4.2) into BookScanIQ.**

> 🔒 Both runbook HTML files contain a **Supabase service-role key**. Never copy that key
> into docs, commits, or chat. Reference the file path instead.

### 4.3 Other legacy assets (in the InvoiceIQ dir)
- `branch_g_final_review.md` (+ `.resolved`) — 2026-02-28 architecture review. **Partially superseded**, see §5.
- `implementation_plan_cea.md`, `Marketing_Context.txt`, `Marketing Agent V1.json` — content/marketing agent (still points at a dead `*.ngrok-free.dev` approval URL).
- `InvoiceIQ_Portfolio_Export.html`, `dev_guide/` (20 operational screenshots).
- `walkthrough.md` — **empty (0 bytes)**.
- `nanoclone-website/` — marketing site (Vercel).
- ~60 one-off patch scripts (`fix_*.js`, `saasify_*.js`, `inject_*.js`, `apply_*.js`, …) — historical JSON patchers, no longer needed; archive or delete.
- Git repo exists but has **zero commits** — no version history despite ~2 years of development.

---

## 5. Status of the 2026-02-28 Branch G Review Concerns

| # | Concern | Now |
|---|---|---|
| 1 | Two divergent worker files | ✅ Resolved — only `Branch G Worker.json` remains |
| 2 | 4-field vs 8-field extractor | ✅ Resolved — single GPT-4o strict-schema extractor, now **9 fields** |
| 3 | `BRANCH_G_WORKER` placeholder workflow ID | ✅ Resolved — V4 hard-binds to `y357XGcddfmO51Ohs836U` |
| 4 | G5.5 empty chunks | ✅ Mitigated — `G6.7 Empty Input Guard` |
| 5 | Worker uploads to root, not year/month/type hierarchy | ⚠️ Unverified |
| 6 | Sweep not exported locally | ✅ Exported 2026-10-05 (§4.2) — pending copy into BookScanIQ |

Known deferred bug (from tail-nodes runbook): export nodes use `neverError` +
`onError: continueRegularOutput`, so `XG/QBG Mark Exported` stamps `exported_at` **even when
the push fails**. Fix = insert an ok-check before each mark node (Xero: `Attachments[0]`
present && no `ErrorNumber`; QB: `AttachableResponse[0].Attachable` present && no `Fault`).

---

## 6. Hosting & Infrastructure

Evolution: **Docker → ngrok → Oracle Cloud (current)**. No ngrok URLs remain in the
production workflow JSONs (only in legacy marketing files).

- **Instance:** BookScanIQ-Production_MAIN (Oracle Resource Manager stack)
- **Stack OCID:** `ocid1.ormstack.oc1.uk-london-1.amaaaaaap7dab4ian6i5ob7jwdqq754vts7lzkhix3vwdamablcgp7l3762a`
- **Created:** 2026-05-27 14:22:04 UTC · Terraform 1.5.x (HashiCorp)
- **Compartment / Tenancy (both):** `ocid1.tenancy.oc1..aaaaaaaaaeosb2lslxoemkyrgjwr65goi742mknockna7phgfinwxf754f7a` (compartment `renaat_s`, root)
- **Region/placement:** UK-LONDON-1, AD-2 (oLXD)
- **Image:** Ubuntu 24.04 Minimal aarch64 · **Shape:** VM.Standard.A1.Flex (Ampere ARM) — Oracle **Free Tier**
- **Network:** `vcn-20260523-0003` / `subnet-20260523-0003`; secondary `vcn-20260524-1913` / `subnet-20260524-1913`
- **Reserved public IP (n8n on :5678):** `145.241.204.2`

### Constraint
- **100-user cap**, caused by the unverified Google Cloud OAuth app (verification process).
  Lifting it requires completing Google Cloud app verification. Evidence of that effort:
  `Downloads\InvoiceIQ GC Verification.m4a`.

---

## 7. Open Action Items

1. Copy the live exports (`%TEMP%\opencode\live-export\` — V4, Branch G Worker, Sweep) into BookScanIQ as the canonical backup set.
2. Finish testing Invoice IQ V4 ⚠️ (only untested workflow).
3. Add the ok-check before `XG/QBG Mark Exported` in V4 (deferred bug, §5) — note the Sweep already has `IF: S9 Both Pushes OK?`.
4. Confirm backlog-scanned invoices reach the year/month/type Drive hierarchy (§5 #5).
5. Version control: git-init BookScanIQ and commit the workflow JSONs.
6. Archive the ~60 legacy patch scripts out of the InvoiceIQ directory.

---

## 8. Live Cloud Access (verified 2026-10-05)

**Read path that works today — SSH (no n8n API key exists locally):**

- Key: `ssh_keys\ssh_set4\ssh-key-2026-05-22.key` → `ubuntu@145.241.204.2` (only key4 works; keys 1–3 are rejected). Copy it outside OneDrive and strip ACLs before use (`icacls file /inheritance:r /grant:r "%USERNAME%:R"`).
- Host: `invoiceiq-production-v2`, up since boot, n8n runs as **Docker container `n8n`** (`n8nio/n8n`, port 5678). `systemctl n8n` is inactive — the container is the service.
- n8n data: container `/home/node/.n8n/database.sqlite` (406 MB + WAL), owned by `opc`.
- List: `sudo docker exec n8n n8n list:workflow`
- Export one: `sudo docker exec n8n n8n export:workflow --id=<ID> --output=/tmp/<ID>.json`
  (writes to the **container** `/tmp` — then `sudo docker cp n8n:/tmp/<ID>.json ~/live_export/` and `scp` it off.)
- HTTP API (`/api/v1/…`, `/rest/…`) returns **401** — no API key/owner session available. Web UI at http://145.241.204.2:5678.

**Full live inventory (11 workflows):**

| ID | Name | Active | Nodes |
|---|---|---|---|
| `8U4xYx0pgNYDLmWtqn1HE` | Invoice IQ V4 | ✅ | 106 ← **the one** (§2.1) |
| `y357XGcddfmO51Ohs836U` | Branch G Worker | ✅ | 23 |
| `tvZzpbY5aG29rrfQ` | InvoiceIQ Approved Export Sweep | ✅ | 47 |
| 👻 `Kig1zzq7J1pRUkaQEgrsY` | "Invoice IQ V4" | ❌ archived | ~172 — **GHOSTED** |
| 👻 `rN9cxhYahzuCHvHR` | "Invoice IQ V4" | ❌ archived | ~201 — **GHOSTED** |
| `vgq1r9nLoPImlGjd` | InvoiceIQ | — | legacy |
| `jqF5FQVGaAEvmVmM` | Invoice IQ V3 | — | legacy |
| `XOyW9obibZU3a3Or` | Marketing Agent V1 | — | not core |
| others | `Main Agent Production Workflow \| ApplyWise`, `Test Instance`, `My workflow` | — | unrelated/scratch |

⚠️ Two **ghosted/archived** workflows share the exact name "Invoice IQ V4" — always address
the live one **by ID `8U4xYx0pgNYDLmWtqn1HE`**, never by name (reinforces the no-rename rule).

**Pulled copies (2026-10-05):** `%TEMP%\opencode\live-export\` — 3 canonical JSONs (V4, worker,
Sweep). The 2 ghosted exports were deleted. Temporary location; promote into BookScanIQ.

---

## 9. Incident 2026-10-07 — Mistral 429s in Branch G Worker (ROOT CAUSE CONFIRMED 2026-10-10)

**Run:** parent `Invoice IQ V4` exec **2011** (webhook `/start-backfill`) 19:27:54–19:31:53 UTC
= 20:27–20:31 local. Child workers: execs **2012–2015** (`y357XGcddfmO51Ohs836U`).

### What happened
74 emails fetched → G7B filtered 64 as non-financial (expected) → **10 financial items** →
all 10 hit `G14.6 Extract from HTML` (Mistral) → **429 "The service is receiving too many
requests from you" on every call**, incl. isolated single-item calls at 19:29:40, 19:29:49,
19:29:55, 19:30:01 (spaced 6–8 s, no other Mistral traffic in n8n).

### Why data was lost (4 workflow defects, independent of the 429 cause)
1. `G14.6` and `G14. Extract from Image` have **`retryOnFail: false`** (only `G13. Extract from PDF`
   has 3 retries × 5 s) → 429 never retried, no backoff.
2. `onError: continueRegularOutput` + `alwaysOutputData: true` → error becomes the item payload
   `{"error": "..."}`; node reports **success**, execution status **success**.
3. No guard before `G15. Information Interpreter` → GPT-4o receives `{error}`-only items →
   **400 "Bad request - please check your parameters"** (all 10).
4. **`G16. Parse Date Components` rebuilds the object from scratch** (drops `$json.error`) →
   emits all-null fields + `status: "processed_worker"` → parent `A2` fills defaults
   (`Unknown Vendor`, `N/A`, `0.00`, `General`) → **`A5.1 Append New Row` wrote 10 junk rows**
   to the user's `Transactions` sheet. Error is invisible; items look processed.

### Why Mistral returned 429 (not an n8n concurrency problem)
- Workers ran **sequentially** (A 19:29:36 → B 19:29:46 → C 19:29:52 → D 19:29:59); even a
  single request seconds after the previous one was rejected → the first call of the run failed.
- Only 33 executions exist in the DB since 2026-09-24; nothing else uses the Mistral credential
  at that time (daily marketing workflow errors at 13:00, Sweep at 04:00 has no Mistral).
- Mistral 429 = exceeded **RPS**, **tokens/min**, or **tokens/month** (help.mistral.ai). With
  ~1 req / 6–8 s rejected, RPS is ruled out → **monthly token cap / free-tier quota / workspace
  budget limit** (Admin panel → Limits; a workspace budget returns 429 until the cycle resets).

### ROOT CAUSE CONFIRMED (2026-10-10) — account-level, not n8n
- Decrypted the live Mistral credential from the VM (encryption key in container
  `/home/node/.n8n/config`; credential `Mistral/InvoiceIQ Extract`, id `qnEagfor7oa7TSP4`)
  and made an **isolated single** `mistral-small-latest` call directly against
  `api.mistral.ai` — completely bypassing n8n.
- Result: **HTTP 429** with header **`x-ratelimit-limit-req-minute: 0`** (allowed request
  rate is literally ZERO) and body `{"type":"rate_limited","code":"1300"}`.
- The key is valid (auth passed — 401 would have meant a bad key), but the account/plan is
  throttled to zero requests. n8n, retries, backoff, and concurrency are all irrelevant:
  **every** Mistral call fails until the user resolves the limit in the Mistral console.
- Note: the snapshot DB copy had a stale credential blob that 401'd — use the live
  `/home/node/.n8n/database.sqlite` if re-testing (copy db + `-wal` + `-shm` together).

### Open actions (pending user approval)
- ~~User to check console.mistral.ai~~ → superseded by the local-proxy pivot (§10).
- Enable retry+backoff on `G14.6`/`G14`; add an error-gate after the Mistral nodes; make `G16`
  preserve failure (`status: "extraction_failed"`) instead of `processed_worker`; stop `A2` from
  defaulting failed items to `Unknown Vendor / 0.00`.
- Side artifacts cleaned: `~/n8n_snapshot/`, `/tmp/*.py|sh|sql`, container `/tmp/*.json` ✅

---

## 10. Local Mistral Proxy Pivot (DEPLOYED 2026-10-11) — Nanoclone extraction engine

Because the Mistral account is throttled to **0 req/min** (§9), all G13/G14/G14.6 traffic is now
intercepted at the network layer and served locally. **No workflow/canvas changes were made.**

### Architecture
```
n8n ──(hosts: api.mistral.ai → 172.17.0.1)──► nanoclone-proxy:443 (HTTPS, private CA)
                                                 ├─ .html/.htm or text/html → markdownify (~0.4 s)
                                                 └─ PDF/image → Docling CPU (~12 s warm)
                                               response: {"pages":[{"markdown": ...}]}
```

### Deployment (host `145.241.204.2`, Ubuntu 24.04, Docker 29.6.1, **954 MB RAM / 2 CPU**)
| Piece | Location |
|---|---|
| Private CA + leaf cert | `/home/ubuntu/nanoclone-proxy/certs/` (root CA 4096, leaf CN/SAN=`api.mistral.ai`) |
| Proxy app | `/home/ubuntu/nanoclone-proxy/app.py` — `POST /v1/ocr` (JSON, the real n8n contract) + `/v1/documents` (multipart) |
| Image | `nanoclone-proxy:latest` (torch **CPU** build + docling; build asserts `torchvision` ABI) |
| Container | `nanoclone-proxy`, bridge, `-p 443:443`, certs `:ro`, `--memory 800m`, `unless-stopped` |
| CA trust in n8n | `NODE_EXTRA_CA_CERTS=/home/node/.n8n/nanocloneRootCA.crt` |
| DNS spoof | `--add-host=api.mistral.ai:172.17.0.1` on the n8n container |

### Critical gotchas (don't regress these)
1. **Wire contract:** n8n's Mistral node calls **`POST /v1/ocr` with JSON**
   (`document.document_url`/`image_url` = `data:<mime>;base64,...`) and reads `pages[].markdown`
   — *not* multipart `/v1/documents`. Endpoint hardcoded in `nodes/MistralAI/GenericFunctions.js`.
2. **Host firewall:** `INPUT` ends in `-j REJECT icmp-host-prohibited`; 443 was blocked for
   container→gateway. Rule added **scoped to docker0 only** (internet still refused):
   `iptables -I INPUT 4 -i docker0 -p tcp -m state --NEW --dport 443 -j ACCEPT`
   → persisted via `netfilter-persistent save` (enabled on boot).
3. **n8n relaunch must keep `N8N_SECURE_COOKIE=false`** (was in the original run args).
4. **torch/torchvision must both come from `download.pytorch.org/whl/cpu`** or docling dies with
   `operator torchvision::nms does not exist`. Dockerfile has a build-time assert.
5. Host has only **954 MB RAM**; proxy capped at 800 MB. A large PDF may OOM-restart the proxy
   (auto-recovers); the host itself OOMing would take n8n down.

### Verification (2026-10-11)
- From inside the n8n container: `POST api.mistral.ai/v1/ocr` → **HTTP 200** with markdown body.
- n8n UI 200, all 3 workflows activated, external `:443` refused.

---

## 11. Database Cleanup (2026-10-11) — ONLY 3 WORKFLOWS REMAIN

Deleted from `workflow_entity` (+ cascades) after JSON/DB backups:

- **`XOyW9obibZU3a3Or` Marketing Agent V1** (user order: "completely ignore, delete it") — its
  `bad decrypt` errors in the n8n log are gone.
- 7 legacy/inactive: Invoice IQ V3 (`jqE5FQVGaAEvmVmM`), ghost V4s (`Kig1zzq7J1pRUkaQEgrsY`,
  `rN9cxhYahzuCHvHR`), old InvoiceIQ (`vgq1r9nLoPImlGjd`), ApplyWise (`MZTdvDYWj8KO1rfr`),
  My workflow (`6pHVbx6GiyjjU28zCLvQX`), Test Instance (`AXdxpmF_bORK6Qv3dQP4a`).

**Live DB now contains exactly:**

| ID | Name | Active |
|---|---|---|
| `8U4xYx0pgNYDLmWtqn1HE` | Invoice IQ V4 | ✅ |
| `y357XGcddfmO51Ohs836U` | Branch G Worker | ✅ |
| `tvZzpbY5aG29rrfQ` | InvoiceIQ Approved Export Sweep | ✅ |

**Rollback artifacts:** `~/marketing_agent_v1_BACKUP.json`, `~/legacy_workflows_BACKUP/*.json` (7),
`~/db_backup_before_marketing_delete/`, `~/db_backup_before_legacy_delete/` (full DB copies).
n8n 2.27.4 has **no `delete:workflow` CLI** — deletion done via root sqlite3 with
`PRAGMA foreign_keys=ON` while n8n stopped (DB files are owned by uid 1000, not writable by ubuntu).


---

## 12. OpenAI Gate (2026-10-12) — G15 blocked by billing, NOT by rate limits

**Symptom:** G15 `[Information Interpreter]` failed with "The service is receiving too many
requests from you". That string is n8n's **generic rendering of any HTTP 429** — it does not
mean the cause was concurrency.

**Actual cause (proven by direct API probe):**

```
POST /v1/chat/completions  -> 429
{"type":"insufficient_quota","code":"credit_balance_exhausted",
 "message":"You have no credits remaining."}
```

`GET /v1/models` on the **same key** returns **200** — key is valid and unblocked.
So: hard billing block, zero balance. The proxy queue cannot fix this; only payment can.

**Credential:** `OpenAi account` / id `KdfSGNPw9wG2Y5N8` / type `openAiApi`, `sk-proj-…`, 164 chars.
Decryption: `base64 -d | openssl enc -d -aes-256-cbc -md md5 -pass pass:<encryptionKey>` from
`/home/ubuntu/.n8n/config`.

**All 3 OpenAI nodes (cost ≈ 4¢/invoice @ gpt-4o $2.50/$10 per 1M):**

| Node | Workflow | Model | typeVersion |
|---|---|---|---|
| `G15. Information Interpreter` | Branch G Worker `y357XGcddfmO51Ohs836U` | gpt-4o | 2.3 |
| `H7. Information Interpreter` | Invoice IQ V4 `8U4xYx0pgNYDLmWtqn1HE` | gpt-4o | 2.3 |
| `A4. Transcaction Matcher` | Invoice IQ V4 `8U4xYx0pgNYDLmWtqn1HE` | gpt-4o-mini | 2.1 |

G15/H7 use strict `textFormat` json_schema with a long verbatim-extraction system prompt
(1508 chars) + schema → ~5k input tokens each.

### Proxy changes deployed (2026-10-12), zero canvas changes

`nanoclone-proxy/app.py` (`47a77b12c07e36650ebf2d6911715f64`):

- `POST /v1/chat/completions` + `GET /v1/models` **passthrough routes**. `/v1/models` was a real
  gap — the G15 model-picker does a live list fetch; without it the picker 404s through intercept.
- Generic `_proxy_forward()` + `_pick_upstream()` routing on **Host header** (`openai` vs `mistral`).
- `_is_quota_error()` — quota/billing 429s are returned **immediately** (0.24s) instead of burning
  16s of retry backoff; genuine burst 429s still queue. Body forwarded byte-for-byte.
- Optional `OPENAI_UPSTREAM_KEY` env — if set, the Authorization header is swapped in flight so the
  n8n credential stays untouched. **Not set** (no key supplied).
- Catch-all `@app.api_route("/v1/{tail:path}")` registered **last** so local `/v1/ocr` +
  `/v1/documents` win registration order.

**Verified:** `/v1/models` 200 (from inside n8n container too), quota 429 in 0.24s no retry,
Mistral `/v1/ocr` 200 regression, `nanoclone-proxy` healthy.

**Single-SAN cert gotcha:** uvicorn serves one cert — use the combined
`nanoclone-proxy.key/.crt` (`DNS:api.mistral.ai, DNS:api.openai.com`) or the OpenAI route fails
`ERR_TLS_CERT_ALTNAME_INVALID`. Directive's per-host certs are insufficient.

### ⛔ BLOCKED — needs user action

Re-probed 2026-10-12: **still 429 `credit_balance_exhausted`.** User must either
(1) top up at `https://platform.openai.com/settings/organization/billing/`, or
(2) supply a funded key for `-e OPENAI_UPSTREAM_KEY=sk-...` on the proxy container.
Recommended starting top-up: **$10** (~250 invoices) to validate end-to-end first.

Cost scaling: 1k invoices ≈ $40/mo · 10k ≈ $400/mo · 100k ≈ $4,000/mo.
Cheaper levers (both proxy/canvas-independent of node identity): gpt-4o-mini on G15/H7 (~17×
cheaper, still supports json_schema), or gpt-5 at $1.25/$10 (~45% cheaper input).

---

## 13. LOVABLE→INDEPENDENT MIGRATION (STARTED 2026-10-28) — new primary workstream

Trademark complaint ("Invoice IQ") got the platform suspended from Lovable; appeals ignored for
~3 months. Decision: migrate frontend + Supabase backend off Lovable permanently. Migration
audit: `Downloads\BookScanIQ-Read-Only-Migration-Audit.md` (2026-10-25, staged plan Stage 0–5).

### Assets
- **Frontend repo:** https://github.com/renaat-s/BookScanIQ (public; cloned at `BookScanIQ\app`).
  Commit `7052b59` (2026-11-05): media fix + regenerated npm lockfile. Frontend builds clean
  outside Lovable (`npm ci` broken by Lovable's stale lockfile → use regenerated one; build ~32s).
- **New backend (user-owned):** Supabase project `itullizxgdxbaysikafw.supabase.co` — live,
  reachable, EMPTY (awaiting Lovable DB export restore). Old backend `wdnlblakhdfrpobyxlsa`
  remains live until cutover; both n8n and the frontend depend on it today.
- **Google Cloud project:** `bookscaniq` (console.cloud.google.com) — holds the BookScanIQ OAuth
  client (client ID `573581250671-….apps.googleusercontent.com`) + Gemini API key. ⚠️ There is ALSO
  a separate GCC project `pyresec-agent` — NOT BookScanIQ's; never point BookScanIQ work at it.
- **Frontend host decision:** Render Static Site (build `npm ci && npm run build`, publish `dist`,
  SPA rewrite `/* → /index.html`).

### Backend restore — COMPLETE 2026-11-05 ✅
- Lovable Cloud full DB export: `BookScanIQ\bookscaniq-ai_261105.backup\` (pg_dump custom, PG 17.6).
  Also earlier export exists: `bookscaniq-ai_261028.backup` (2026-10-28 baseline).
- Destination `itullizxgdxbaysikafw` already had full schema (29 policies, 4 functions,
  10 triggers, 43 migrations in supabase_migrations history) — so restore was data-only.
- Restored: 10 public tables (profiles 1, user_credentials 1, ledger 17, scan_jobs 189,
  scan_schedules 1, audit_events 13), auth.users (1, incl. password hash), auth.identities.
- Gotcha: Supabase won't let `postgres` disable `on_auth_user_created` on auth.users →
  signup trigger fired during load and created a SKELETON profile row → real profiles COPY
  hit duplicate key. Fixed via `06-fix-profile.ps1` (delete skeleton + reload real row).
  Real profile: `2889479d…`, user `b3ccb251…`, directory_installed=t, n8n_webhook_connected=t,
  review_queue_enabled=t, export_dry_run=f.
- Scripts (all prompt for DB password, never store it): `01-preflight.ps1`,
  `03-tablecheck.ps1`, `04-countcheck.ps1`, `05-restore-data.ps1`, `06-fix-profile.ps1`.
  Working files: `dump-full.sql` (⚠️ contains password hashes + tokens — keep out of git),
  `restore-list.txt`, `restore-data-list.txt`.
- New backend auth: user logs in with OLD credentials (same email + password hash) — JWT secret
  differs from Lovable's, so old sessions/refresh tokens are invalid; user re-logs-in once.
- ⬜ NOT yet done on new backend: edge functions deploy, secrets (Google/Xero/QB/Stripe/Resend/
  N8N_WEBHOOK_SECRET/cron secret), pg_cron job `run-scheduled-scans` (5 * * * * → NEW URL),
  auth Site URL/redirect allowlist/email templates, chat-assistant AI key swap.

### Lovable chains cut / remaining
1. ✅ Media assets (About-page video 64.6MB + poster) — originals found locally, bundled into
   repo, `.asset.json` imports replaced (commit 7052b59).
2. ⬜ chat-assistant → `LOVABLE_API_KEY` + Lovable AI gateway (gemini-2.5-flash) → swap to
   owner-controlled AI key.
3. ⬜ `update-scan-progress` edge function has `verify_jwt=false` + no secret check — fix auth
   contract before redeploying. NOTE: none of the 3 live n8n workflows call it.
4. ⬜ `index.html` preconnects hardcode old Supabase host.
5. ⬜ Backend data restore (Lovable export incl. auth users/hashes; 1 export per 24h limit).

### Stage 2/3 deployment — COMPLETE 2026-11-06 ✅ (parallel stack live)
- **25 edge functions deployed** to `itullizxgdxbaysikafw` via Supabase CLI 3.0.0 (linked project).
- **20 secrets set** from `BookScanIQ\secrets.env.template` (local only, gitignored) — Google/Xero/
  QB/Stripe/Resend/Gemini keys + N8N_WEBHOOK_SECRET (reused existing value) + CRON_SECRET (new)
  + webhook URLs + EXPORT_DRY_RUN=false. Platform injects SUPABASE_* automatically.
- **chat-assistant swapped to Gemini direct** (commit `b77ca04`): `GEMINI_API_KEY` +
  `generativelanguage.googleapis.com/v1beta/openai/chat/completions` + model `gemini-2.5-flash`.
- **Frontend repointed** (commit `663f26d`): `.env` → new URL + new-format key
  (`sb_publishable_…`), index.html preconnects, config.toml project_id. Bundle verified: new host
  in, old host zero references.
- **Render Static Site LIVE:** https://bookscaniq.onrender.com/ (build `npm ci && npm run build`,
  publish `dist`, SPA rewrite `/* → /index.html`).
- **Verified end-to-end (2026-11-06):** Render site 200 + correct title; bundle points at new
  backend; PostgREST/GoTrue alive; `get-oauth-config` 200 returning real client IDs (secrets
  wired); protected functions 401 without token (auth layer on); `review-gate` with shared secret
  returns REAL user data (QB production env, realm `9341458416396436`, GBP/USD currencies,
  dryRun=false) — full chain proven: secret → function → restored DB.
- ✅ n8n repoint DONE 2026-11-08 (see §Stage 4 below). Remaining: browser login test, DNS
  cutover on bookscaniq.com (Stage 5), retire Lovable, pg_cron job re-create.

### Cyberpunk visual redesign — SHIPPED 2026-11-08 (commit `86e6224`)
- Dark-neon is now the DEFAULT theme: `:root`/`.dark` = near-black blue (230 45% 4%) + neon cyan
  primary (187 100% 50%) + violet (262 83% 70%) / magenta accents. Legacy light palette preserved
  verbatim under `.light`; `App.tsx` ThemeProvider `defaultTheme="dark"` (stored user prefs win).
- Chosen style mix (user picked from 14 options): Neon Glow + Glassmorphism + static Gradient Mesh
  + existing lazy particles. Excluded wireframe/clay 3D etc. for render performance.
- New `.cyber-aurora` utility = static radial-gradient mesh, NO animation (zero runtime cost).
- Hero: status chip, neon-rimmed logo tile, spectrum brand gradient, btn-cyber CTA, HUD trust chips.
- Footer: dark glass + neon top edge (was bright gradient).
- All token-driven → whole app (Dashboard/Settings/Pricing/FAQ…) inherits automatically.
- Verified locally (Vite dev :5200) via screenshots of landing + Pricing; build clean.
- ⚠️ Local dev gotcha: `npm run dev -- --port N` mangles args (`vite N` = root path). Use
  `npx vite --port N --strictPort` instead.

### n8n repoint map (inventoried 2026-11-05 via SSH, read-only)
Full redacted inventory: `BookScanIQ\n8n-inventory\inventory-redacted.txt` (⚠️ the 3 raw JSONs
in that folder contain the OLD live service-role key — keep out of git/commits/chat).
- **V4 (10 nodes):** 6× `user_credentials` REST (G1.5, H0.1, J2, J5, H0.3, G1.7 — service_role
  key embedded inline) + 4× `review-gate` calls (XG/QBG Check + Mark Exported — no JWT).
- **Sweep (4 nodes):** S1 profiles + S3 user_credentials (service_role) + S5/S9 review-gate.
- **Branch G Worker:** ZERO backend touchpoints — no changes needed.
- Repoint = host swap `wdnlblakhdfrpobyxlsa`→`itullizxgdxbaysikafw` on all 14 nodes + replace
  embedded service-role key on the 8 REST nodes with the NEW project's key.
- n8n VM itself unchanged; frontend→n8n webhook URLs unchanged.
- Old service-role key becomes obsolete post-cutover (rotate/retire it then).

### Stage 4 n8n repoint — COMPLETE 2026-11-08 ✅ (all 14 nodes on new backend)
- **Method:** direct sqlite UPDATE on the VM with n8n stopped (~20–40s windows ×2), NOT
  `n8n import:workflow` (re-import deactivates workflows by default). Pre-flight: new key
  `sb_secret_…` (41 chars, from `secrets.env.template`) returned HTTP 200 on
  `rest/v1/user_credentials` + `profiles` via **curl.exe** (PowerShell `Invoke-WebRequest`
  mangles auth headers → false 401s; use curl.exe).
- **Applied twice, both tables:**
  1. `workflow_entity.nodes` — V4 (10 host refs + 12 key slots) + Sweep (4 + 4) replaced with
     `replace(replace(nodes, oldhost, newhost), oldJWT, newkey)`. Branch G untouched.
  2. `workflow_history.nodes` — same replace over V4's 8 rows + Sweep's 2 rows (incl. the
     **active** version rows), so export/version-restore/UI match the runtime.
- **TWO-SURFACE GOTCHA (important):** n8n 2.27.4 keeps workflow JSON in 2 places —
  `workflow_entity` (runtime source of truth: `active-workflow-manager.js:179` →
  `workflowRepository.findOne`) and `workflow_history` (autosaved version snapshots; `activeVersionId`
  points into it). **`export:workflow` does NOT export `workflow_entity`** — it merges the active
  version row from history (`dist/commands/export/workflow.js`: `getTargetVersionId` →
  `WorkflowHistoryRepository` → `mergeHistoriesIntoWorkflows`). So an entity-only edit produces
  exports that still look stale (hybrid old/new) even though the live runtime is correct.
- **History snapshot story:** autosaves 22:11–22:18 (author *Renaat Sibanda* — the open UI
  session) show hosts being swapped node-by-node (V4 9→4 old hosts, Sweep 3→2) WITHOUT swapping
  JWTs; my 22:43 update completed `workflow_entity`; history patch at 23:43 completed the rest.
- **Left intentionally untouched:** `execution_data.workflowData` (14 rows) — historical execution
  logs; editing them would falsify run history. Zero old host/JWT refs remain in
  `workflow_entity` + `workflow_history` (verified by full-table LIKE scan across all tables —
  note: the scan pattern must end in `%'` — an earlier malformed pattern gave false negatives).
- **Verification (all green):** post-patch exports vs baseline `%TEMP%\opencode\stage4_exports\`:
  V4 −2,136 bytes = exactly 12 JWT swaps × 178 chars, Sweep −712 = 4 × 178, Branch G 0;
  node-level diff = exactly the 14 mapped nodes changed, connections/name/active identical,
  `list:workflow` shows all 3 still active; `review-gate` on NEW host → 401 (deployed + secret
  enforced). No executions ran during either window (Sweep next run 04:00).
- **Rollback points:** `~/db_backup_stage4/` (pre-change) + `~/db_backup_stage4b/` (entity-done,
  history-not). Cleanup done: all `/home/ubuntu/stage4_*.json`, `fresh_check.json`, `/tmp/stage4_*`
  removed (they embedded the old key). ⚠️ Pre-existing `~/n8n_inspect_backup*.json` +
  `~/marketing_agent_v1_BACKUP.json` may also embed old keys — candidate for Stage 5 cleanup.
- PowerShell gotchas re-confirmed: single-string `[0]` indexes first char (wrap regex results in
  `@()`); inline quotes over ssh break — always scp script files and `bash /tmp/x.sh`.

### Stage 5 pre-cutover checks — DONE 2026-11-09 ✅
- **Live validation of Stage 4:** Sweep ran 2026-11-09 05:00:32 `production_success` (first run on
  new backend — `workflow_statistics` proved it; user had deleted execution rows 2072-2074
  "logs" at 08:34, which briefly made it look like Sweep never fired — `n8nEventLog*.log` audit
  trail recorded the deletions). V4 webhook exec 2075 (11-09 12:36) success, 20 new-host refs,
  0 old, no 401. Sweep `production_error` count = 0 ever.
- **Webhook URL secrets (6 in template):** 4 verified live in n8n (`start-backfill`,
  `install-directory`, `invoiceiq/invoice-upload` ×2). 2 dead paths, BOTH pre-existing, neither
  user-reachable, neither blocking: (a) `N8N_WEBHOOK_URL` → `/webhook/connect-email` NEVER
  existed in any n8n DB copy (checked Jun 29 + both Oct 11 backups) — only consumer is
  Forward Scan, which is `disabled` + "Coming Soon" in `DetectInvoices.tsx`; (b)
  `N8N_CLASSIFY_RECEIPT_WEBHOOK_URL` → `/webhook/classify-receipt` was the "User Feedback
  Webhook" in InvoiceIQ/V3/archived-V4 workflows **deleted Oct 11** — only consumer is
  chat-assistant `submitCategory` action (main Gemini chat unaffected). Fix later by rebuilding
  the webhook or removing the code path.
- **Google OAuth wiring verified end-to-end (minus credential entry):** app → Supabase
  `/auth/v1/authorize` → Google sign-in rendered with `client_id=573581250671-…` (bookscaniq
  GCC) and `redirect_uri=https://itullizxgdxbaysikafw.supabase.co/auth/v1/callback` (Google
  accepted — no redirect_uri_mismatch); Supabase redirect allowlist returns 302 (not "not
  allowed") for both `https://bookscaniq.onrender.com/detect-invoices` AND `https://bookscaniq.com`.
- **`update-scan-progress`:** deployed on new backend (400 jobId-required = alive) but
  `verify_jwt=false` + no secret check in code — IDENTICAL on old backend (pre-existing, not a
  regression). Post-cutover hardening item: add secret check + verify_jwt=true + n8n header.
- **DNS state:** bookscaniq.com + www → 185.158.133.1 (Lovable edge, already Cloudflare-proxied,
  serves `/suspended`). Target: Render `bookscaniq.onrender.com` (216.24.57.16/18).

### Stage 5 DNS cutover — LIVE 2026-11-09 ✅ (bookscaniq.com now on Render)
- **DNS is at GoDaddy, NOT Cloudflare** (nameservers ns01/ns02.domaincontrol.com; the
  Cloudflare-looking response headers came from Lovable's Cloudflare-SaaS edge at
  185.158.133.1). GoDaddy account id `3351118d-6adc-428b-be84-0f350f9668c8`; zone = 24 records.
- **Records changed (only these two, TTL 600):** `@` A → `216.24.57.1` and `www` A →
  `216.24.57.1` (Render's stated apex A target; apex can't be CNAME at GoDaddy). Everything
  else (NS, autodiscover/email/lync CNAMEs, TXT) untouched. Old `185.158.133.1` gone.
- **Propagation:** authoritative ns01/ns02 + 1.1.1.1 all serve 216.24.57.1 for both `@` and
  `www` within TTL.
- **Render custom domains:** both added on service `srv-dbn3vj0n74is73eih8cg` (apex
  `bookscaniq.com` + `www.bookscaniq.com` redirect rule); workspace plan = 2/2 domains used.
  Verify clicked → **both VERIFIED**. www cert **Issued**; apex cert went Pending → (status
  re-check pending — Render dashboard session expired right after). TLS already works
  end-to-end: curl without `-k` → 200, cert `CN=bookscaniq.com` / Google Trust Services,
  `remote_ip 216.24.57.1`, `ssl_verify_result 0`. http:// → 301 https://.
- **Production functional:** SPA deep links `/detect-invoices`, `/pricing`, `/settings` → 200
  app HTML; `www` → 301 apex; bundle `index-DO91ynt2.js` (current build).
- **Full Google login verified on bookscaniq.com:** session key
  `sb-itullizxgdxbaysikafw-auth-token` present, app renders `renaat.sibanda23@gmail.com` on
  `/detect-invoices` — whole OAuth chain proven on the production domain.
- **Supabase Site URL:** `https://bookscaniq.onrender.com` → `https://bookscaniq.com` saved;
  redirect allowlist already had all 3 detect-invoices URLs (that's why OAuth worked).
- **pg_cron `run-scheduled-scans` re-created on NEW backend** (was missing after restore):
  jobid 2, schedule `5 * * * *`, active. SQL built locally with `CRON_SECRET` embedded, copied
  to clipboard, pasted into Supabase SQL Editor (secret never printed in chat). First run hit
  a syntax error — **PowerShell here-string ate the `$$` dollar-quote delimiters (`$$` is an
  automatic variable in double-quoted strings)**; fixed by editing `$$` back into the editor
  in-page. Contract test: POST with real `x-cron-secret` → **200
  `{"success":true,"due":0,"triggered":0,"blocked":0}`**, wrong secret → **401**.
- **Render cert recheck (after re-login):** apex went Pending → **Issued**; both domains now
  Verified + Issued (2/2). TLS end-to-end already proven (see above).
- **OLD backend pg_cron DISABLED 2026-11-09 ✅ (Phase D complete):** old project
  `wdnlblakhdfrpobyxlsa` is NOT under the user's NANOCLONE Supabase account — it was created
  by Lovable and lives under a different login. Access path that worked: **the Lovable.dev
  Coding Assistant** (linked to the native BookScanIQ project) ran SQL on request. Gotcha: the
  old job's name is **`invoiceiq-run-scheduled-scans`** (legacy name; NOT
  `run-scheduled-scans`) — an unschedule by the expected name would have failed; Lovable
  correctly stopped and reported instead of guessing. Job was active + succeeding hourly
  (14:05–18:05 UTC, `1 row` = pg_net POST dispatched) → both stacks were about to double-fire
  n8n backfills. Fixed: `SELECT cron.unschedule('invoiceiq-run-scheduled-scans')` →
  `unschedule: true`; verification shows ONLY `waitlist-rate-limits-cleanup` (jobid 1) left on
  the old backend. Old edge function itself still answers 401 to the NEW `CRON_SECRET` (it
  keeps its own old secret) — harmless now with no caller.
- **Still to do (Phase E):** observe 24–48 h (Sweep next 05:00, hourly cron at :05); then
  retire Lovable, rotate/retire old service-role key (still in 11 historical `execution_data`
  rows + `n8n-inventory` JSONs + `~/n8n_inspect_backup*.json` + `~/marketing_agent_v1_BACKUP.json`
  on VM); optionally drop `bookscaniq.onrender.com` redirect-URL entries;
  `update-scan-progress` auth hardening.

### OpenAI gate update (user, 2026-11-05)
Credits topped up, but "an additional issue persisted" - user deferred; revisit after migration.

### Lovable Migration Completion Checklist (67 questions) — ANSWERED 2026-11-11
- **Answers doc:** `C:\Users\renaa\Downloads\BookScanIQ-Migration-Checklist-Answers.md` — every
  question has evidence (command output, query result, URL, file:line); no secret values printed.
- **New evidence gathered 2026-11-10/11 (this pass):** full browser regression Q57/Q58 (all
  dashboard tabs, XLSX export 17,291 B, Workspaces Drive+Ledger live, Neurodivergent Mode,
  mobile hamburger, console 1 pre-existing CSP warning only, network 0 4xx/5xx), **live backlog
  scan Q52/Q53** (scan_job `deb2982f` → completed; edge fn 200 after 94.8 s; n8n exec 2078 V4 +
  2079 Branch G success; real Gmail message fetched), Q8 media (video readyState=4 1912×1040,
  poster 200), Q10/Q11/Q12 DNS+email records, Q3 secret scan (0 hits; `.env` publishable-only),
  Q5 SPA routes (6× 200 app-shell), Q6/Q9 bundle scans (0 old refs; tagger inert), Q38 GCP
  redirect URIs, Q42 Sync Workspace IDs, Q64 backups (Free = none), Q66 security.txt (200).
- **Q17 resolved (owner-confirmed):** old account `b3ccb251` was **intentionally** deleted via
  the app's Delete Account button (to bypass a frontend bug) before 2026-11-09 12:35:54 UTC;
  cascades explain every delta. **Reconciliation executed & verified 2026-11-10** (owner-approved
  "full restore"): ledger PATCH 59 → `87c41cfd`, scan_jobs +23, audit_events +13, schedule +1,
  profile merge; final `scan_jobs`=189 = source.
- **Test user `d69e33c0…` deleted 2026-11-11** (0 rows, real account intact).
- **Progress pass 2026-11-14/15 (this pass) — closed:**
  - **A1/Q30 settled with Intuit portal evidence:** app `BookScanIQ` = **Production** key set
    (portal Production Client ID sha256-16 `d57284c94f72f5e6` = our `QUICKBOOKS_CLIENT_ID`;
    Development `b90460a78929c0b1` ≠). `QB_ENV=production` + V4's 8 hardcoded prod hosts correct;
    old dump's `qb_environment=sandbox` was the OAuth code default. Q30 corrected in answers doc.
  - **Q43 done (both portals):** Intuit production redirect URIs — 6 added (`bookscaniq.com`,
    `www.`, `.onrender.com` × `/oauth/quickbooks` + `/oauth/xero`), saved, reload-verified, 8 legacy
    kept (14 total). Xero already had apex+www `/oauth/xero` (app `d40da663…`); onrender NOT added
    (origin cut from CORS on purpose).
  - **Q44 done (both connects):** QuickBooks → realm `9341458707576316`, Xero → tenant
    `d77780b1…` (owner created org NANOCLONE SYSTEMS LTD first — initial consent correctly warned
    "no organisation setup"). **Q47 live reads:** `quickbooks-list-transactions` 200 in 3.25 s and
    `xero-list-transactions` 200 in 1.73 s, both `{"connected":true,"transactions":[]}` (network
    captures). Write-export still needs a real invoice run (Q52 leg).
  - **Q24 hardened + deployed:** `update-scan-progress` now requires `x-workflow-secret` OR user
    JWT + job-ownership (else 401/403, 400 missing jobId); `verify_jwt=false` kept at gateway
    (secret-only n8n path) — documented in config.toml. Live contract tests: no-auth **401**,
    wrong-secret **401**; `review-gate` no-secret **401**; `delete-account` no-JWT **401**;
    `get-oauth-config` no-JWT **200** (flag preserved).
  - **`delete-account` fixed (Q17 root cause):** now wipes all 7 `user_id` tables via `wipe()`
    (ledger_entries, invoices, audit_events, scan_schedules, scan_jobs, user_credentials,
    profiles) — deployed; future deletions leave no orphans.
  - **20 edge functions deployed** 2026-11-14 (all 19 `_shared/cors.ts` importers + 
    `update-scan-progress`) — the cors.ts onrender-origin revert is now live everywhere; CLI
    agent-consent gate honored (owner approved `--yes`). 3 deployed with `--no-verify-jwt`
    (update-scan-progress, get-oauth-config, review-gate).
  - **Q64 pg_dump DONE:** `BookScanIQ\backups\bookscaniq-new_20261114-215507.backup` (0.45 MB,
    -Fc, 758 TOC entries, verified via `pg_restore -l`; PG 17.11 server) + `.log`. Script
    `07-pgdump.ps1` (hidden Read-Host password). **Only restore point** (Free plan, no auto-backups).
  - **Section C evidence captured** (raw SQL-editor outputs): 10 public tables all RLS=true;
    29 policies (per-table breakdown); 6 extensions (pg_cron 1.6.4, pg_net 0.20.4,
    pg_stat_statements 1.11, pgcrypto 1.3, supabase_vault 0.3.1, uuid-ossp 1.1); 4 public
    functions; 43 migrations (latest `20260817193023`); cron jobid 3 `5 * * * *` active.
  - **og-image LIVE:** `app/public/og-image.png` (1200×630, generated from local `og-source.html`
    via element screenshot; served by local python http.server) → commit `d6cbaf0` →
    `https://bookscaniq.com/og-image.png` = **200** image/png.
  - **Render `NODE_VERSION=22` pinned** (deploy #5, trigger "Environment updated", succeeded);
    build log: `Using Node.js version 22.23.5 via environment variable NODE_VERSION`.
    ⚠ **Render auto-deploy is OFF** — every deploy must be triggered manually
    (dashboard → Manual Deploy → Deploy latest commit).
  - **Supabase CLI authenticated** (owner-approved browser flow; `whoami` = owner account).
    Gotcha: `npx supabase login` fails in non-TTY/agent shells (`LoginMissingTokenError` /
    JSON-mode) — use `08-supabase-login.ps1` (direct `.cmd`, interactive window) or
    `--token`. Deploy consent gate: CLI refuses hosted mutations without `--yes`.
  - **Launch gotcha reconfirmed:** `Start-Process -ArgumentList` must use
    `-WorkingDirectory` + relative `-File .\script.ps1` (spaced absolute paths silently fail);
    verify with `Get-CimInstance Win32_Process` + session id.
- **Q25 CLOSED 2026-11-15 ✅** — chat-assistant live test 200 "Q25 test reply OK". Two root
  causes: (1) project `bookscaniq` billed to unfunded `014657-…` → changed billing to
  `014DB6-2AA3A4-FCF484` (£4 prepay + £220.76 welcome credit expiring Dec 14 2026; Billing
  Account User grant to sibanda done first); (2) Google retired `gemini-2.5-flash` for new
  users (404) → model bumped to `gemini-3.8-flash`, redeployed (owner-approved --yes).
- **Still open (see answers doc Q67):** Q13 **CLOSED 2026-11-16 ✅** — owner confirmed the test
  email landed in the `info@` inbox at 5:31 PM 2026-11-15 (not spam); Q52 **deferred by owner 2026-11-15** (OpenAI
  `429 credit_balance_exhausted` — live probe from VM; scans only write junk "Unknown Vendor/0"
  rows until topped up; blocks Q47 write-export too); Q56 auth-email custom
  SMTP off; Q57 12h-24h auto-clear/exchange-rate untested (chat leg now done); n8n
  encryption-key rotation (Phase E); tagger dead code + `cdn.gpteng.co` CSP entry (Phase E);
  commit/push AGENTS.md + answers-doc housekeeping.
- **Sweep rotated-token fix APPLIED 2026-11-15 (owner-approved) + fix2 2026-11-16:** added
  fail-open `S4.1 Sync Tokens to Supabase` after `S4 Consolidate Tokens` (Sweep 47→48 nodes,
  0 existing nodes modified, only `S4 → S5` rewired to `S4 → S4.1 → S5`; V4 106 + Branch G 23
  byte-identical). First run (exec 2088, 2026-11-16 05:00, run `success`) showed S4.1 → HTTP 401:
  my build omitted `parameters.sendHeaders = true`, so n8n sent no headers → no `apikey` → 401.
  Fail-open contained it (zero downstream impact). **fix2 applied 2026-11-16 10:57Z** (only S4.1
  modified, connections untouched, both surfaces 48 nodes, healthz=200 in 21s). Final export diff
  ORIGINAL→FINAL verified: only S4.1 added; S4.1 now matches proven S3 config.
  **GATE 1 PASSED 2026-11-17 ✅** — exec 2089 `success`, **S4.1 = 204 No Content**, 12/12 Sweep
  runs success, zero errors since fix2. (Note: `invalid_grant` on G1.6B/G1.6C refresh nodes =
  **owner explanation 2026-11-17: Xero/QB refresh tokens just hadn't been renewed** — expected,
  not a defect, no action.) Rollback backup `~/sweep_fix_backup_20261115/` now safe to retire.
- **Phase E gate — GATE 1 CLEARED 2026-11-17 ✅:** Sweep 05:00 run confirmed (exec 2089 success,
  S4.1=204). Checklist hand-back to Lovable + observation window for cron jobid 3 (hourly :05)
  sustained success remain; then retire Lovable + rotate keys per plan in Q65.

