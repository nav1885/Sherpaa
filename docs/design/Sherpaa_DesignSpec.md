# Sherpaa — Design Specification
*Design review completed April 2026*

---

## Design Review Notes

The existing design is strong in its fundamentals and required targeted fixes rather than a ground-up rework. The dark theme, gold accent system, and type scale were all well-judged. Changes made in this review:

- Expanded the color token set to eliminate hardcoded hex values scattered across screens
- Fixed three touch targets below the 44pt minimum (PaywallScreen close, PreRideBriefScreen back, PostRideSummaryScreen share)
- Raised the tab bar height from 60px to the correct 83px (iOS standard with home indicator clearance)
- Bumped sub-minimum font sizes (10px) to 11px (our system minimum for labels)
- Improved contrast on in-ride metric labels and End Ride button
- Fixed terms text contrast on Paywall (was #3A3A3A, now #555555 — required by App Store guidelines)

---

## Color Philosophy

**Why dark?** Sherpaa is used outdoors on a bike mount, at dawn and dusk, in direct sun. Dark interfaces with high-contrast text and a single vivid accent outperform light UIs in these conditions — the same reason Garmin, Wahoo, and Strava's head unit view all default dark. Battery conservation on OLED screens is a real secondary benefit.

**Why gold?** Gold signals performance, achievement, and personal records across all cycling culture — Strava's KOM crowns, race medals, leader jerseys. It reads at extreme distances on a bike mount at 112px. It contrasts sharply against every competitor's brand color: Strava's #FC4C02 orange, Garmin's red/black, Wahoo's blue. On our #111111 in-ride background, #F5C842 achieves 10.5:1 contrast (WCAG AAA). It's used only on: primary CTAs, active states, PR highlights, and audio indicators — never decoratively.

**Color reasoning process applied:**
1. User emotional state: competitive tension (approaching a segment), focused attention (mid-effort), relief and pride (PR result). Gold is reward. Deep black is focus.
2. Domain: outdoor cycling, speed, endurance. Dark + gold reads as premium performance, not leisure.
3. Competitive context: every competitor uses blue, orange, or red. Gold is uncontested and ownable.

---

## Design System Tokens

### Colors

All tokens live in `/src/constants/colors.ts`. Never hardcode hex values in component files.

```
// Backgrounds
bg:               #1C1C1E    // Main screen background (iOS dark mode base)
bgDeep:           #111111    // In-ride, debrief, result screens (max contrast, OLED)
bgOverlay:        #1A1A1A    // Canvas / page background layer
surface:          #2A2A2A    // Cards, list items, bottom sheets
surfaceAlt:       #242424    // Alternate rows, condensed cards, table rows
surfaceDim:       #222222    // Deeper inset — metric cards in overlays
surfaceElevated:  #1E1E1E    // Slightly lighter — layered card backgrounds

// Borders
borderSubtle:     #2E2E2E    // Lightest separation — map overlays, pill borders
border:           #363636    // Standard card and input border
borderMuted:      #333333    // Tab bars, section dividers
borderStrong:     #3A3A3A    // Active elements, handles, strong dividers

// Accent — Gold
gold:             #F5C842
goldDim:          rgba(245,200,66,0.10)   // Tinted backgrounds
goldBorder:       rgba(245,200,66,0.20)   // Standard tinted borders
goldBorderStrong: rgba(245,200,66,0.30)   // Selected states, PR card borders
goldGlow:         rgba(245,200,66,0.12)   // Radial glow on PR result screens

// Text
textPrimary:      #F0F0F0    // Headings, primary content
textSecondary:    #888888    // Supporting labels, readable metadata
textMuted:        #555555    // Timestamps, secondary metadata
textDim:          #444444    // Section labels, inactive states
textFaint:        rgba(240,240,240,0.40)  // Ghost button text only
textOnGold:       #000000    // Text rendered on gold surfaces

// Semantic
success:          #30A46C
successDim:       rgba(48,164,108,0.08)
successBorder:    rgba(48,164,108,0.20)
error:            #E5484D
errorDim:         rgba(229,72,77,0.10)
errorBorder:      rgba(229,72,77,0.20)

// Brand partners
stravaOrange:     #FC4C02    // Strava badge ONLY — not used as a UI color

// Map
mapBg:            #1A2030    // Simulated dark map base
mapRoad:          #243040    // Road lines on map tiles

// Pure
black:            #000000
white:            #FFFFFF
```

### Typography

System font: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text'`
All numeric displays: `fontVariant: ['tabular-nums']` — non-negotiable for real-time data.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | 112px | 800 | In-ride speed readout — impossible to miss at a glance |
| Hero | 80px | 800 | Segment result time — fills the visual field |
| Title XL | 28px | 700–800 | Screen headlines, paywall |
| Title L | 24px | 700 | Flow titles, debrief |
| Title M | 20px | 700 | Card titles, segment names |
| Body L | 17px | 600 | Primary CTAs — all btn-gold and btn-outline |
| Body M | 15px | 400–600 | Body text, list items |
| Body S | 14px | 400–500 | Supporting text, descriptions |
| Label | 13px | 500 | Status text, sync labels |
| Caption | 11px | 500–600 | Section headers (ALL CAPS + letterSpacing 1.0–1.2), badges |
| Micro | 11px | 500–600 | Stat unit labels (ALL CAPS) — 11px is the minimum, never below |

**No font size below 11px anywhere in the app.** 10px fails readability in any outdoor ambient condition.

### Spacing Scale

Base unit: 4px

`4 · 8 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64`

Standard screen padding: `20px` horizontal
Card internal padding: `14–20px`
Section gap between cards: `8–12px`
Bottom safe area: `40–48px` (accounts for iPhone home indicator)

**Note on gap values:** Avoid `gap: 10`. Use 8 or 12.

### Border Radius

| Element | Radius |
|---|---|
| Pills / tags / avatars / icon wrappers | 999px |
| Primary CTA buttons | 999px |
| Cards / list items | 12px |
| Feature table | 14px |
| Small chips / badges | 10px |
| Bottom sheets | 24px (top corners only) |
| Modals | 20px |
| Summary cards | 16px |

### Shadows

Avoid decorative drop shadows. Use border contrast instead. The phone frame mockup shadow only:
`0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px #2A2A2A`

### Touch Targets

**Minimum: 44×44pt on all interactive elements.** No exceptions. This is an Apple HIG requirement and an accessibility requirement. Elements visually smaller than 44pt must use invisible padding to reach the minimum tap area.

Current known violations fixed in this review:
- PaywallScreen close button: 32→44pt
- PreRideBriefScreen back button: 36→44pt
- PostRideSummaryScreen share button: 36→44pt
- InRideScreen End Ride button: added minHeight: 44

### Haptics

| Event | Haptic type |
|---|---|
| Segment geofence trigger (approaching) | Medium impact |
| New PR confirmed | Heavy impact + success notification |
| Primary CTA tap | Light impact |
| Error state | Error notification |
| Paywall dismiss | Light impact |
| End Ride hold — 1s midpoint | Medium impact (progress feedback) |
| End Ride hold — confirmed | Heavy impact |
| [NEW] Pull-to-refresh release | Light impact |
| [NEW] Sync failure | Error notification |

---

## Component Inventory

### Buttons

**btn-gold** (Primary CTA)
- Height: 52–54px · width: full (100%) · border-radius: 999px
- Background: `gold` · text: `textOnGold` · font: 17px/600
- Active opacity: 0.85
- Used on: Get Started, Generate Coaching Cues, Let's Go, Done, Start 7-Day Free Trial

**btn-start** (Start Ride — highest emphasis)
- Height: 58px · same bg/text as btn-gold · font: 18px/700
- One instance in the app — PreRideBriefScreen footer

**btn-outline** (Secondary)
- Height: 52px · border: 1px `borderStrong` · border-radius: 999px
- Background: transparent · text: `textPrimary` · font: 17px/600

**btn-ghost** (Tertiary / destructive-adjacent)
- No background, no border · touch target min: 44pt
- Text: `textFaint` · font: 14–15px/500
- Used: "Skip", "Change goal mode", "I already have an account"

**btn-listen** (Outline gold)
- Height: 48px · background: `surface` · border: 1px `border` · border-radius: 999px
- Text: `gold` · font: 14px/600
- Used: "Listen to Debrief Again"

### Cards

**Surface card** — `surface` bg + `border` border + 12px radius + 14–20px padding

**Summary card** — same as surface but 16px radius + 20px padding (PreRideBrief, ConnectedScreen)

**Accent card** (PR / active segment)
- Background: `goldDim` · border: `goldBorderStrong` · 12px radius

**Map card** — `mapBg` base, route in `gold`, segment dots in `gold` (PR target) or `textSecondary`

**Metric card** (in SegmentActiveOverlay)
- Background: `surfaceDim` (#222222) · border: `borderSubtle` · 12px radius · 14px padding

### Tags & Badges

**PR tag** — `goldDim` bg, `goldBorder` border, `gold` text, 999px radius, 11px/600–700
- Used on ride cards in HomeScreen, segment result cards in PostRideSummary

**Off-PR tag** — `surfaceAlt` (#242424) bg, `borderMuted` border, `textMuted` text, 999px radius

**Goal badge** — `gold` bg, `textOnGold`, 999px radius, 12px/700, ALL CAPS

**Save badge** (paywall) — `gold` bg + `textOnGold`; muted variant: `surface` bg + `border` border + `textMuted` text

**Strava badge** — `stravaOrange` bg, white text/italic, 24px circle, 2px white border

**Time badge** (cue generation) — `surface` bg, `border` border, 999px, 12px `textMuted`

### Status Indicators

**GPS pill** — `surfaceElevated` (#1E1E1E) bg, `borderSubtle` border, green dot + "GPS" text 11px/600
- Dot color: `success` when locked, `error` when no signal

**Audio pill** — same base, `gold` ♪ character + "On" text `textSecondary` 11px/600

**Sync banner (success)** — `successDim` bg, `successBorder` border, `success` text 13px/500

**Sync banner (pending)** — `goldDim` bg, `goldBorder` border, `gold` text 13px/500

**Sync banner (failure)** [NEW] — `errorDim` bg, `errorBorder` border, `error` text 13px/500. Shows "Sync failed" for 4 seconds, then reverts to previous timestamp. Used on Home and Route Setup screens during pull-to-refresh failure.

**Cached cues banner** — same as sync pending

**Staleness label** [NEW] — 13px/500, `textMuted` (#555555). Displays "Updated Xh ago" below section headers when cached data is older than 30 minutes. Hidden during active refresh. `accessibilityLabel="Activities last updated X hours ago"`.

**Segment loading spinner** [NEW] — 12px `ActivityIndicator` in `gold`, size "small". Replaces the gold 8px dot on segment rows when `segment.polyline === null AND segment.effortCount > 0`. Cross-fades to gold dot when polyline arrives (150ms). `accessibilityLabel="Loading segment map data"`.

### Audio Waveform

5–6 bars, `gold` fill, 3–5px wide, 2–3px border-radius, varying heights 8–32px.
Used in: CueGenerationScreen icon, PreRideBriefScreen banner, DebitPlaying screen.
The waveform is an ambient indicator of audio activity — it should animate (heights pulse) when audio is actively playing. Static when paused.

### Segment Progress Bar

Track: `surface` · Fill: `gold` · Height: 4–6px · Border-radius: 999px · overflow: hidden

### Navigation

**Tab bar** — `bg` background, `borderMuted` top border, height: 83px
- paddingTop: 10, paddingBottom: 20 (accounts for home indicator clearance)
- Active label: `gold` 11px/600 · Inactive: `textDim` 11px/600
- Icon: 18px, focused: `gold`, unfocused: `textDim`

**Back button** — 44×44pt circle, `surface` bg, `borderStrong` border, `textPrimary` ← character

**Map nav bar** — LinearGradient overlay (dark-to-transparent over map), back btn + title floated over map

**Paywall close button** — 44×44pt circle, `surface` bg, `border` border, `textMuted` ✕ character

### Carousel Dots

Active: `gold` · 8×8pt circle · border-radius: 999px
Inactive: `textDim` · 6×6pt circle · border-radius: 999px

---

## Screen Definitions

### Flow 1 — Onboarding & Strava Connect

#### Screen 1 — Welcome

```
┌─────────────────────────────────────────┐
│  [hero-mtb.png fills entire screen]     │
│  [LinearGradient: transparent → #1C1C1E │
│   from 40% to 100%]                     │
│                                         │
│                                         │
│                                         │
│                                         │
│  ──────── content anchored to bottom ── │
│                                         │
│     S H E R P A A                       │
│     (32px/700, gold, letterSpacing:4,   │
│      textTransform:uppercase)           │
│                                         │
│  The only coach who was there last time.│
│     (14px/400, rgba(F0F0F0, 0.75),      │
│      textAlign:center)                  │
│                                         │
│  ┌──────── Get Started ────────────┐    │
│  │   btn-gold · 52px · 100%       │    │
│  └────────────────────────────────┘    │
│                                         │
│     I already have an account           │
│     (btn-ghost · 15px/500)              │
│                                         │
│  [safe area bottom: 48px]               │
└─────────────────────────────────────────┘
```

- Background container: `#D0D0D0` (base for hero image processing)
- Hero image: `resizeMode: 'cover'`, top offset 30px
- Gradient stops: rgba(28,28,30,0.1) at 0%, rgba(28,28,30,0.2) at 40%, rgba(28,28,30,0.92) at 78%, rgba(28,28,30,1) at 100%
- Content: paddingHorizontal: 24, paddingBottom: 48, justifyContent: flex-end

#### Screens 2–4 — Feature Carousel

```
┌─────────────────────────────────────────┐
│  [safe area top]                        │
│                              Skip       │
│                              (15px/500, │
│                               textMuted)│
│                                         │
│  ┌────────────────────────────────────┐ │
│  │         260×210 illustration      │ │
│  │         surface bg + border       │ │
│  │         borderRadius: 20          │ │
│  └────────────────────────────────────┘ │
│                                         │
│     Knows your history                  │
│     (26px/700, textPrimary,             │
│      letterSpacing: -0.5)               │
│                                         │
│  Every cue is built from your last 90   │
│  days on that segment — not a generic   │
│  script.                                │
│     (15px/400, #666666, lineHeight:24)  │
│                                         │
│  ●  ○  ○   (progress dots)             │
│                                         │
│  ─────────────────────────────────────  │
│  ┌────────── Next ──────────────────┐   │
│  │   btn-gold · 52px · 100%        │   │
│  └──────────────────────────────────┘   │
│  [paddingBottom: 48]                    │
└─────────────────────────────────────────┘
```

Carousel screens:
1. "Knows your history" — audio waveform illustration
2. "Ready before you roll" — pre-generation / offline illustration
3. "Your debrief, spoken" — spoken debrief illustration

Final slide CTA becomes "Connect Strava".

#### Screen: Strava Connected

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│         ┌────────────────────┐          │
│         │  72×72 avatar      │ [S]      │
│         │  gold bg, initials │ Strava   │
│         └────────────────────┘  badge   │
│                                         │
│          You're all set                 │
│          (24px/700, textPrimary,        │
│           letterSpacing: -0.4)          │
│                                         │
│          Jane Doe · Connected to Strava │
│          (14px/400, textMuted)          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ● Strava authentication    ✓   │    │
│  │ ● 12 segments found        ✓   │    │  ← [CHANGED] was "Segments fetched (12)"
│  │ ● Profile loaded           ✓   │    │
│  └─────────────────────────────────┘    │
│     surface card, 10px radius          │
│                                         │
│  [location warning banner if denied]   │
│                                         │
│  ┌──────────── Let's Go ───────────┐    │
│  │   btn-gold · 52px              │    │  ← [CHANGED] Enables after starred list
│  └────────────────────────────────┘    │     fetch (~2-3s). Does NOT wait for
│                                         │     segment detail fetches.
│                                         │
└─────────────────────────────────────────┘
```

Status dot colors: success = `success`, loading = `surfaceDim`, error = `error`, warning = `gold`

[NEW] **Post-onboarding background fetch:** After navigating from Connected to Home, the app begins a background lazy-fetch of segment details (polylines + elevation data). Fetches are throttled to 1 request per 2 seconds, sorted by `effort_count` descending (most-ridden segments first). No visible loading indicator on Home during this fetch. If the user navigates to Route Setup before the fetch completes, segments with missing polylines display the segment loading spinner (see Flow 2 State B).

#### Screen: Home (Empty State)

```
┌─────────────────────────────────────────┐
│ [safe area top]                         │
│                                         │  ← [NEW] RefreshControl on ScrollView
│  Good morning, Jane.       [J] avatar   │     tintColor: gold (#F5C842)
│  (20px/600, textPrimary)   (36×36, gold │     Pull triggers force segment sync
│                              bg)        │     + activity refresh (bypasses TTL)
│  12 starred segments · Last synced 2h ago
│  (13px, textMuted)                      │  ← [CHANGED] Sync label states below
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🚴 Plan Ride                   › │  │
│  │    Set route, choose goal,        │  │
│  │    generate cues                  │  │
│  └───────────────────────────────────┘  │
│     surface card, 12px, 20px padding   │
│                                         │
│  RECENT RIDES                           │
│  (11px/600, textDim, ALL CAPS,          │
│   letterSpacing: 1.2)                   │
│                                         │
│  Your rides will appear here after      │
│  your first Sherpaa session.            │
│  (14px, textDim, centered)              │
│                                         │
│  ─────────────────────────────────────  │
│  ⌂ Home  ◈ Segs  ◷ History  ⚙ Settings  │
│  (tab bar, 83px, gold active label)     │
└─────────────────────────────────────────┘
```

#### Screen: Home (With Rides)

Same as empty but rides list shows last 3 rides. Ride card: title + date row, then stats row with distance, segment count, and PR tag if applicable. PR tag uses gold accent system.

Quick Start card (when cues cached): `goldDim` bg + `goldBorder` border + "▶ Start Ride Now" in `gold` 16px/700.

[NEW] **Home screen sync behavior:**

- **RefreshControl:** Added to the main ScrollView. `tintColor: gold` (#F5C842). Pull-to-refresh forces both segment sync and activity refresh, bypassing all TTL checks.
- **Sync label transitions:** The "Last synced Xh ago" label (13px, `textMuted`) transitions through three states:
  - Idle: "Last synced Xh ago" — relative timestamp, `textMuted` (#555555)
  - Active: "Syncing..." — replaces timestamp during pull-to-refresh or background auto-sync, `textMuted` (#555555)
  - Success: "Just now" — displays on successful sync, `textMuted` (#555555). Reverts to relative timestamp as time passes.
- **Network failure:** On sync failure, label shows "Sync failed" in `error` (#E5484D) for 4 seconds, then reverts to previous timestamp (e.g., "Last synced 3h ago").
- **Background auto-sync:** On mount, if `lastStarredListFetchAt` is older than 24 hours, a silent background sync fires. No spinner shown — the sync label transitions to "Syncing..." and back. No layout changes.
- **No layout changes** to any existing Home screen elements.

**Transitions — Flow 1:**
- Welcome → Carousel: slide left, 300ms spring (tension: 100, friction: 20)
- Carousel → Carousel: slide left, 250ms spring; swipe right returns
- Carousel → OAuth: slide left, 300ms
- OAuth → Connected: fade, 200ms
- Connected → Home: slide left + fade overlay, 350ms spring

---

### Flow 2 — Route Setup & Pre-Ride Brief

#### Screen 6 — Route Setup

Split 50/50 vertical layout — map on top, panel on bottom. Panel has two states: **(A) Ride picker** before a ride is confirmed, **(B) Segments + goal** after confirmation. The map fills the top half via a WebView running Leaflet with CartoDB Dark Matter tiles (no Google Maps SDK — see tech note below).

**State A — Ride picker (default on entry):**

```
┌─────────────────────────────────────────┐
│  ┌────────────────────────────────────┐ │  ← pills overlay
│  │ ✦ Strava Route │ Import GPX │ Skip│ │    (absolute, insets.top + 8px)
│  └────────────────────────────────────┘ │    pill: 32px height, borderRadius 999
│                                         │
│    [Leaflet map — dark tiles]           │  ← map half (flex: 1)
│    [Gold polyline of previewed ride]    │    fitBounds padding:
│                                         │      topLeft = [24, insets.top + 56]
│                                         │      bottomRight = [24, 24]
├─────────────────────────────────────────┤  ← 1px borderStrong divider
│                                         │
│  Select a ride                          │  ← panel half (flex: 1)
│  (17px/700, textPrimary)                │
│  Updated 2h ago                         │  ← [NEW] staleness label
│  (13px/500, textMuted #555555)          │     Visible when cache >30min old
│                                         │     Hidden during active refresh
│  [previewed ride name] (12px, gold)     │     Hidden when previewing a ride
│                                         │
│  ┌─────────────────────────────────┐    │  ← [NEW] RefreshControl on this
│  │ Morning Climb to Grizzly    ›   │    │     ScrollView. Gold spinner.
│  │ Apr 9 · 42.1 km                 │    │     Bypasses 4h activity TTL.
│  └─────────────────────────────────┘    │    borderLeftWidth: 3, gold (selected)
│  ┌─────────────────────────────────┐    │    bg: rgba(245,200,66,0.06)
│  │ Paradise Loop recovery      ›   │    │  ← row (default)
│  │ Apr 7 · 28.4 km                 │    │
│  └─────────────────────────────────┘    │
│   [repeat — ScrollView, 10 max]         │
│                                         │
│  ┌─────── Use "Morning Climb…" ──────┐  │
│  │ btn-gold · 52px · disabled until  │  │
│  │ a ride is selected (opacity 0.35) │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**State B — Segments + goal (after confirmation):**

```
┌─────────────────────────────────────────┐
│  [pills overlay — same as State A]      │
│  [Leaflet map — gold polyline + gold    │  ← [CHANGED] Progressive map rendering:
│   circle markers at each matched        │     Gold circle markers at segment
│   segment start, radius 80m]            │     start_latlng render immediately
│                                         │     (from cached coords). Polyline
│                                         │     overlays render ONLY for segments
│                                         │     with cached polylines. Missing
│                                         │     polylines fade in via
│                                         │     injectJavaScript (200ms CSS
│                                         │     transition) as they are fetched.
│                                         │     Map does NOT re-fitBounds.
├─────────────────────────────────────────┤
│  4 segments on route      ← Change ride │
│  (17px/700)               (13px, gold)  │
│                                         │
│  ● Hawk Hill            2.4 km · 4:12  │  ← gold 8px dot (has polyline + history)
│    best time or "no history"    1.2 km │  ← distance-along-route
│  ◌ Paradise Loop        ...            │  ← [CHANGED] 12px ActivityIndicator
│                                         │     (gold, "small") when polyline is
│                                         │     NULL AND effortCount > 0.
│                                         │     Cross-fades to gold dot when
│                                         │     polyline arrives (150ms).
│  ○ Twin Peaks Blvd      (dimmed — no   │  ← dim dot: no history. Stays dim
│                          history)      │     regardless of polyline status.
│  [ScrollView — all matched segments]    │
│                                         │
│  GOAL FOR THIS RIDE                     │
│  (11px/600, textMuted, ALL CAPS)        │
│                                         │
│  [PR Attempt] [Training] [Recovery]     │
│                                         │
│  ┌──── Generate Coaching Cues ────┐     │
│  │   btn-gold · 52px              │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

**Style notes:**

- Root: `bg` background. Map half and panel half each `flex: 1`, separated by 1px `borderStrong` divider.
- Pills overlay sits over the map, padded by `insets.top + 8px`. Pill: 32px height, `borderRadius: 999`, `rgba(28,28,30,0.85)` bg, `borderStrong` border. Active pill: `gold` bg, `textOnGold` text 700-weight. No back button — user navigates via tab bar / system back.
- Ride row: 13px vertical padding, 1px bottom `border` divider, chevron (›) in `textDim`. Selected row: `borderLeftWidth: 3` in `gold`, `paddingLeft: 10` to compensate, bg `rgba(245,200,66,0.06)`, name color → `gold`. No check mark. The full row height picks up the gold left edge (must use `borderLeftWidth` on the row, not an absolute-positioned child — the latter does not span full row height reliably on Android).
- Segment row: 10px vertical padding, gold 8px dot for segments with history, `textDim` dot for no-history. [CHANGED] When `segment.polyline === null AND segment.effortCount > 0`: gold 8px dot is replaced with a 12px `ActivityIndicator` (gold, size "small"). Segments with no history keep the dim dot regardless of polyline status. When polyline arrives: spinner cross-fades to gold dot over 150ms.
- Goal chips: height 36px, `borderRadius: 10px`. Selected: `gold` bg, `textOnGold` text. Unselected: `surface` bg, `border` border.
- Primary CTA: 52px height, `borderRadius: 999` (pill), `gold` bg, `textOnGold` 16px/700. Disabled state: `opacity: 0.35`.

[NEW] **Route Setup — caching behavior:**

- **Activity list staleness label:** Below "Select a ride" header, displays "Updated Xh ago" in 13px/500 `textMuted` (#555555). Visible when activity cache is older than 30 minutes. Hidden during active refresh or when the user is previewing a ride (gold preview label takes precedence).
- **Activity list RefreshControl:** Gold spinner on the activity ScrollView. Pull-to-refresh bypasses the 4-hour activity TTL and forces a fresh fetch from Strava.
- **Activity list failure:** On refresh failure, staleness label shows "Sync failed" in `error` (#E5484D) for 4 seconds, then reverts to previous timestamp.
- **Activity empty state:** [CHANGED] "No recent rides with routes found." gains a second line: "Pull down to refresh." — shown when cache is empty AND network has failed.
- **Map progressive rendering:** Gold circle markers at segment `start_latlng` render immediately from cached coordinates. Polyline overlays render only for segments with cached polylines. As missing polylines are fetched in the background, overlays fade in via `injectJavaScript` with a 200ms CSS transition. The map does NOT call `fitBounds` again after initial render.
- **Rate limit during polyline fetch:** If Strava rate-limits during background polyline fetches, the spinner persists silently on affected segment rows. No error is shown to the user. Remaining fetches resolve on next app launch.
- **Generate Coaching Cues button:** Stays enabled regardless of polyline fetch status. Cue generation does not require polylines.

**Tech note — map rendering:**

The map is rendered via `react-native-webview` hosting Leaflet 1.9.4 with CartoDB Dark Matter tiles (`cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png`). **Not** `react-native-maps`. Rationale in `docs/test-reports/android-phase-1-report.md` — Google Maps SDK initializes and crashes on Android without an API key even with `mapType="none"`. The Leaflet approach is free, keyless, dark by default, and matches the app's aesthetic. Route data is injected into the WebView via `injectJavaScript`; the WebView posts a `'ready'` message once Leaflet loads and the React Native side queues route payloads until then.

#### Screen 7 — Cue Generation

```
┌─────────────────────────────────────────┐
│ [safe area top]                         │
│                                         │
│         ┌────────────────────────┐      │
│         │  80×80 waveform icon   │      │
│         │  goldDim bg            │      │
│         │  goldBorder border     │      │
│         │  borderRadius: 999     │      │
│         └────────────────────────┘      │
│                                         │
│   Preparing your coaching cues          │
│   (24px/700, textPrimary, centered)     │
│                                         │
│   Analysing your segment history…       │
│   (14px, textMuted, centered)           │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ [✓] Hawk Hill                   │   │
│  │     3 cue variants ready        │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ [↻] Paradise Loop   ← active    │   │
│  │     Generating cues…            │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ [·] Twin Peaks Blvd  ← pending  │   │
│  │     Waiting…                    │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  ~18 seconds remaining             │ │
│  └────────────────────────────────────┘ │
│     time badge: surface bg, border, 999px
│                                         │
│     Skip — start with available cues    │
│     (btn-ghost, textFaint, 15px/500)    │
│                                         │
└─────────────────────────────────────────┘
```

Done icon: 28×28 circle, `rgba(48,164,108,0.15)` bg, `success` ✓ 14px/700
Active icon: 28×28 circle, `rgba(245,200,66,0.15)` bg, spinner ring with `gold` top border
Pending icon: 28×28 circle, `#232323` bg, 6×6 dot `borderStrong`

Active segment item: `goldBorder` border on the card

Auto-advances when all done. No user action needed.

#### Screen 8 — Pre-Ride Brief

```
┌─────────────────────────────────────────┐
│ [safe area top]                         │
│ ←  (44×44 back)   Ready to Ride   Edit │
│    (surface, border) (17px/700)  (gold) │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  [PR ATTEMPT]    ♪ Playing brief…  ││  ← summary card (16px radius)
│  │   (goal badge)   (gold dot + text) ││
│  │                                     ││
│  │   4        2          24.8 km       ││
│  │  Segments  PR Targets  Route        ││
│  │  (22px/700) (11px/500 label below) ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│  ← spoken brief banner
│  │ [waveform] "Hawk Hill in 500m.      ││
│  │            You've faded in the      ││
│  │            final 400m three times…" ││
│  │  goldDim bg + goldBorder border     ││
│  │  italic text, rgba(F0F0F0, 0.75)    ││
│  └─────────────────────────────────────┘│
│                                         │
│  ON YOUR ROUTE                          │
│  (11px/600, textDim, ALL CAPS)          │
│                                         │
│  [1] Hawk Hill          [PR] tag        │
│      2.4 km · 3 cues · Best: 4:12      │
│  [2] Paradise Loop      [PR] tag        │
│  [3] Twin Peaks Blvd                   │
│      (dimmed 55% — no history)          │
│                                         │
│  ─── absolute footer ─────────────────  │
│  ┌──────────── ▶  Start Ride ─────────┐ │
│  │   btn-start · 58px · gold          │ │
│  └────────────────────────────────────┘ │
│  Change goal mode (btn-ghost, centered) │
│  [paddingBottom: 40]                    │
└─────────────────────────────────────────┘
```

Segments with no history: `opacity: 0.55`. Segment number: 24×24 circle, `borderStrong` bg, `textSecondary` text 12px/700.

**Transitions — Flow 2:**
- Home → Route Setup: slide left, 300ms
- Route Setup → Cue Generation: cross-fade, 200ms (map dissolves to solid)
- Cue Generation → Pre-Ride Brief: slide up, 350ms spring
- Pre-Ride Brief → In-Ride: full-screen fade to `bgDeep`, 400ms

---

### Flow 3 — In-Ride Experience

#### Screen 9 — In-Ride Active

```
┌─────────────────────────────────────────┐
│  1:04:22                    ● GPS  ♪ On │
│  (13px/600,textPrimary)    (11px pills) │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ NEXT SEGMENT        2.4 km away     ││  ← goldDim bg + goldBorder
│  │ Hawk Hill           (22px/700, gold)││
│  └─────────────────────────────────────┘│
│                                         │
│                  32                     │
│               (112px/800,               │
│                textPrimary,             │
│                letterSpacing: -6)       │
│                                         │
│               KM/H                      │
│          (16px/500, textMuted,          │
│           ALL CAPS, letterSpacing:1)    │
│                                         │
│     142    │    287    │    24.8         │
│     bpm    │   watts   │     km          │
│  (28px/700)│  (28px/700│  (28px/700)    │
│  (dividers: 1px, surfaceElevated, h:36) │
│                                         │
│                                         │
│           ■  End Ride                   │
│    (outline, border: border, 999px,     │
│     textMuted, 14px/600,               │
│     minHeight:44, absolute bottom:40)   │
└─────────────────────────────────────────┘
```

Background: `bgDeep` (#111111) — deepest available for OLED savings and maximum readability.
paddingTop: 54px (status bar clearance)
Status pills: `surfaceElevated` bg + `borderSubtle` border + 999px radius

"End Ride" is intentionally low-contrast — present but not distracting. Requires 2-second hold. Border uses `border` (#363636) for minimal but findable visibility.

**No interactive elements during ride except End Ride hold.**

#### Screen 10 — Segment Active Overlay

```
┌─────────────────────────────────────────┐
│  [InRideScreen at 25% opacity behind]   │
│                                         │
│  [tappable dismiss area — full height]  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ─────── handle (36×4, borderStrong) ││
│  │                                     ││
│  │  Hawk Hill                          ││
│  │  (20px/700, textPrimary,            ││
│  │   letterSpacing: -0.4)              ││
│  │                                     ││
│  │  ████████████░░░░░░░  (progress bar)││
│  │  Start       68%       Finish       ││
│  │              (gold, 11px/500)       ││
│  │                                     ││
│  │              2:46                   ││
│  │           (64px/800,                ││
│  │            textPrimary,             ││
│  │            letterSpacing: -3)       ││
│  │            Elapsed (12px/500, ALL)  ││
│  │                                     ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────┐││
│  │  │ −3s      │ │ 31 km/h │ │ 290w│││
│  │  │ vs PR    │ │         │ │     │││
│  │  │ (success)│ │         │ │     │││
│  │  └──────────┘ └──────────┘ └──────┘││
│  │   metric cards: surfaceDim bg,     ││
│  │   borderSubtle border, 12px radius ││
│  │                                     ││
│  │  [paddingBottom: 48]                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Sheet: `bgOverlay` (#1A1A1A) bg, 24px top radius, `borderSubtle` top border.
Gap display: ahead = `success` (#30A46C), behind = `error` (#E5484D).
Auto-dismisses at segment end — no button needed.
Update frequency: every 5 seconds.

#### Screen 11a — Segment Result (New PR)

```
┌─────────────────────────────────────────┐
│  [#111111 background]                   │
│  [goldGlow radial at center: 300×300,   │
│   rgba(245,200,66,0.12)]                │
│                                         │
│           🏆                            │
│        (52px emoji, centered)           │
│                                         │
│       HAWK HILL                         │
│  (15px/500, textMuted, ALL CAPS,        │
│   letterSpacing:1)                      │
│                                         │
│           4:08                          │
│     (80px/800, textPrimary,             │
│      letterSpacing: -4,                 │
│      fontVariant: tabular-nums)         │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │         NEW PR                  │   │
│   │   gold bg, textOnGold,          │   │
│   │   15px/800, letterSpacing: 0.5  │   │
│   └─────────────────────────────────┘   │
│                                         │
│        −4 seconds  (gold, 16px/500)     │
│                                         │
│                                         │
│     Tap anywhere · auto-dismiss in 4s   │
│     (13px/500, borderStrong #3A3A3A)    │
└─────────────────────────────────────────┘
```

Entire screen is a touchable — tap to dismiss early.
Auto-dismiss: 4 seconds.

#### Screen 11b — Segment Result (Off PR)

Same layout. No radial glow. `textSecondary` ✓ instead of trophy. Neutral badge: `surface` bg, `border` border, `textSecondary`. Gap label: `+Xs off PR` in `textMuted`. PR reference: `textMuted`.

**Transitions — Flow 3:**
- Screen 9 → 10: bottom sheet spring rise, 350ms (translateY: screenHeight → 0)
- Screen 10 → 9: sheet slides down, 250ms spring
- Screen 9 → 11: full-screen scale from center, 200ms (scale: 0.95 → 1.0 + fade)
- Screen 11 → 9: auto-return, fade, 300ms
- Screen 9 → End Ride: fade to `bgDeep`, 400ms

---

### Flow 4 — Post-Ride Debrief

#### Screen: Debrief Playing

```
┌─────────────────────────────────────────┐
│  [#111111 background]                   │
│  [goldGlow radial, 300×300, centered]   │
│                                         │
│                                         │
│         [audio waveform icon]           │
│         (same as CueGeneration,         │
│          animated — bars pulse)         │
│                                         │
│       Ride complete                     │
│  (24px/700, textPrimary, centered)      │
│                                         │
│  Playing your debrief…                  │
│  (14px, textMuted, centered)            │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ "Great ride. Hawk Hill in 4:08 —   ││
│  │  a new PR. You held your power     ││
│  │  through the false flat."          ││
│  │  italic, rgba(F0F0F0, 0.75)        ││
│  │  Key stats in gold                 ││
│  └─────────────────────────────────────┘│
│     surfaceElevated bg, borderSubtle   │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ 48.2 km  │ │ 2:14:07  │ │ 1 PR   │  │
│  └──────────┘ └──────────┘ └─────────┘  │
│     3 stat cards: surface bg           │
│                                         │
│  [auto-advances when debrief ends]      │
└─────────────────────────────────────────┘
```

#### Screen: Post-Ride Summary

```
┌─────────────────────────────────────────┐
│  [200px map strip — mapBg]              │
│  [route in gold, segment dots]          │
│  [LinearGradient bottom fade to bg]     │
│   APR 11                  [↑ share]     │
│   Morning Ride           (44×44 button) │
│                                         │
│  [🏆 1 New PR] Hawk Hill                │
│     gold badge + textSecondary name    │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │  48.2    │ │ 2:14:07  │ │ 820m   │  │
│  │  km      │ │ duration │ │ elev.  │  │
│  └──────────┘ └──────────┘ └─────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │  3/4     │ │  287     │ │  142   │  │
│  │ segments │ │ avg W    │ │ avg BPM│  │
│  └──────────┘ └──────────┘ └─────────┘  │
│     statVal: 22px/700  statLabel:11px  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ✓  Synced to Strava               ││
│  │    successDim bg + successBorder   ││
│  └─────────────────────────────────────┘│
│                                         │
│  SEGMENTS                               │
│  (11px/600, textDim, ALL CAPS)          │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Hawk Hill             4:08    [PR] ││  ← PR card: goldBorderStrong
│  │ PR: 4:12              gold text    ││     goldDim bg
│  │ 🏆 NEW PR · −4s                   ││
│  └─────────────────────────────────────┘│
│                                         │
│  [♪  Listen to Debrief Again]           │
│     btn-listen: surface bg, 48px       │
│                                         │
│  ┌──────────────── Done ──────────────┐  │
│  │   btn-gold · 54px                 │  │
│  └────────────────────────────────────┘  │
│  [paddingBottom: 40]                    │
└─────────────────────────────────────────┘
```

Expanded segment card: splits area appears below segment bottom. Split bars: PR in `textDim` (#444444), today in `gold`. Coaching cue review: `rgba(245,200,66,0.06)` bg, `rgba(245,200,66,0.15)` border, 8px radius.

**Transitions — Flow 4:**
- In-Ride → Debrief Playing: fade through `bgDeep`, 500ms
- Debrief Playing → Summary: cross-fade, 300ms
- Segment card expand: spring scale in-place, 250ms
- Summary → Home: slide right (dismissal), 300ms

---

### Flow 5 — Subscription Upgrade

#### Screen: Mid-Ride Gate

```
┌─────────────────────────────────────────┐
│  [InRideScreen at 25% opacity behind]   │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ─── handle ────────────────────    ││
│  │                                     ││
│  │  🔒  Segment 4 of 4                 ││
│  │  Unlock to coach this one           ││
│  │                                     ││
│  │  • Full PR split coaching          ││  ← gold ✓ for bullets
│  │  • Heart rate zone guidance         ││
│  │  • Post-ride spoken debrief         ││
│  │                                     ││
│  │  ┌── Unlock Pro — 7 Days Free ────┐ ││
│  │  │   btn-gold · 52px             │ ││
│  │  └───────────────────────────────┘ ││
│  │                                     ││
│  │   Skip this segment (btn-ghost)     ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Triggered after segment result dismisses. Never mid-segment. No dark patterns. Not shown again for 48 hours after dismissal.

#### Screen: Full Paywall

```
┌─────────────────────────────────────────┐
│ [safe area top]                         │
│ [✕] (44×44)             Restore Purchases│
│  surface bg, border     (13px/500,textDim)
│                                         │
│  Unlock your full                       │
│  segment coach                          │
│  (26px/800, textPrimary/gold,           │
│   textAlign:center, letterSpacing:-0.6) │
│                                         │
│  7-day free trial. Cancel anytime.      │
│  (14px, textMuted, centered)            │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │       │ Free  │  Pro  │ Elite   │   │
│  │───────────────────────────────────│   │
│  │Segments│ 3/ride│ Unlim │ Unlim  │   │
│  │PR cues │  ✕   │  ✓   │  ✓    │   │
│  │Splits  │  ✕   │  ✓   │  ✓    │   │
│  │...     │      │       │        │   │
│  └──────────────────────────────────┘   │
│     table: borderSubtle border,        │
│     14px radius, overflow:hidden       │
│     alt rows: surfaceAlt (#242424)     │
│     header row: surfaceAlt bg          │
│                                         │
│  [Pro · Annual    $59/yr  [Save 30%] ○]│  ← selected: goldDim + goldBorder 1.5px
│  [Pro · Monthly   $6.99/mo           ○]│  ← unselected: surfaceAlt + borderMuted
│  [Elite · Annual  $99/yr  [Save 37%] ○]│
│  [Elite · Monthly $12.99/mo          ○]│
│     plan options: 12px radius, 16px px │
│                                         │
│  ┌────── Start 7-Day Free Trial ──────┐  │
│  │   btn-gold · 54px · 17px/700      │  │
│  └────────────────────────────────────┘  │
│                                         │
│  After trial, billed at selected rate.  │
│  (11px, textMuted, centered)            │
│  Cancel in iOS Settings → Subscriptions │
└─────────────────────────────────────────┘
```

Pro column header in `gold`. Elite column header in `textPrimary`. Save badge: `gold` bg when that plan is selected, `surface` bg when not.

#### Screen: Subscription Success

```
┌─────────────────────────────────────────┐
│  [#111111 background + goldGlow radial] │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │          🏆                        │ │
│  │   (88×88 wrapper, goldDim bg,      │ │
│  │    goldBorder border, 999px)       │ │
│  └────────────────────────────────────┘ │
│                                         │
│       You're on Pro                     │
│  (28px/700, textPrimary, centered)      │
│                                         │
│  Trial active · 7 days free             │
│  (14px, textMuted, centered)            │
│                                         │
│  ✓ Unlimited coached segments           │
│  ✓ Full PR split coaching               │
│  ✓ Heart rate zone guidance             │
│  ✓ Post-ride spoken debrief             │
│  ✓ Pacing model improves each ride      │
│  (gold ✓ prefix, 15px/500, textPrimary) │
│                                         │
│  ┌────────── Continue Ride ───────────┐  │
│  │   btn-gold · 52px                 │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Transitions — Flow 5:**
- Gate appears: bottom sheet spring rise, 300ms
- Gate → Full Paywall: slide up full-screen, 350ms spring
- Paywall → StoreKit: iOS native presentation (no control)
- StoreKit → Success: slide up, 400ms spring
- Success → prior context: cross-fade, 300ms

---

## Transition & Animation Catalogue

| Transition | Animation | Duration | Curve |
|---|---|---|---|
| Push navigation (default) | Slide left | 300ms | Spring: tension 100, friction 20 |
| Pop navigation | Slide right | 250ms | Spring |
| Modal present (paywall, ride) | Slide up | 350ms | Spring |
| Modal dismiss | Slide down | 250ms | Spring |
| Bottom sheet rise | Spring from bottom | 300–350ms | Spring: tension 80, friction 18 |
| Bottom sheet dismiss | Spring to bottom | 250ms | Spring |
| Full-screen flash (segment result) | Scale 0.95→1.0 + fade in | 200ms | Ease-out |
| Segment result auto-dismiss | Fade out | 300ms | Ease-in |
| Ride start | Fade to #111111 | 400ms | Ease-in |
| End-ride confirmation | Fade to #111111 | 400ms | Ease-in |
| Debrief to summary | Cross-fade | 300ms | Ease-in-out |
| Card expand (splits) | Spring scale in-place | 250ms | Spring |
| Error state shake | Horizontal spring ±8px | 300ms | Spring |
| Waveform animation | Bar heights pulse | Continuous, staggered | Sine wave |
| Spinner (cue generation) | Rotation | Continuous, 800ms/cycle | Linear |
| OAuth → Connected | Fade | 200ms | Ease-in-out |
| Welcome → Carousel | Slide left + fade | 300ms | Spring |
| [NEW] Segment spinner → dot | Cross-fade (opacity) | 150ms | Ease-in-out |
| [NEW] Map polyline fade-in | CSS opacity transition | 200ms | Ease-in-out |
| [NEW] Sync failed → timestamp | Text swap | 4000ms hold then instant | — |
| [NEW] RefreshControl spinner | Platform-native pull | Platform-native | Spring |

**Motion principles:**
- Springs feel physical — use spring curves wherever possible
- No animation over 500ms — cycling app context demands immediacy
- Auto-dismiss animations (segment result) are fade-out, never dramatic
- Haptic feedback accompanies all significant transitions (see Haptics table)

---

## Accessibility

**Touch targets:** 44×44pt minimum on every interactive element — enforced.

**Color contrast:**
- `textPrimary` (#F0F0F0) on `bg` (#1C1C1E) = 12.6:1 — WCAG AAA
- `gold` (#F5C842) on `bgDeep` (#111111) = 10.5:1 — WCAG AAA
- `textSecondary` (#888888) on `bg` (#1C1C1E) = 4.2:1 — WCAG AA
- `textMuted` (#555555) on `bg` (#1C1C1E) = 2.6:1 — decorative/metadata use only; paired with larger, higher-contrast labels nearby
- `textOnGold` (#000000) on `gold` (#F5C842) = 10.5:1 — WCAG AAA

**Font sizes:** 11px minimum system-wide. No exceptions.

**VoiceOver:**
- All icons and Unicode characters require `accessibilityLabel`
- Audio cues play in a separate AVAudioSession so they don't interrupt VoiceOver narration
- Segment result screens auto-announce with VoiceOver when they appear

**Dynamic Type:**
- Body text uses `fontSize` with system font — scales with user preferences
- Display/Hero sizes (80px, 112px) do not scale — fixed for glanceability
- All other text should respond to accessibility size increases

**In-ride safety:**
- During active ride, interactive elements are limited to End Ride (hold gesture, not tap)
- Avoid any push notification or alert that would interrupt the riding audio session
- Segment overlays auto-dismiss — rider does not need to interact to resume

**End Ride hold gesture:**
- 2-second hold threshold
- Haptic at 1-second midpoint (medium impact) and at completion (heavy impact)
- Visual: border pulses gold during hold — subtle progress indication without distraction

[NEW] **Caching-related accessibility:**
- Staleness label (Route Setup): `accessibilityLabel="Activities last updated X hours ago"`
- Segment loading spinner: `accessibilityLabel="Loading segment map data"`
- Segment row with spinner: full row `accessibilityLabel` includes loading state, e.g., "Paradise Loop, 3.1 kilometers, loading map data"
- RefreshControl on Home and Route Setup: uses platform-native VoiceOver (iOS) and TalkBack (Android) support — no custom `accessibilityLabel` needed
- Sync failure label: announce "Sync failed" via `accessibilityLiveRegion="polite"` on Android / `UIAccessibility.post(.announcement)` on iOS

---

## Design Issues Found But Not Fixable in This Pass

The following issues require new components or platform capabilities not yet implemented:

1. **Tab bar icons are Unicode characters, not proper icons.** The current `⌂`, `◈`, `◷`, `⚙` symbols are functional but do not scale correctly at all text sizes and lack proper SF Symbols weight matching. Should be replaced with SF Symbols (via react-native-sfSymbols or similar) or a custom icon component library. This is a known limitation of the current stack with no available npm package to add.

2. **HomeScreen.tsx contains a duplicate mocked tab bar** that is visually present in the component but the real tab bar is rendered by `MainTabs.tsx`. The mock tab bar in HomeScreen.tsx should be removed once the screen is wired into the navigator — keeping both creates inconsistent visual state during development. The mock is marked with a TODO but not yet removed.

3. **Radial glow on PR result screen and Debrief screen** is implemented as a plain `View` with a circular background. A true radial gradient requires `expo-linear-gradient` with multiple stops or `react-native-svg`. The current implementation is an approximation; the real glow effect should use SVG radial gradient when that pass occurs.

4. **Waveform animation** is not yet animated — bars are static. Requires `Reanimated` with staggered sine-wave interpolation. Marked as TODO in CueGenerationScreen.tsx.

5. **Spinner in CueGenerationScreen** is not rotating. Requires `Reanimated` rotation animation. Marked as TODO.

6. **Split bar widths in PostRideSummaryScreen** are hardcoded at 72% and 70% as placeholders. These need to be driven by real split data proportionally. Marked as TODO.

7. **The `gap: 10` spacing value** appears in a few places (SegmentActiveOverlay, HomeScreen). Our system uses 8 or 12 — should be normalized in a future pass. These are minor inconsistencies, not bugs.

8. **No DebitPlaying screen component exists** — the DesignSpec describes it but it has not been built yet. This is a significant missing screen in Flow 4.

9. **No mid-ride gate component exists** — Flow 5's first screen (the paywall gate that appears after a segment result) is defined in the spec but not implemented as a component.
