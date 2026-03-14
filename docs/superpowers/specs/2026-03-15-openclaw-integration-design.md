# OpenClaw AI Full Integration — Design Spec

## Overview

Add a dedicated OpenClaw AI section to the GoGevgelija Dashboard, providing admin users with an AI chat assistant, automated content pipelines, and activity logging — all powered by a local OpenClaw gateway with its own Groq configuration (llama-3.3-70b-versatile).

## Requirements

- **Access**: Admin-only, enforced server-side (hidden from editor/worker roles)
- **LLM Backend**: Groq (llama-3.3-70b-versatile) — configured within the OpenClaw gateway's own runtime, independent of the Dashboard's `GROQ_API_KEY`
- **Gateway**: OpenClaw running locally on developer machine (`ws://localhost:18789`)
- **Architecture**: Direct WebSocket connection from Dashboard to OpenClaw gateway (Approach A)

## Navigation

New sidebar section separated by a divider below existing nav items:

```
── AI Assistant ──────────
Bot    OpenClaw Chat      /dashboard/openclaw
Zap    Automations        /dashboard/openclaw/automations
ScrollText  Logs          /dashboard/openclaw/logs
```

- Section label: "AI Assistant"
- Icons: lucide-react (`Bot`, `Zap`, `ScrollText`) to match existing sidebar pattern
- Gateway connection status indicator at sidebar bottom (green dot = connected, red = offline)
- Visible only to users with `role === 'admin'`

## Pages

### 1. Chat (`/dashboard/openclaw`)

Split-panel layout:

**Left panel (35% width):** Session list
- List of past conversations with title, timestamp, message count
- Active session highlighted with brand color border
- "+ New" button to create a session
- Sessions sorted by most recent

**Right panel (65% width):** Active chat
- Header: Bot icon, session title, connection status dot
- Message area: scrollable, with assistant (left, gray bubble) and user (right, red bubble) messages
- Assistant messages support:
  - Streaming token-by-token display
  - Tool execution indicators (scraping, generating, compressing)
  - Inline action buttons: "Copy Fill Script", "Edit", "Preview" on generated content
  - Markdown rendering (code blocks, tables, lists)
- Quick action chips above input: Scrape URL, Generate Event, Translate, Stats
- Input bar: text input + Send button, with abort support during streaming

**Capabilities via chat:**
- Content creation: generate bilingual event/promotion descriptions from text or URLs
- Translation: EN ↔ MK for any content
- Social media scraping: extract post data from Instagram/Facebook URLs
- Statistics: query event/listing/promotion counts, worker hours
- Django admin integration: generate fill scripts (same clipboard approach as existing Add Event page via `admin-script.ts`)
- General Q&A about Gevgelija tourism

**Relationship to existing content generation:** OpenClaw reimplements scraping and content generation via its own tool system within the gateway. The existing Add Event / Add Promotion pages and their API routes (`/api/scrape`, `/api/process`) remain independent and unchanged. The two systems do not share code — OpenClaw's tools use the gateway's own Groq connection.

**Empty state:** When no sessions exist, show a welcome message ("Start your first conversation with OpenClaw") with a prominent "New Chat" button and example prompts as clickable chips.

### 2. Automations (`/dashboard/openclaw/automations`)

Card-based dashboard layout:

**Header:** Title, active/paused counts, "+ New Automation" button

**Filter tabs:** All | Scrapers | Pipelines | Scheduled

**Automation cards** with color-coded left borders:
- **Scrapers (green):** Monitor social media pages on a schedule, detect new posts
  - Configurable: target URLs/pages, check interval, content filters
- **Pipelines (blue):** Multi-step workflows triggered by scrapers or manually
  - Steps: scrape → AI generate bilingual content → compress images → queue for approval
  - Human approval step before pushing to Django admin
- **Scheduled (purple):** Cron-like recurring tasks
  - Weekly content reports, auto-translate new listings, cleanup tasks

Each card shows:
- Icon, name, status badge (Active/Paused)
- Description of what it does
- Schedule/trigger info, last run status, cumulative stats
- Action buttons: Pause/Resume, Edit

**"+ New Automation" form:** Deferred to v2. In v1, automation creation and editing are done via the OpenClaw CLI (`openclaw cron add ...`). The "+ New Automation" button opens a dialog with CLI instructions for creating each automation type. This avoids building complex multi-step forms before validating the feature's value. The Dashboard UI supports **viewing automations and toggling their status** (pause/resume) — these are the only write operations in v1.

**All automation configs managed by OpenClaw's built-in cron system.** No additional Supabase tables.

**Empty state:** Show a setup guide with example CLI commands for creating each automation type (scraper, pipeline, scheduled).

### 3. Logs (`/dashboard/openclaw/logs`)

**Summary stat cards (top row, 4 columns):**
- Successful runs (green)
- Errors (red)
- Events created (blue)
- Avg response time (purple)

**Filters:** Type dropdown (All/Scraper/Pipeline/Chat/Error) + Date range (Today/7d/30d)

**Log entries** in a chronological list:
- Success/error icon (green check / red X)
- Automation/session name + type badge
- Description of what happened
- Timestamp
- Click to expand: full details, raw output, retry button for failed tasks

**Data source:** OpenClaw gateway session/task history API, polled via React Query (30s interval). Polling was chosen over WebSocket push because logs are a secondary view — users check them periodically, not in real-time. The existing WebSocket connection is reserved for chat streaming. If real-time log updates become valuable, this can be upgraded to WebSocket push in a future iteration.

**Empty state:** Show "No activity yet" with a note that logs appear once the gateway processes its first task or chat message.

## Technical Architecture

### New Files

```
src/
├── lib/openclaw/
│   └── gateway.ts              # WebSocket client for OpenClaw gateway protocol v3
├── types/
│   └── openclaw.ts             # TypeScript interfaces for OpenClaw domain
├── hooks/
│   ├── use-openclaw.ts         # Connection state, gateway methods (reads from OpenClawProvider context)
│   ├── use-openclaw-sessions.ts # Session CRUD (list, create, delete, switch)
│   ├── use-openclaw-chat.ts    # Streaming chat for active session
│   ├── use-openclaw-automations.ts  # Automation list + pause/resume
│   └── use-openclaw-logs.ts    # Log fetching + filtering
├── components/
│   ├── openclaw/
│   │   ├── provider.tsx        # OpenClawProvider — React Context owning the gateway singleton
│   │   ├── chat-panel.tsx      # Split-panel chat UI
│   │   ├── session-list.tsx    # Left panel session list
│   │   ├── message-bubble.tsx  # Chat message component
│   │   ├── quick-actions.tsx   # Action chips
│   │   ├── automation-card.tsx # Single automation card
│   │   ├── log-entry.tsx       # Single log row
│   │   └── gateway-status.tsx  # Connection status indicator
│   └── sidebar.tsx             # Modified: add OpenClaw section (admin-only)
├── app/
│   ├── api/openclaw/
│   │   └── token/route.ts      # Server-side: exchanges Supabase session for ephemeral gateway token
│   └── dashboard/openclaw/
│       ├── page.tsx             # Chat page
│       ├── layout.tsx           # Server-side admin gate + OpenClawProvider wrapper
│       ├── automations/
│       │   └── page.tsx         # Automations page
│       └── logs/
│           └── page.tsx         # Logs page
```

Note: `src/components/openclaw/` introduces feature-based component grouping, a deviation from the existing flat `src/components/` structure. This is intentional — the OpenClaw feature has enough components to warrant a subdirectory and sets a precedent for future feature grouping.

### TypeScript Types (`types/openclaw.ts`)

```typescript
type OpenClawConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

interface OpenClawSession {
  id: string
  title: string            // auto-generated by gateway from first user message; editable
  createdAt: string
  updatedAt: string
  messageCount: number
}

interface OpenClawMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: OpenClawToolCall[]
  actions?: OpenClawAction[]
}

interface OpenClawToolCall {
  name: string           // e.g. 'scrape_url', 'generate_event', 'translate'
  status: 'running' | 'completed' | 'failed'
  result?: string
}

interface OpenClawAction {
  label: string          // e.g. 'Copy Fill Script', 'Edit', 'Preview'
  type: 'fill_script' | 'edit' | 'preview'
  payload: string
}

type OpenClawAutomationType = 'scraper' | 'pipeline' | 'scheduled'

interface OpenClawAutomation {
  id: string
  name: string
  type: OpenClawAutomationType
  description: string
  status: 'active' | 'paused'
  schedule: string        // cron expression or trigger description
  lastRun?: { timestamp: string; status: 'success' | 'error'; summary: string }
  stats: Record<string, number>
}

interface OpenClawLogEntry {
  id: string
  type: 'scraper' | 'pipeline' | 'chat' | 'scheduled' | 'error'
  source: string          // automation name or session title
  description: string
  status: 'success' | 'error'
  timestamp: string
  details?: string        // expanded view: raw output
}

interface OpenClawLogStats {
  successful: number
  errors: number
  eventsCreated: number
  avgResponseMs: number
}

// Internal to gateway.ts — used by the event emitter, not exposed to hook consumers
interface OpenClawGatewayEvent {
  type: 'connected' | 'disconnected' | 'message' | 'token' | 'error' | 'tool_call'
  data?: unknown
}
```

### Security: Gateway Token Handling

The OpenClaw gateway token is **never exposed to the client**. Instead:

1. `OPENCLAW_GATEWAY_TOKEN` (no `NEXT_PUBLIC_` prefix) is stored server-side only
2. Client calls `POST /api/openclaw/token` — this API route:
   - Uses `createClient()` from `@/lib/supabase/server` to get a cookie-based Supabase client (note: the existing middleware matcher excludes `/api/` routes, so this route must handle its own session validation — this is the first authenticated API route in the project)
   - Calls `supabase.auth.getUser()` to verify the session; returns 401 if no valid session
   - Queries the `employees` table for the user's role; returns 403 if not admin
   - Calls the OpenClaw gateway's REST API (`POST http://localhost:18789/api/v1/token`) with the master `OPENCLAW_GATEWAY_TOKEN` in the `Authorization` header, requesting an ephemeral token with a 5-minute TTL
   - Returns the ephemeral token to the client
3. The client uses the ephemeral token to authenticate the WebSocket connection via the `token` query parameter on the WebSocket URL
4. Token refresh happens automatically before expiry via the `OpenClawProvider` — it re-calls `/api/openclaw/token` at ~4 minute intervals

**Implementation sketch for `/api/openclaw/token/route.ts`:**
```typescript
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: employee } = await supabase
    .from('employees').select('role').eq('id', user.id).single()
  if (employee?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res = await fetch('http://localhost:18789/api/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl: 300 }), // 5 minutes
  })
  const { token } = await res.json()
  return NextResponse.json({ token })
}
```

### Security: Server-Side Admin Gate

`app/dashboard/openclaw/layout.tsx` is a **server component** that:
1. Calls `createClient()` to get the Supabase server client
2. Fetches the authenticated user via `supabase.auth.getUser()`
3. Queries the `employees` table for the user's role
4. If `role !== 'admin'`, calls `redirect('/dashboard')` — no client-side fallback
5. Renders the `OpenClawProvider` (client component) wrapping `children`

This matches the existing pattern in the parent `dashboard/layout.tsx`.

### WebSocket Client (`lib/openclaw/gateway.ts`)

- Class `OpenClawGateway` wrapping a WebSocket connection
- Connects to `NEXT_PUBLIC_OPENCLAW_GATEWAY_URL` with ephemeral token auth
- Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)
- Typed methods mapping to gateway protocol v3 (v1 scope only):
  - `sendMessage(sessionId, text)` → streams response tokens
  - `listSessions()` / `createSession()` / `deleteSession()`
  - `listCronJobs()` / `updateCronJob(id, { status })` — list + pause/resume only
  - `getTaskHistory(filters)` → log entries
  - v2 additions (not implemented in v1): `createCronJob()`, `deleteCronJob()`, full `updateCronJob()`
- Event emitter pattern for connection state changes
- Abort controller support for canceling streaming responses
- **Message validation:** Incoming messages are validated against expected shapes. Malformed or unexpected messages are logged and surfaced through the connection error state rather than silently failing.

### React Context: `OpenClawProvider`

The `OpenClawProvider` component (in `components/openclaw/provider.tsx`) owns the singleton `OpenClawGateway` instance:

- Wraps `app/dashboard/openclaw/layout.tsx` children
- Creates one `OpenClawGateway` on mount, tears it down on unmount
- Provides gateway instance + connection state via React Context
- All `useOpenClaw*` hooks read from this context — no duplicate WebSocket connections
- Handles ephemeral token fetching and refresh

This follows the same pattern as the existing `Providers` component (`components/providers.tsx`) which wraps `QueryClientProvider`.

### React Hooks

**`useOpenClaw()`** — reads from OpenClawProvider context
- Returns: `{ isConnected, connectionState, gateway, error, reconnect }`
- Throws if used outside `OpenClawProvider`

**`useOpenClawSessions()`** — session CRUD (used by session list panel)
- Returns: `{ sessions, activeSessionId, createSession, deleteSession, switchSession, isLoading }`
- Wraps gateway session methods
- Lives in the provider context so both the session list and chat panel can access it

**`useOpenClawChat(sessionId)`** — message streaming for one session
- Returns: `{ messages, isStreaming, sendMessage, abort }`
- Appends streamed tokens to current assistant message
- Manages message history for the active session only

**`useOpenClawAutomations()`** — automation read + pause/resume
- Returns: `{ automations, pause, resume, isLoading }`
- Wraps gateway cron API methods
- v1: read-only display + pause/resume; no create/edit UI

**`useOpenClawLogs(filters)`** — filtered log access
- Returns: `{ logs, stats, isLoading }`
- React Query with 30s refetch interval
- Client-side filtering by type and date range

### Environment Variables

```env
# Client-side (safe to expose — just a URL)
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=ws://localhost:18789

# Server-side only (never exposed to browser)
OPENCLAW_GATEWAY_TOKEN=your-gateway-token-here
```

### Graceful Degradation

- If gateway is unreachable: OpenClaw pages show a "Gateway Offline" banner with connection instructions
- Sidebar status dot turns red
- No impact on existing Dashboard features — zero coupling with OpenClaw for current pages
- Reconnect attempt on page focus
- **Session persistence:** OpenClaw gateway persists sessions to disk by default. If the gateway is restarted, sessions should survive. If sessions are unexpectedly empty, the chat page shows the empty state (welcome message + new chat button) rather than an error.

### Dependencies

- `react-markdown` — for rendering assistant messages with formatted content (optional, can start with pre-formatted text and add later)

No other new npm packages required. The WebSocket API is built into browsers.

## Out of Scope

- Remote/shared OpenClaw gateway deployment
- Editor/worker role access
- Mobile-responsive OpenClaw pages (desktop-first, matching existing Dashboard)
- Supabase storage for automation configs (OpenClaw manages its own state)
- Custom OpenClaw plugins/skills development
- Automation creation UI (v1 uses CLI; form builder deferred to v2)
- Direct Django write API (uses existing clipboard fill-script approach)
