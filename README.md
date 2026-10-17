# JSON Explore

JSON Explore is a browser-based developer tool for inspecting JSON. Paste or
upload a document, walk it as a tree, search keys and values, run a small
JSONPath-style query language, and look at structure statistics — without
sending the document to a server.

> Find anything inside any JSON.

## What it does

Open `/json` for the workspace. One editor holds the document; the toolbar
switches jobs without losing that JSON.

| Tool | What you get |
| --- | --- |
| **Explore** | Interactive tree with keyboard navigation, node details, and in-tree search |
| **Query** | Simple paths and a JSONPath subset (`$..key`, wildcards) |
| **Statistics** | Node counts, type mix, common keys, deepest path |
| **Format** | Pretty-print or compact valid JSON |

Invalid JSON is reported with a line and column when the parser can derive them.
Large payloads are parsed, searched, queried, and analyzed on a Web Worker so
the UI stays responsive. The tree is virtualized so huge arrays do not dump
every node into the DOM.

The marketing site at `/` is a server-rendered landing page. The workspace at
`/json` is indexable, with its own title and sitemap entry.

## Privacy

All core processing runs in the browser. Document text is not posted to an API,
analytics, or logs. Session storage only remembers a small source hint (for
example that you loaded a file), not the JSON itself.

Do not add backend endpoints that receive document content for explore, search,
query, format, or statistics.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- React 19 + TypeScript (strict)
- Tailwind CSS 4
- Local React state (hooks and context — no Redux)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for layering, the JSON domain API,
workers, and performance rules. See [CONCEPTS.md](./CONCEPTS.md) for React and
Next.js patterns used in this repo.

## Project layout

```text
src/
├── app/                 # Routes, layouts, metadata, SEO files
├── components/          # UI primitives, layout, shared widgets
├── features/            # Feature UI + hooks (explorer, search, query, …)
├── lib/                 # React-free engines (json, search, query, stats)
├── workers/             # Web Worker + main-thread client
├── hooks/               # App-wide hooks (workspace, theme, shortcuts)
├── types/               # Shared TypeScript types
├── constants/           # Limits, copy, shortcut definitions
└── config/              # Site name, URL, SEO strings
```

`src/app` should stay composition: pages assemble features. JSON parse/format
logic lives in `src/lib/json` and must not import React.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing (SEO) |
| `/json` | Explorer workspace |
| `/json?tool=query` | Workspace opened on Query (same for `statistics`, `format`, and the other tools). `output` and `minify` open Format |

## Getting started

```bash
npm install
npm run dev
```

The dev server listens on [http://localhost:4500](http://localhost:4500).

```bash
npm run build        # production build
npm run start        # production server (port 4500)
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run format       # Prettier write
npm run format:check # Prettier check
```

Before a public deploy, follow [LAUNCH.md](./LAUNCH.md). Set
`NEXT_PUBLIC_SITE_URL` to the production origin (no trailing slash).

## License

Private / unpublished.
