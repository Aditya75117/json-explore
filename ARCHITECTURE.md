# Architecture — JSON Explore

This document describes the Phase 0–11 foundation. Later phases should
extend these boundaries rather than invent parallel structures.

## Product principles

1. **Developer-first** — fast, precise, keyboard-friendly UI.
2. **Privacy-first** — core JSON processing stays in the browser. Never send
   document content to a backend, analytics, or remote logs.
3. **Performance-first** — assume payloads can be large; prefer workers,
   indexing, and virtualization over rendering whole documents into the DOM.

## Stack

- Next.js App Router
- React + TypeScript (strict)
- Tailwind CSS with CSS variable design tokens
- ESLint + Prettier
- Local React state / hooks / context (no Redux)

## Project structure

```text
src/
├── app/                 # Routes, layouts, providers (composition only)
├── components/
│   ├── ui/              # Generic primitives (Button, Panel, …)
│   ├── layout/          # App chrome
│   └── common/          # Shared app widgets (theme toggle, …)
├── features/            # Feature-scoped UI + feature hooks
│   ├── json-input/
│   ├── json-explorer/
│   ├── json-search/
│   ├── json-query/      # Boundary only
│   ├── json-tools/      # Format / minify / validate / copy / download
│   ├── json-statistics/ # Overview, keys, values, depth
│   └── marketing/       # Landing page (server-rendered)
├── lib/
│   ├── json/            # React-free JSON domain
│   ├── processing/      # Worker vs main-thread routing
│   ├── search/
│   ├── query/
│   ├── statistics/
│   ├── performance/
│   └── utils/
├── workers/             # Web Worker + client bridge
├── hooks/
├── types/
├── constants/
└── config/
```

## Layering

```text
UI (features/*, components)
  ↓
Feature / hooks (useJsonWorkspace)
  ↓
Processing layer (lib/processing)
  ↓
JSON domain (lib/json) — parse, format, minify, document, paths
  ↓
Web Worker (workers/) for large payloads
```

`lib/json` must not import React, Next.js, Tailwind, or the worker client.
The worker may import `lib/json`. The processing layer may import both.

## JSON processing pipeline

```text
Raw JSON string
  ↓
parseJson() → JsonValue | JsonParseError
  ↓
buildJsonDocument() → JsonNode graph + metadata
  ↓
Worker / UI consumers (format, minify, future explorer)
```

Raw text and the parsed/document model are stored separately in
`JsonWorkspaceState`. Editing the textarea does not mutate the last document
until Apply / Format / Minify runs.

## Public domain API

| Function                                    | Role                                     |
| ------------------------------------------- | ---------------------------------------- |
| `parseJson(input)`                          | Result-typed parse; never throws into UI |
| `formatJson(input, { indentation })`        | Parse then pretty-print (2 or 4 spaces)  |
| `minifyJson(input)`                         | Parse then compact                       |
| `buildJsonDocument(value, { sizeInBytes })` | Iterative node graph                     |
| `getJsonNodeType(value)`                    | Discriminate JSON runtime types          |
| `getJsonPath(segments)` / `appendJsonPath`  | Unambiguous path strings                 |
| `readJsonFile(file)`                        | Client-only file read (BOM-aware)        |

Failures use `Result<T, E>` with `ok: true | false` (Phase 1 convention).

## Node IDs

A node’s `id` **is its JSON path** (`createJsonNodeId(path) === path`).

- Unique within one document
- Stable for that document’s lifetime
- Lets future search results jump to a node without a side table
- Avoids random IDs that would churn on every rebuild of the same JSON

IDs are not unique across multiple in-memory documents; the workspace holds
one document at a time.

Object/array nodes do **not** store nested `JsonValue` copies. Only primitive
leaves keep `primitiveValue`, so the graph does not duplicate the tree.

## JSON paths

Root is `$`. Safe ASCII identifiers use dot notation (`$.users`). Array indexes
use brackets (`[0]`). Keys that are not identifiers (hyphens, dots, spaces,
quotes, unicode, leading digits) use JSON-string bracket notation:

```text
$["first-name"]
$["user.profile"]
```

`JSON.stringify(key)` supplies escaping so quotes and backslashes stay
unambiguous.

## Error handling

Native `JSON.parse` errors are normalized in `lib/json/errors.ts`.

- Empty / whitespace-only input → “No JSON provided” (no invented location)
- Invalid JSON → “Invalid JSON” plus line/column when a `position` (or
  line/column) can be parsed from the engine message and mapped onto the
  **original** source (not a trimmed copy)
- File failures → “Unable to read this file”
- Unexpected worker failures → “Something went wrong while processing the JSON.
  Please try again.”

Line/column are omitted when they cannot be derived.

## Worker communication

```text
React UI
  → useJsonWorkspace / useJsonSearch
  → runJsonParse / runJsonFormat / runJsonMinify / runJsonSerialize / runJsonSearch / runJsonQuery / runJsonAnalyze
  → JsonWorkerClient.parse|format|minify|serialize|search|query|analyze   (large JSON)
  → json.worker.ts → handleWorkerRequest
  → WorkerResponse (same requestId)
  → UI
```

- Protocol: `src/types/worker.ts`
- Handler (testable, no `postMessage`): `src/workers/handle-worker-request.ts`
- Client: `src/workers/json-worker-client.ts`

The client stores pending promises by `requestId`. A response resolves only
the matching promise. Progress events are ignored for completion. `terminate()`
rejects inflight work and clears the map.

UI code must not call `worker.postMessage` directly.

Worker error payloads are structured (`code`, `message`, optional location).
They never include the raw document.

## Large JSON strategy

Limits live in `PERFORMANCE_LIMITS` (`src/constants/performance.ts`).

| Size            | Behavior                                |
| --------------- | --------------------------------------- |
| Below 512 KiB   | Main-thread domain functions            |
| 512 KiB – 10 MB | Worker parse / search / query / analyze |
| 10 – 50 MB      | Worker + large-document warning         |
| 50 – 100 MB     | Best-effort; very-large warning         |
| Above 100 MB    | Rejected before parse / file read       |

Document construction is iterative (explicit stack) so depth > 100 does not
overflow. Parse + document build is a single walk after `JSON.parse`.

The Worker keeps the last parsed `JsonDocument` + value keyed by
`metadata.revision`. After the initial parse clone to the main thread
(required for the explorer), search / query / analyze / serialize send only
the revision token when the cache is warm. That avoids structured-cloning
the graph on every keystroke.

Explorer rendering is a flattened visible list + fixed-height virtual
window. Collapsed containers are not visited. Expand-all on documents
larger than 25,000 nodes is depth-capped. Source/output textareas switch
to a short preview above 512 KiB so React does not mount multi-megabyte
strings.

Performance marks (`startMeasure` / `endMeasure`) record durations only —
never JSON content. They are silent in production.

## Privacy model

All JSON processing is client-side.

**Do not**

- Send JSON to a backend
- `console.log` raw JSON or parse payloads
- Include document content in analytics or error tracking
- Persist JSON remotely

**Allowed**

- In-memory workspace state
- Structured errors (message + location, not the document)

## Feature boundaries

- **json-input** — paste, upload, drag/drop; never uploads to a server.
- **json-tools** — format / minify / validate / copy / download / clear.
- **json-explorer** — virtualized tree, details, `revealNode`.
- **json-search** — search UI + `useJsonSearch`; engine lives in `lib/search`.
- **json-query** — path / JSONPath-subset UI + `useJsonQuery`; engine in `lib/query`.
- **json-statistics** — one-pass document analysis + `useJsonStatistics`; engine in `lib/statistics`.

## State strategy

Prefer **localized feature state**.

- `useJsonWorkspace` owns raw text, parse status, document, selection, search.
- Theme uses React context (`ThemeProvider` / `useTheme`).
- Do not store raw JSON in URLs or query params.

## Component conventions

- Components: `PascalCase` files matching export (`button.tsx` → `Button`).
- Prefer small composable units over giant page components.
- Keep business logic out of JSX; use hooks and `lib/`.
- Use `cn()` for class merging.
- Colors come from CSS variables / Tailwind token aliases — no scattered hex.

## Naming conventions

- Components / types: `PascalCase`
- Functions / hooks / variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Feature folders: `kebab-case`

## Client vs server components

- Default to Server Components in `app/`.
- Mark Client Components when using browser APIs, local state, file input,
  drag/drop, workers, shortcuts, or theme interaction.

## Keyboard shortcuts

Registry: `src/constants/shortcuts.ts`  
Matcher / labels: `src/lib/a11y/keyboard.ts`  
Hook: `useKeyboardShortcut`  
Help: `?` or `Cmd/Ctrl+/` opens the shortcuts dialog.

Application chords are context-aware: they do not replace copy, paste,
select-all, undo, or find. `?` is ignored while typing in an input.

| Action          | Shortcut         |
| --------------- | ---------------- |
| Focus search    | Cmd/Ctrl+K       |
| Focus query     | Cmd/Ctrl+Shift+P |
| Open statistics | Cmd/Ctrl+Shift+I |
| Run query       | Cmd/Ctrl+Enter   |
| Format          | Cmd/Ctrl+Shift+F |
| Minify          | Cmd/Ctrl+Shift+M |
| Shortcuts       | Cmd/Ctrl+/ or ?  |

## Theming

- Tokens live in `src/app/globals.css` (`:root` + `.dark`).
- Tailwind maps token names via `@theme inline`.
- Theme preference is stored under `THEME_STORAGE_KEY` in `localStorage`.

## JSON Explorer

```text
Phase 2 JsonDocument
        ↓
useJsonExplorer (expansion / highlight / reveal / copy)
        ↓
JsonExplorer (panel + toolbar)
        ↓
JsonTree (keyboard + flattened visible ids)
        ↓
JsonVirtualList (windowed rows)
        ↓
JsonTreeNode (object / array / value row)
```

The explorer never walks raw JSON or rebuilds the document. It reads
`JsonNode` records by Phase 2 path IDs.

### State

Explorer UI state is separate from processing state:

- `expandedNodeIds: Set<nodeId>`
- `selectedNodeId` (workspace-owned, path id)
- `highlightedNodeId` (transient; search navigation reuses this)

`revealNode(nodeId)` expands ancestors, selects, highlights, and scrolls.
`focusNode` is the same entry point. Search results call `revealNode` with
the Phase 2 `nodeId` — they do not walk the tree themselves.

### Performance

- Collapsed containers do not visit children (lazy visible-list walk).
- The tree is a flattened list, not a recursively mounted React tree.
- `JsonVirtualList` windows that list (fixed row height, overscan).
  A 10,000-element array does not mount 10,000 DOM rows.
- `memo` on `JsonTreeNode`; callbacks come from the explorer hook.
- Details does not materialize containers larger than 200 children.

Virtualization is a small in-repo list window, not a third-party tree library.

### Accessibility

`role="tree"` / `treeitem`, `aria-expanded`, `aria-selected`, `aria-level`.
The tree is one tab stop. Arrows move the selection; Enter/Space toggles
containers. Copy actions live in the toolbar and details panel.

## JSON Search (Phase 4)

```text
Search UI (bar + results)
        ↓
useJsonSearch (debounce, mode, selection, stale-ignore)
        ↓
runJsonSearch (main thread or Worker)
        ↓
searchJson(document, options)     ← React-free engine
        ↓
Phase 2 JsonDocument nodes
        ↓
JsonSearchResult { nodeId, path, … }
        ↓
explorer.revealNode(nodeId)
        ↓
expand ancestors → scroll → select → highlight
```

### Modes and matching

| Mode   | Matches                               |
| ------ | ------------------------------------- |
| Keys   | Object property names                 |
| Values | Primitive leaves only                 |
| All    | Key and/or value; one result per node |

Default: **case-insensitive**, **partial** (`includes`). `exactMatch` and
`caseSensitive` are engine options for later UI.

Value semantics:

- string → substring of the raw string
- number → canonical `String(number)` (101 → `"101"`)
- boolean → `"true"` / `"false"`
- null → `"null"`
- objects / arrays are never stringified for value search

Empty / whitespace queries return no results and clear selection.

### Indexing

Phase 4 does **not** build a key index. Default matching is partial and
case-insensitive, so every key/value still has to be inspected. The
document is already a flat `nodes` map; search walks it in DFS
`childIds` order. Large documents run in the existing JSON worker.
A future exact-match index can plug into `searchJson` without changing
result identity (`nodeId` remains the Phase 2 path).

### Virtualization

Search results reuse `JsonVirtualList` (fixed 56px rows). Result identity
is `nodeId + matchType`. Click, keyboard selection, and `‹ ›` navigation
keep the selected index and scroll that row into view.

If a search exceeds `MAX_SEARCH_RESULTS` (10,000), the engine still
reports the true `matchCount` and sets `truncated: true`. The UI says
so — results are never silently dropped.

### Debounce and cancellation

- Typing: 160ms debounce (`SEARCH_DEBOUNCE_MS`)
- Clearing the query: immediate
- Each search increments a generation / uses worker `requestId`
- A stale response cannot overwrite a newer query

### Worker

`WorkerRequestType` includes `"search"`. The payload is the already-built
`JsonDocument` plus query options (the worker stays stateless). Offload
when `sizeInBytes >= 512 KiB` or `nodeCount >= 8,000`.

## JSON Query (Phase 5)

```text
Query UI (bar + results)
        ↓
useJsonQuery (explicit Run, selection, stale-ignore)
        ↓
runJsonQuery (main thread or Worker)
        ↓
parseQuery → QueryAst → evaluateQuery
        ↓
Phase 2 JsonDocument
        ↓
JsonQueryResult { nodeId, path, … }
        ↓
explorer.revealNode(nodeId)
```

Simple paths (`users[].id`) normalize to the same AST as JSONPath
(`$.users[*].id`). There is one evaluator.

### Supported syntax (JSONPath-compatible subset)

| Syntax            | Meaning                          |
| ----------------- | -------------------------------- |
| `$`               | Root                             |
| `.key`            | Child property                   |
| `["key"]`         | Bracket property (special names) |
| `[0]`             | Array index                      |
| `[*]` / path `[]` | All children of a container      |
| `..key`           | Recursive property search        |

**Not supported:** filters, unions, slices, scripts, `@`, jq. Those return
an explicit “not supported” error instead of a silent wrong answer.

This is **not** a claim of full JSONPath compatibility.

### Execution

Queries run on **Enter / Run**, not on every keystroke. Large documents
use the existing worker (`type: "query"`) with the same `requestId` map.
Result lists reuse `JsonVirtualList`. Autocomplete is deferred.

## JSON Utilities (Phase 6)

```text
Utility toolbar
    ↓
useJsonTools (feedback, menus, clear confirm)
    ↓
useJsonWorkspace.applyFormat / applyMinify / applyParse
    ↓
Existing parsed value  →  serializeJsonValue
    or
runJsonFormat / runJsonMinify / runJsonParse  (Worker when unparsed + large)
    ↓
Same JsonDocument (path IDs unchanged)
```

When the workspace already has a valid `parsedJson`, Format / Minify
stringify that value and update `rawJson` / `outputJson`. They do **not**
rebuild the document, so selection, search, and query stay intact.

Unparsed or invalid text still goes through the Phase 2 engine (and Worker
above 512 KiB). Validate is `parseJson` / `applyParse` — there is no second
parser.

Copy and download serialize from `parsedJson`. Object URLs are revoked
after download. Clipboard uses `copyTextToClipboard`.

Indentation: 2 spaces (default), 4 spaces, or tabs.

### UI feedback and source highlighting

Action feedback stays next to the control that caused it (for example,
`Copied`, parse status, and Output announcements). Do not add a global toast
dependency for routine workspace actions; reserve dialogs for confirmation or
blocking decisions.

Source syntax highlighting is a visual overlay on the accessible textarea. It
uses a deferred, linear scanner and is capped at 32 KiB. Larger sources keep
the plain editor, and documents above the existing editor limit use the compact
preview, so highlighting never becomes part of the large-document hot path.

## JSON Statistics (Phase 7)

```text
JsonDocument
    ↓
analyzeJsonDocument()   ← one DFS pass
    ↓
JsonStatistics
    ↓
Statistics UI
    ↓
Search key / revealNode / optional Query
```

Node counts follow Phase 2: every `JsonNode` is one node. Keys are not
separate nodes. Format/minify keep the same document reference, so
statistics are not recomputed.

The reserved Worker `analyze` request now runs this engine. Offload uses
the same size/node thresholds as search.

Value-frequency maps are capped (`MAX_TRACKED_VALUES`). Extra first-seen
values increment the unique estimate without growing memory.

### Phase 8 readiness

Diff, schema, and data-quality checks should consume `JsonStatistics` /
`JsonDocument` rather than walking raw JSON again. Worker revision cache
and `PERFORMANCE_LIMITS` should be reused rather than adding another
processing pipeline.

## Phase 10 — quality gate

Production hardening reuses the Phase 2–9 engines. It adds:

- Route and workspace error recovery (`app/error.tsx`, `ErrorBoundary`)
- Security headers / CSP in `next.config.ts`
- Worker request allowlisting (`isWorkerRequest`)
- Worker errors without engine `rawMessage`

Do not add a backend or send document content off-device.

## Phase 11 — launch surface

The homepage (`/`) is a Server Component marketing page. It must not import
the JSON workspace, workers, or engines.

Site URL: `getSiteUrl()` reads `NEXT_PUBLIC_SITE_URL` and falls back to
`https://jsonexplore.dev` for canonical, sitemap, robots, and Open Graph.

`/json` stays the interactive tool and is indexable, with its own title,
description, canonical URL, and sitemap entry. GitHub links render only when `SITE.githubUrl` is
a real `github.com/owner/repo` path.
