# Employee Insights Dashboard

A 4-screen React + Vite dashboard demonstrating auth persistence, custom DOM virtualization, browser Camera/Canvas APIs, and raw SVG analytics. Zero UI libraries used.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Vanilla CSS (CSS custom properties) |
| State | React Context API + localStorage |
| Virtualization | Hand-rolled (no react-window / react-virtualized) |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd employee-insights-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running Locally

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the application**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Screens

| # | Route | Description |
|---|---|---|
| 1 | `/` | Login — localStorage-persisted auth via Context |
| 2 | `/list` | High-performance virtualized employee grid |
| 3 | `/details/:id` | Camera capture + canvas signature + PNG merge |
| 4 | `/analytics` | Audit image viewer, raw SVG chart, SVG map |

---

## Intentional Bug

### Location
`src/pages/ListPage.jsx` — virtualization scroll handler.

### What it is
The `scrollTop` state variable is **never reset when the user changes filters** (search query, city, or sort key). This is a **stale scroll-position logic bug**.

### How it manifests
1. Open the grid and scroll to the bottom (e.g., row 2 000 of 3 000).
2. Type a search term that narrows the list to, say, 10 rows.
3. The computed `startIndex` is now:

   ```
   startIndex = floor(2 000 × 72 / 72) - OVERSCAN
              = 1 994
   ```

   But `filteredEmployees.length` is only 10, so `visibleRows = filteredEmployees.slice(1994, …)` returns an **empty array** — the viewport goes blank.

4. The bug self-corrects only when the user manually scrolls upward (triggering a new `onScroll` event that updates `scrollTop`).

### Why it was left in
The fix is a single `setScrollTop(0)` inside each filter's `onChange` handler (or a `useEffect` dependency on `filteredEmployees`). Omitting it demonstrates awareness of how stale derived state interacts with DOM scroll position in a hand-rolled virtualization layer — a subtle class of bugs that `react-window` handles internally.

---

## Custom Virtualization Math

The virtual viewport renders only the rows visible in the scrollable container plus an overscan buffer above and below, keeping the DOM node count constant regardless of total list size.

```
ROW_HEIGHT  = 72        // px per row (fixed)
OVERSCAN    = 6         // extra rows rendered outside viewport

totalHeight = filteredEmployees.length × ROW_HEIGHT
              → height of the invisible "track" div that drives the scrollbar

visibleCount = ⌈viewportHeight / ROW_HEIGHT⌉
              → how many rows fit in the container

startIndex  = max(0, floor(scrollTop / ROW_HEIGHT) − OVERSCAN)
              → first row to render (pulled back by overscan for smooth up-scroll)

endIndex    = min(length, startIndex + visibleCount + OVERSCAN × 2)
              → last row to render (pushed forward for smooth down-scroll)

offsetY     = startIndex × ROW_HEIGHT
              → CSS translateY applied to the inner container so rows appear
                at the correct visual position without actually being there
```

Only `endIndex − startIndex` DOM nodes exist at any time (≈ visibleCount + 18). Scrolling updates `scrollTop` state, which re-slices the array — no library needed.

---

## Image Merge (Canvas Compositing)

The merge in `DetailsPage.mergeAuditImage`:

1. **Photo canvas** (`photoCanvasRef`) — off-screen canvas painted with `ctx.drawImage(video)` at capture time; holds the raw RGBA pixel data.
2. **Signature canvas** (`signatureCanvasRef`) — transparent canvas overlaid on the photo via absolute CSS positioning; stroked in real time on `mousemove`/`touchmove`.
3. **Export canvas** — a new off-screen canvas matching the photo dimensions:
   - `drawImage(photo)` — base layer
   - `drawImage(signatureCanvas)` — blended over the photo (transparent pixels are ignored)
   - `fillRect` + `fillText` — semi-opaque watermark strip
4. `exportCanvas.toDataURL('image/png')` produces a Base64 data URL stored in `DataContext` (and `localStorage` for refresh persistence).

---

## Auth Persistence

`AuthProvider` serialises `{ isAuthenticated, username }` to `localStorage` on every state change. On first render, `getInitialAuthState()` reads from `localStorage`, so sessions survive hard refreshes. `ProtectedRoute` reads from context; unauthenticated navigation to any `/list`, `/details/:id`, or `/analytics` redirects to `/` and preserves the intended destination in `location.state.from`.

---

## Geospatial Mapping

City coordinates are stored as manual percentage offsets (`x`, `y` in 0–100 range) derived from approximate lat/lng projections of each city onto the SVG viewBox (`0 0 900 440`). The transform applied is:

```
cx = city.x × 6.5
cy = city.y × 4.3
```

Bubble radius scales with employee count: `r = 8 + min(18, count × 0.9)`.

No map library is used — the outline is a hand-traced SVG `<path>` approximating India's silhouette.

---

## Credentials

```
Username: testuser
Password: Test123
```
