# AGENTS.md — guidance for AI coding agents (OpenAI Codex et al.)

This file orients an AI agent working in the Shoduttor.ai repository. Read it before making changes.

## Project overview

**Shoduttor.ai** is a Banglish-native AI customer support widget for Bangladeshi businesses.
A business pastes **one `<script>` tag** on their site and uploads their FAQ; customers then chat in
**Banglish** (Bengali romanized into English letters, mixed with English) — or Bengali or plain
English — and get instant answers, with unresolved messages routed to the right human department.

> Although the differentiator is Banglish, the product is **universal**: it works for any business
> (telecom, retail, banking, food delivery, SaaS) and any language mix. Grameenphone is a demo skin.

The pipeline is three layers:
1. **NLU** — GPT-4o parses the raw message into `{ intent, location, sentiment, english_translation, confidence }`.
2. **FAQ retrieval** — the translation is embedded and matched against the business's FAQ vectors (pgvector).
3. **Routing** — if no confident FAQ answer, a ticket is created and routed to the matching department.

## Monorepo structure

```
shoduttor/
├── server/          # Express backend (Node.js, CommonJS)
│   ├── index.js         # app entry: CORS, JSON, route mounting, /health
│   ├── routes/          # chat.js, nlu.js, faq.js, tickets.js, businesses.js
│   ├── services/        # nlu.js, retrieval.js, embeddings.js
│   ├── lib/             # openai.js, supabase.js (shared singletons)
│   └── schema.sql       # Supabase tables + match_faq() — run once in SQL editor
├── client/          # React + Vite + Tailwind v4 frontend
│   ├── src/pages/       # AdminDashboard.jsx, WidgetDemo.jsx
│   ├── src/components/   # ChatWidget, FAQUploader, TicketList, BusinessSelect, IntentBadge, StatsBar
│   ├── src/lib/api.js   # fetch helpers (base URL = VITE_API_URL)
│   └── public/widget.js # the standalone Shadow-DOM embeddable widget (zero deps)
└── demo/            # gp-demo.html + sample FAQ files (gp-faq.txt, pathao-faq.txt)
```

## How to run locally

Backend (port **3001**):
```bash
cd server
npm install
node index.js          # -> [shoduttor] API listening on http://localhost:3001
```

Frontend (port **5173**):
```bash
cd client
npm install
npm run dev            # -> http://localhost:5173  (/admin and /demo routes)
```

The frontend talks to the backend via `VITE_API_URL` (defaults to `http://localhost:3001`).

## Key files and what they do

| File | Responsibility |
|------|----------------|
| `server/services/nlu.js` | GPT-4o Banglish/multilingual parser → structured JSON (intent/location/sentiment/translation/confidence) |
| `server/services/retrieval.js` | pgvector FAQ semantic search + GPT-4o answer generation (returns answer or `ESCALATE`) |
| `server/services/embeddings.js` | chunks an FAQ document and embeds each chunk with `text-embedding-3-small` |
| `server/routes/chat.js` | the main pipeline endpoint (`POST /api/chat`): NLU → retrieval → routing + ticket logging |
| `server/routes/faq.js` | `POST /api/faq/upload` (chunk+embed+store) and `GET /api/faq/sources` |
| `server/lib/openai.js` / `lib/supabase.js` | shared OpenAI and Supabase clients |
| `client/public/widget.js` | self-contained vanilla-JS Shadow-DOM widget businesses embed with one script tag |
| `server/schema.sql` | database schema: `faq_chunks`, `tickets`, `faq_uploads`, and the `match_faq` SQL function |

## Environment variables

Server reads these from `server/.env` (never commit it — it is gitignored):

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | GPT-4o + embeddings |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key (server-side only) |
| `PORT` | optional; defaults to 3001 (on Render this is injected automatically) |

Client reads `VITE_API_URL` from `client/.env`.

## Test commands

NLU layer in isolation (no Supabase needed):
```bash
curl -X POST http://localhost:3001/api/nlu \
  -H "Content-Type: application/json" \
  -d '{"message":"amar mb kete gese keno"}'
# -> {"intent":"billing","location":null,"sentiment":"frustrated","english_translation":"...","confidence":0.9}
```

Full pipeline (NLU + FAQ + routing):
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"amar net cholche na","business_id":"grameenphone"}'
# -> {"status":"resolved"|"escalated","reply":"...","intent":"...","sentiment":"...","translation":"..."}
```

Health check: `curl http://localhost:3001/health`

> On Windows PowerShell, prefer `Invoke-RestMethod` (single-quoted `-d` JSON does not parse in PowerShell).

## Coding conventions

- **Backend: CommonJS** (`require` / `module.exports`) — not ESM. **No TypeScript** anywhere.
- **async/await** for all I/O; avoid raw promise chains in new code.
- Standard **Express.js** patterns: one router per resource in `routes/`, business logic in `services/`.
- Shared clients (OpenAI, Supabase) are singletons in `lib/` — import them, don't re-instantiate.
- All OpenAI calls that must return JSON use `response_format: { type: "json_object" }`.
- Routes must never crash the process: validate input, wrap handlers in try/catch, and treat
  Supabase logging failures as non-fatal (warn, don't throw).
- **Frontend: React function components + hooks**, Tailwind v4 utility classes, plain `.jsx` (no TS).
- `widget.js` is **vanilla JS with zero dependencies** and must stay that way — it runs on third-party sites.
- Product name is **Shoduttor.ai** everywhere. Keep copy industry-neutral (not telecom-only).
