# React and Next.js concepts in this project

A map of framework patterns used in JSON Explore, with a short note on *where*
each one shows up. Domain JSON logic (parse, paths, query) is kept out of React
on purpose — see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Next.js

### App Router

Routes are folders under `src/app`. `page.tsx` is the UI for that URL.
`layout.tsx` wraps every page. There is no `pages/` directory.

### Server Components vs Client Components

Files without `"use client"` are Server Components: they can export metadata and
render on the server. The landing page (`src/app/page.tsx` →
`LandingPage`) stays on the server so the homepage JS stays small.

`"use client"` marks a Client Component: hooks, events, `window`, workers.
The workspace (`JsonWorkspaceShell` and its children) is client-only because it
holds live editor state.

`src/app/providers.tsx` is a thin client boundary so the root layout can stay a
Server Component while still wrapping the tree in `ThemeProvider`.

### Root layout

`src/app/layout.tsx` is the HTML shell: `<html>`, `<body>`, fonts, global CSS,
and providers. Every route inherits it.

### Metadata API

Pages export a `metadata` object (`title`, `description`, `robots`,
`alternates.canonical`, Open Graph, Twitter). The root layout sets defaults and
a title template (`%s — JSON Explore`). `/json` sets `robots.index: true` and
a tool-focused title so the workspace can appear in search.

### Viewport export

`export const viewport` in the root layout sets `themeColor` (light/dark) and
the mobile viewport. In the App Router this is separate from `metadata`.

### `loading.tsx`

Special files that show while a segment is loading. `src/app/loading.tsx` covers
the site; `src/app/json/loading.tsx` covers the workspace.

### `error.tsx`

A Client Component error boundary for the route segment. `src/app/error.tsx`
receives `error` and `reset` so the user can retry after a render failure.

### `not-found.tsx`

Rendered for unknown URLs. `src/app/not-found.tsx` is a full-page 404 with a
link into `/json`.

### File-convention SEO and assets

| File | Role |
| --- | --- |
| `sitemap.ts` | Builds `/sitemap.xml` (`MetadataRoute.Sitemap`) |
| `robots.ts` | Builds `/robots.txt` |
| `manifest.ts` | Builds `/manifest.webmanifest` |
| `icon.tsx` / `apple-icon.tsx` | Generated favicon / Apple touch icon |
| `opengraph-image.tsx` / `twitter-image.tsx` | Social preview images |

### `ImageResponse` (`next/og`)

Icons and OG images are JSX rendered to PNG at request/build time, not static
files in `public/`.

### `next/font`

`Geist` and `Geist_Mono` from `next/font/google` in the root layout. Fonts are
self-hosted via CSS variables (`--font-geist-sans`) so there is no extra Google
Fonts request.

### `next/link`

Client-side navigation for in-app links (header, footer, 404, landing CTAs)
instead of raw `<a>` for internal routes.

### `next.config.ts` headers

`headers()` attaches CSP, `X-Frame-Options`, `Referrer-Policy`, and similar to
every path. `worker-src` allows the JSON Web Worker (`blob:` in addition to
`'self'`).

### Path alias `@/`

`tsconfig.json` maps `@/*` to `src/*`, so imports look like
`@/hooks/use-json-workspace`.

### `NEXT_PUBLIC_*` env

`NEXT_PUBLIC_SITE_URL` is read in `src/config/site.ts` for canonical URLs,
sitemap, and JSON-LD. Only `NEXT_PUBLIC_` values are inlined for the browser.

### Typed layout props

`RootLayout` uses `LayoutProps<"/">` (Next’s generated types) for `children`.

---

## React

### `"use client"` and hydration

Client trees hydrate after the server HTML. Theme class on `<html>` is applied
by an inline boot script *and* by React; `suppressHydrationWarning` on `<html>`
avoids a mismatch flash. `useApplePlatform` uses a server snapshot of `false`
so shortcut labels do not disagree on first paint.

### `useState`

Local UI and workspace state: raw JSON, selected node, open dropdowns, active
tool, drag-and-drop on the editor.

### `useRef`

DOM nodes (textarea, dialog panel, virtual list scroller) and mutable values
that should not re-render (parse generation counters, latest shortcut handler).

### `useEffect`

Subscriptions and “after paint” work: `keydown` shortcuts, `ResizeObserver` on
the virtual list, focus trap in `Dialog`, syncing `?tool=` in the URL, restoring
session source.

Effects that attach listeners return a cleanup function (`removeEventListener`,
`observer.disconnect()`).

### `useCallback` / `useMemo`

Stable callbacks for child props (`setRawJson`, file handlers). Memoized derived
data (theme context value, tool definition) so children that are `memo`’d do not
re-render for a new function identity every time.

### Custom hooks

Logic is pulled out of JSX:

| Hook | Job |
| --- | --- |
| `useJsonWorkspace` | Parse / format / minify / selection for the shared document |
| `useJsonExplorer` | Tree expand/collapse and visible rows |
| `useJsonSearch` / `useJsonQuery` / `useJsonStatistics` / `useJsonTools` | Per-tool work |
| `useWorkspaceTool` | Active toolbar tab + URL query |
| `useTheme` | Light/dark |
| `useKeyboardShortcut` | Global chords |
| `useApplePlatform` | ⌘ vs Ctrl labels |

### Context (`createContext` / `useContext`)

`ThemeProvider` exposes `theme`, `setTheme`, and `toggleTheme`. `useTheme`
throws if used outside the provider.

### `useSyncExternalStore`

Theme is stored on `document.documentElement` + `localStorage`, not only in
React state. `useSyncExternalStore` subscribes to that external store with a
separate server snapshot so SSR is deterministic.

The same hook is used for “are we on Apple?” without tearing during hydration.

### `useId`

Stable IDs for accessibility: `aria-labelledby` on dialogs, tab panels, search
result lists, form labels. Avoids colliding `id`s if the component mounts twice.

### `forwardRef`

UI primitives (`Button`, `Input`, `Textarea`, `IconButton`) forward a ref to
the underlying DOM node so parents can focus them.

### `useImperativeHandle`

`JsonInputPanel` exposes a small handle `{ focus }` instead of the whole
textarea, so the workspace can focus the editor from a shortcut.

### `memo`

Heavy trees (`JsonTreeNode`, `JsonExplorer`, search/query/stats panels) skip
re-render when props are unchanged — important while the list is virtualized
and the parent workspace re-renders often.

### Generic list components

`JsonVirtualList<T>` is a generic component: callers pass `items`, `getItemKey`,
and `renderItem`. Only the window of rows in view (plus overscan) is mounted.

### Class error boundary

`ErrorBoundary` is a class component (`getDerivedStateFromError`) because React
still has no hook for this. It catches render errors in the workspace without
logging the thrown value (it might contain user JSON). Route-level failures use
`error.tsx` instead.

### Portals (`createPortal`)

Tooltips render into `document.body` so `overflow: hidden` on panels does not
clip them.

### Controlled inputs

The JSON textarea is controlled: `value` comes from workspace state, `onChange`
calls `setRawJson`. Search and query fields follow the same pattern.

### Composition (`children` / slots)

Layout and primitives take `children` (and sometimes `action` / `extraActions`)
so pages compose UI without the primitive knowing about JSON.

### Lists and keys

Search highlights, FAQ, tree rows, and virtual-window cells use `key` so React
can reconcile lists. Node identity in the tree is the JSON path, not a random
id.

### `dangerouslySetInnerHTML`

Used only for trusted static strings: the theme boot script and JSON-LD
(`JSON.stringify` of objects we own). Never for user JSON.

### Event handling and forms

Click, keyboard, drag-and-drop, and file `<input type="file">` all live in
client components. The dialog implements a focus trap and restores focus on
close (accessibility, not a Next API).

### Web Workers from React

`JsonWorkerClient` constructs `new Worker(new URL("./json.worker.ts", import.meta.url))`.
Hooks call `runJsonParse` / `runJsonSearch` / …; they do not `postMessage`
directly. A generation ref ignores stale results if the user changes JSON
mid-flight.

---

## TypeScript around React

- **Strict + `noUncheckedIndexedAccess`** — indexed access may be `undefined`.
- **Discriminated `Result<T, E>`** — parse/search/query return `{ ok: true }` or
  `{ ok: false, error }` instead of throwing into the UI.
- **Feature types** live in `src/types`; components import those rather than
  inventing parallel shapes.

---

## Styling (with React)

Tailwind utility classes plus CSS variables for tokens (`--radius-md`,
`bg-background`). `cn()` (`clsx` + `tailwind-merge`) merges class names without
conflicting utilities. Dark mode is a `dark` class on `<html>` (class strategy),
not `prefers-color-scheme` alone.
