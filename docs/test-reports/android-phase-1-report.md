# Android Phase 1 — Implementation Report
Date: 2026-04-11
Project: Sherpaa
Author: pairing session with Claude

---

## Phase 1 Scope (as shipped)

Phase 1 replaces Phase 0 mock data with real Strava segment sync and a usable Route Setup flow. Everything downstream of Route Setup (cue generation, pre-ride brief, in-ride, post-ride) still runs on Phase 0 mocks and is deferred to Phase 2+.

### Delivered

1. **Strava starred segment sync** — `src/services/segmentSync.ts` fetches paginated starred segments from `/segments/starred`, hydrates each with `effortCount` and `bestTimeSec` from `/segments/:id`, and persists them to SQLite via Drizzle. Auto-runs on Home tab entry when the local DB is empty.
2. **Strava token refresh** — `src/services/stravaAuth.ts` refreshes expired access tokens using the persisted refresh token before any API call. `HomeTab.tsx` checks `stravaTokenExpiresAt` and refreshes in-line if needed.
3. **Polyline decoder + route matching** — `src/utils/polyline.ts` decodes Google's encoded polyline format. `src/services/routeMatching.ts` matches starred segments to a decoded route using Haversine distance (segment start AND end must be within 150m of any route point). Returns matched segments sorted by `distanceAlongRouteKm`.
4. **Recent activity picker** — `getRecentActivities` in `src/services/stravaApi.ts` fetches the 30 most recent activities and filters to those with a non-empty `map.summary_polyline`, returning the top 10.
5. **Map preview via WebView + Leaflet** — `src/components/MapWebView.tsx` hosts Leaflet 1.9.4 with CartoDB Dark Matter tiles inside a WebView. Renders the route polyline in gold, plus gold circle markers at each matched segment start. No Google Maps SDK.
6. **Split Route Setup UX** — `src/components/RouteSetupScreen.tsx` replaces the Phase 0 bottom-sheet layout with a 50/50 vertical split: map on top, panel on bottom. Panel has two states (ride picker → segments+goal) with a preview-then-confirm transition. Pills overlay at top of map: `✦ Strava Route` / `Import GPX` (stub) / `Skip`.
7. **Wrapper rewrite** — `RouteSetupScreenWrapper` in `src/screens/wrappers.tsx` wires real data: loads activities on mount, handles preview/confirm/clear, navigates to CueGeneration with matched segment IDs (or all starred segments when Skip is used). `PreRideBriefScreenWrapper` now hydrates its segment list from the segment store instead of mocks.
8. **MainTabs safe-area fix** — `src/navigation/MainTabs.tsx` uses `useSafeAreaInsets()` for dynamic bottom padding (`Math.max(insets.bottom, 12)`). Icon size raised from 18 to 26px.

### Deferred to later phases

- **GPX import** — Shipped as a stub. Tapping the pill shows an Alert: "GPX import will be available in a future update." Moved to v1.1 per product spec MoSCoW (Should Have).
- **Accessibility labels** — Phase 0 Blocked B1 still open; zero `accessibilityLabel` props on any interactive element in Route Setup. Must be fixed before TestFlight/closed beta.
- **Colors token migration** — Phase 0 F1–F4 still open for the screens edited in this phase (`RouteSetupScreen.tsx`, `MapWebView.tsx`). The values used match design tokens but the literals are inline.

---

## Decisions

### D1 — Map rendering: WebView + Leaflet, not react-native-maps

**Context:** Product spec originally called for "Full-screen map (MapKit)". On Android this would mean `react-native-maps` with the Google Maps provider.

**Problem:** `react-native-maps` initializes the Google Maps SDK at mount time on Android even when `provider="none"` or `mapType="none"` is set. Without a Google Maps API key in `AndroidManifest.xml` it crashes with `java.lang.IllegalStateException: API key not found`. Adding a key ties the project to Google Cloud billing (free tier generous, but a key to provision, rotate, and restrict).

**Decision:** Use `react-native-webview` hosting Leaflet 1.9.4 with CartoDB Dark Matter tiles (`cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png`).

**Tradeoffs accepted:**
- **+** No API key. No Google Cloud account. No billing surface area.
- **+** Dark tiles out of the box — matches app aesthetic without custom styling.
- **+** Works identically on iOS and Android (same WebView code).
- **−** WebView <-> JS bridge for route injection has a startup race: must wait for Leaflet to load before calling `updateMap`. Handled via a `ready` postMessage from the page + a pending-queue in `MapWebView.tsx` (`isReadyRef` / `pendingRef`).
- **−** No native gesture handoff for things like long-press or custom overlays — not needed in v1.
- **−** CartoDB has no SLA. If tiles ever become unreachable we'd need a fallback provider (OpenStreetMap standard, Stamen, etc.). Low near-term risk.

**Revisit trigger:** If we ever need turn-by-turn navigation or offline maps, re-evaluate. Mapbox GL with a free tier, or MapLibre (fork, no key), would be the most likely replacements.

### D2 — Preview-then-confirm ride selection

**Context:** Original design had a single-tap flow: tap a ride → list of matching segments appears immediately.

**Decision:** Two-tap flow — tap a ride to preview it on the map + see its name highlighted, then tap a "Use this ride" button to commit. Panel swaps to segment list only after commit.

**Why:** User explicitly requested it after seeing the single-tap version — the map preview is the whole point of picking a ride, so forcing a commit step before losing the ride list keeps mistakes cheap.

---

## Open issues carried forward from Phase 0

All P0 items from the Phase 0 report remain open unless explicitly fixed in Phase 1:

| # | From | Status after Phase 1 |
|---|------|----------------------|
| F1–F4 | Hardcoded hex in screen files | **Still open.** Phase 1 touched `RouteSetupScreen.tsx` and `MapWebView.tsx` but did not migrate inline hex to tokens. |
| F5 / R1 | `fontVariant: ['tabular-nums']` on Android | **Still open.** Not touched in Phase 1 — affects in-ride / debrief screens, deferred to Phase 2. |
| R2 | PostRideSummary `onDone` navigates to `InRide` | **Still open** (Phase 2 scope). |
| R3 | Phantom tab bar in `HomeScreen.tsx` | **Needs verification.** HomeTab wrapper was rewritten in Phase 1 but `HomeScreen.tsx` component lines weren't audited. |
| R4 | Hardcoded `paddingTop: 54` in `InRideScreen` | **Still open** (Phase 2 scope). |
| B1 | Missing `accessibilityLabel` everywhere | **Still open.** Route Setup adds more interactive elements (ride rows, pills, goal chips) all of which need labels before beta. |

---

## Phase 1 Go/No-Go: GO for Phase 2 (Cue Generation)

The delivered Route Setup flow is usable end-to-end on a real device against real Strava data. The Phase 0 cosmetic / a11y debt did not grow meaningfully in Phase 1 and is all non-fatal. Phase 2 can start.

### Must-clear checklist before beta (not before Phase 2)

- [ ] Migrate Phase 1 hex literals to `colors.ts` (F1–F4 continuation)
- [ ] Add `accessibilityLabel` to all new Phase 1 interactive elements (B1 continuation)
- [ ] Verify CartoDB tiles under poor-network conditions; add a visible "Map unavailable" state if tiles fail
- [ ] Smoke test on a second Android device (current testing has only been on `SM-S918U`)
