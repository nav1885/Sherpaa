# Sherpaa — Design Specification
*Approved across 5 flows · April 2026*

---

## Design System Tokens

### Colors

```
// Backgrounds
bg-primary:     #1C1C1E   // Main screen background (iOS dark mode base)
bg-deep:        #111111   // In-ride and debrief screens (maximum contrast)
bg-surface:     #2A2A2A   // Cards, list items, sheets
bg-surface-alt: #242424   // Alternate rows, condensed cards
bg-overlay:     #1A1A1A   // Canvas / page background

// Borders
border-subtle:  #2E2E2E   // Light separation
border-default: #363636   // Cards and inputs
border-strong:  #3A3A3A   // Buttons, active elements

// Accent — Gold
accent:         #F5C842   // Primary CTA, active states, PR highlights
accent-dim:     rgba(245,200,66,0.1)   // Tinted backgrounds
accent-border:  rgba(245,200,66,0.2)   // Tinted borders
accent-border-strong: rgba(245,200,66,0.3)

// Text
text-primary:   #F0F0F0   // Headings, primary content
text-secondary: #888888   // Supporting labels
text-muted:     #555555   // Metadata, timestamps
text-faint:     #444444   // Section labels, inactive states

// Status
success:        #30A46C   // GPS lock, sync confirmed, ahead of PR
error:          #E5484D   // OAuth fail, payment fail
strava-orange:  #FC4C02   // Strava branding only (badge)

// Map
map-bg:         #1A2030   // Simulated map base
map-road:       #243040   // Road lines on map
```

### Typography

| Role | Size | Weight | Usage |
|---|---|---|---|
| Display | 112px | 800 | In-ride speed readout |
| Hero | 80px | 800 | Segment result time |
| Title XL | 28px | 700–800 | Screen headlines, paywall |
| Title L | 24px | 700 | Flow titles, debrief |
| Title M | 20px | 700 | Card titles, segment names |
| Body L | 17px | 600 | Primary CTAs |
| Body M | 15px | 400–600 | Body text, list items |
| Body S | 14px | 400–500 | Supporting text, descriptions |
| Label | 12px | 500–600 | Metadata, tags |
| Caption | 11px | 500–600 | Section headers (uppercase), badges |
| Micro | 10px | 500–600 | Stat labels (uppercase) |

Font: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text'`
All numbers: `font-variant-numeric: tabular-nums`

### Spacing Scale

`4 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64`

Standard screen padding: `20px` horizontal  
Card internal padding: `14–20px`  
Section gap: `8–12px` between cards  
Bottom safe area: `40–48px`

### Border Radius

| Element | Radius |
|---|---|
| Pills / tags / avatars | 999px |
| Primary CTA buttons | 999px |
| Cards / list items | 12px |
| Bottom sheets | 24px top corners |
| Feature table | 14px |
| Small chips / badges | 10px |
| Icon wrappers | 999px |

### Shadows

Avoid decorative shadows. Phone frame only:
`0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px #2A2A2A`

### Haptics

| Event | Haptic Type |
|---|---|
| Segment geofence trigger | Medium impact |
| New PR | Heavy impact + success notification |
| Button tap (primary CTA) | Light impact |
| Error state | Error notification |
| Paywall dismiss | Light impact |

---

## Component Inventory

### Buttons

**btn-gold** (Primary CTA)
- Height: 52–54px · Border-radius: 999px
- Background: `#F5C842` · Text: `#000000` · Font: 17px/600
- Used: Get Started, Generate Coaching Cues, Start Ride, btn-trial

**btn-outline** (Secondary)
- Height: 52px · Border: 1px `#3A3A3A` · Border-radius: 999px
- Background: transparent · Text: `#F0F0F0` · Font: 17px/600

**btn-ghost** (Tertiary)
- No background, no border
- Text: `rgba(240,240,240,0.4–0.5)` · Font: 14–15px/500

**btn-start** (Start Ride — extra emphasis)
- Height: 58px · Font: 18px/700

### Cards

**Surface card** — `bg-surface` + `border-default` + `border-radius: 12px` + `padding: 14–20px`

**Accent card** (PR / active segment)
- Background: `accent-dim` · Border: `accent-border-strong`

**Map card** — dark map base `#1A2030`, route in `#F5C842`, segment dots in accent or `#888888`

### Tags & Badges

**PR tag** — `accent-dim` bg, `accent-border` border, `#F5C842` text, 999px radius, 11–12px/600–700

**Off-PR tag** — `#242424` bg, `#333333` border, `#555555` text

**Goal badge** — `#F5C842` bg, `#000000` text, 999px, 12px/700, uppercase

**Save badge** — same as goal badge; muted variant for unselected plans

**Strava badge** — `#FC4C02` bg, white text, 24px circle

### Status Indicators

**GPS pill** — `#1E1E1E` bg, `#2A2A2A` border, green dot + "GPS" text
**Audio pill** — same base, gold ♪ icon + "On" text
**Sync banner** — `rgba(48,164,108,0.08)` bg, green border, green text
**Cached cues banner** — amber tint, warning message

### Audio Waveform

5–6 bars, `#F5C842`, `border-radius: 2–3px`, varying heights (8–32px range), displayed in: debrief playing, pre-ride brief, spoken brief preview card

### Segment Progress Bar
Track: `#2A2A2A` · Fill: `#F5C842` · Height: 4–6px · Border-radius: 999px

### Navigation

**Tab bar** — `bg-primary`, `border-top: 1px #333333`, height: 83px
Active: `#F5C842` label · Inactive: `#444444` label + 35% opacity icon

**Back button** — 36px circle, `#2A2A2A` bg, `#3A3A3A` border, `#F0F0F0` ←

**Map nav bar** — gradient overlay (dark-to-transparent), back btn + title floated over map

---

## Screen Definitions

### Flow 1 — Onboarding & Strava Connect

#### Screen 1 — Welcome
- Full-screen hero: `hero-mtb.png` with `mix-blend-mode: multiply` on `#D0D0D0` bg
- Gradient overlay fades to `#1C1C1E` at bottom (60% point, fully opaque at bottom)
- Bottom content: gold "Sherpaa" logotype (32px/700, letter-spacing 4px), tagline, btn-gold, btn-ghost
- Tagline: "The only coach who was there last time." · 14px/400 · `rgba(240,240,240,0.75)`

#### Screens 2–4 — Feature Carousel
- Background: `bg-primary`
- Illustration card: 260×210px, `bg-surface`, `border-default`, 20px radius
- Progress dots: active `#F5C842` 8px, inactive `#444444` 6px
- Headlines: 26px/700 · Body: 15px/400 `#666666`
- Skip link top-right: 15px/500 `#555555`
- Next CTA: btn-gold full width

**Carousel screens:**
1. "Knows your history" — audio waveform illustration
2. "Cues ready before you roll" — pre-generation illustration
3. "Your debrief, spoken" — spoken debrief illustration

#### Screen: OAuth Error
- Error icon (red circle, ✕), 24px/700 heading, 15px/400 body, btn-gold "Try Again", btn-ghost "Skip for now"

#### Screen: Location Rationale
- Icon, 24px/700 heading, 15px body explaining "While Using" → "Always" upgrade at ride start
- btn-gold "Allow Location", btn-ghost "Skip"

#### Screen: Strava Connected
- Avatar with Strava badge overlay
- Status card: success lines (✓ green) for Auth + Segments + Profile
- Heading: "You're all set" · btn-gold "Let's Go"

#### Screen: Location Denied Variant
- Same as Connected but location line shows as amber warning
- Additional "Enable in Settings →" text link

#### Screen: Home (Empty State)
- Greeting: 20px/600 · Sync status: 13px `#555555`
- Segment summary chip: "12 starred segments · Last synced just now"
- Plan Ride card: full-width, `bg-surface`, gold chevron
- Empty rides area: "Your rides will appear here after your first session."
- Tab bar: Home (active/gold), Segments, History, Settings

#### Screen: Home (With Rides)
- Same as empty but rides list shows last 3 rides as cards
- Ride card: title, date, distance, segment count, PR tag if applicable

**Transitions — Flow 1:**
- Welcome → Carousel: slide left, 300ms spring
- Carousel → Carousel: slide left, 250ms spring; swipe right to go back
- Carousel → Strava OAuth: slide left, 300ms
- OAuth → Connected/Error: fade, 200ms
- Connected → Home: slide left + fade, 350ms

---

### Flow 2 — Route Setup & Pre-Ride Brief

#### Screen 6 — Route Setup
- Full-screen dark map (`#1A2030`) with route polyline in `#F5C842`
- Route method pills (absolute, top 108px): Strava Route (active/gold) · Import GPX · Skip
- Bottom sheet (24px radius, `bg-primary`, `border-subtle` top border):
  - Segment count + PR targets badge
  - Segment mini-list (4 items max visible)
  - Goal chips: PR Attempt · Training (default) · Recovery
  - btn-gold "Generate Coaching Cues"

**Segment matching threshold:** 25m proximity from route polyline
**Unridden segments:** shown with "No history yet" label in `#444444`, dot in `#444444`

#### Screen 7 — Cue Generation Progress
- Centered layout: waveform icon → title → subtitle
- Progress list: done (green ✓), active (gold spinner), pending (grey dot)
- Time remaining badge: `bg-surface`, `border-default`, 999px, 12px `#555555`
- btn-ghost "Skip — start with available cues" at bottom

**Auto-advances** when all cues complete. No user action required.

#### Screen 8 — Pre-Ride Brief
- Nav bar: back btn, "Ready to Ride" title, "Edit" link (gold)
- Summary card: goal badge + "Playing brief…" audio indicator + 3-stat row (segments, PR targets, route km)
- Spoken brief banner: waveform + italic preview text with gold highlights
- Segment list in ride order (numbered)
- Footer: btn-start "▶ Start Ride" + btn-ghost "Change goal mode"

**Start Ride unlocked from Home when:** ≥1 starred segment cached AND cues not stale (< 30 days)

**Transitions — Flow 2:**
- Home → Route Setup: slide left, 300ms
- Route Setup → Cue Generation: cross-fade, 200ms (map dissolves)
- Cue Generation → Pre-Ride Brief: slide up, 350ms spring
- Pre-Ride Brief → In-Ride: full-screen transition, 400ms fade to black

---

### Flow 3 — In-Ride Experience

#### Screen 9 — In-Ride (Active)
- Background: `#111111` (deepest — battery conservation + max contrast)
- Status bar: elapsed time (left) + GPS pill + audio pill (right)
- Next segment pill: `accent-dim` bg, segment name + distance in km
- Speed: 112px/800 center dominant element
- Secondary metrics: HR (bpm) · Power (watts) · Distance (km) at 28px/700
- End Ride: small, bottom-center, outline style, requires 2-second hold (not designed here — implemented in code)

**No interactive elements during ride except End Ride hold**

#### Screen 10 — Segment Active Overlay
- Bottom sheet slides up from Screen 9 (spring, 350ms)
- Behind: ride screen dimmed to 25% opacity
- Sheet contents: segment name, progress bar (gold fill), elapsed time (64px/800), gap to PR (green if ahead, red if behind), speed + watts cards
- Auto-dismisses at segment end

**Gap display:** negative = ahead (green), positive = behind (red)
**Update frequency:** every 5 seconds

#### Screen 11a — Segment Result (New PR)
- Full-screen: `#111111` bg + radial gold glow
- Trophy emoji (52px) + segment name + big time (80px/800) + "NEW PR" gold badge + gap in gold
- Auto-dismisses in 4 seconds; tap anywhere to dismiss early

#### Screen 11b — Segment Result (Off PR)
- Same layout, no glow, checkmark instead of trophy
- Neutral grey badge "+Xs off PR" · PR reference in `#555555`

**Transitions — Flow 3:**
- Screen 9 → 10: bottom sheet spring rise, 350ms
- Screen 10 → 9: sheet slides down, 250ms
- Screen 9 → 11: full-screen flash (scale up from center), 200ms
- Screen 11 → 9: auto-return, fade, 300ms
- Screen 9 → End Ride: fade to black, 400ms

---

### Flow 4 — Post-Ride Debrief

#### Screen: Debrief Playing
- Background: `#111111` + subtle radial gold glow
- Centered: waveform icon, "Ride complete" title, "Playing your debrief…" subtitle
- Debrief quote card: `#1E1E1E` bg, italic text with gold highlights for key callouts
- Stats row (3 cards): distance · time · PR count
- Auto-advances when debrief audio finishes (~25–40 seconds)

#### Screen: Post-Ride Summary
- Map strip (200px): ride track in gold, segment dots, gradient overlay at bottom
- Nav overlay: date + ride name (left), share button (right)
- PR headline badge: "🏆 1 New PR · [Segment Name]"
- 6-stat grid (2 rows × 3): distance, duration, elevation, segments hit, avg watts, avg HR
- Strava sync banner (green): "✓ Synced to Strava" — or pending state with retry note
- Segment result cards: PR card (gold border + tint), standard (grey), skipped (dimmed 50%)
- "♪ Listen to Debrief Again" — outline gold link
- "Done" btn-gold → Home

#### Screen: Summary with Expanded Segment
- Segment card expands in-place (tap to expand/collapse)
- Split comparison bars: PR (grey, 70% base) vs Today (gold overlay)
- 4 checkpoints: 25% / 50% / 75% / End — each showing ±seconds vs PR
- Coaching cue review card: gold-tinted, shows exact cue text that was played

**Transitions — Flow 4:**
- In-Ride → Debrief Playing: fade through black, 500ms (end of ride)
- Debrief Playing → Summary: cross-fade, 300ms
- Segment card expand: spring scale, 250ms
- Summary → Home: slide right (dismissal), 300ms

---

### Flow 5 — Subscription Upgrade

#### Screen: Mid-Ride Gate
- Triggered after segment result dismisses — never mid-segment
- Ride screen behind at 25% opacity
- Bottom sheet: lock icon, segment name in bold, 3 feature bullets with gold checkmarks
- btn-gold "Unlock Pro — 7 Days Free"
- btn-ghost "Skip this segment"

#### Screen: Full Paywall
- Dismissible: ✕ top-left, "Restore Purchases" top-right
- Headline: "Unlock your full segment coach" with "segment coach" in gold
- Subtitle: "7-day free trial. Cancel anytime in Settings."
- Feature table: 3 columns (Free / Pro / Elite), alternating row backgrounds
- Plan options (stacked): Pro Annual (default/gold border), Pro Monthly, Elite Annual, Elite Monthly
- Pro Annual shows "Save 30%" badge in gold
- btn-trial "Start 7-Day Free Trial"
- Terms: 11px, `#3A3A3A`, cancel instructions visible

**No dark patterns.** Paywall not shown again for 48 hours after dismissal.

#### Screen: Subscription Success
- Background: `#111111` + gold glow
- Trophy icon (88px wrapper), "You're on Pro", "Trial active · 7 days free"
- Feature list: 5 items with gold checkmarks
- "Continue Ride" btn-gold — returns to exact pre-paywall context

**Transitions — Flow 5:**
- Gate appears: bottom sheet spring rise, 300ms
- Gate → Paywall: slide up full-screen, 350ms
- Paywall → StoreKit: iOS native (no control)
- StoreKit → Success: slide up, 400ms spring
- Success → prior context: cross-fade, 300ms

---

## Accessibility

- Minimum touch target: 44×44pt on all interactive elements
- Color contrast: `#F0F0F0` on `#1C1C1E` = 12.6:1 ✓ · Gold `#F5C842` on black = 10.5:1 ✓
- All icons paired with text labels or `accessibilityLabel`
- Audio cues compatible with VoiceOver (AVSpeechSynthesizer uses separate audio session)
- Dynamic Type: body text uses system font, scales with user font size settings
- "End Ride" hold gesture: 2-second threshold confirmed in haptic feedback

---

## Transition & Animation Catalogue

| Transition | Animation | Duration |
|---|---|---|
| Push navigation (default) | Slide left | 300ms spring |
| Modal present | Slide up | 350ms spring |
| Modal dismiss | Slide down | 250ms spring |
| Bottom sheet rise | Spring from bottom | 300–350ms |
| Bottom sheet dismiss | Spring to bottom | 250ms |
| Full-screen flash (segment result) | Scale from center | 200ms |
| Ride start | Fade to black | 400ms |
| Debrief to summary | Cross-fade | 300ms |
| Card expand | Spring scale in-place | 250ms |
| Error shake | Horizontal spring | 300ms |
