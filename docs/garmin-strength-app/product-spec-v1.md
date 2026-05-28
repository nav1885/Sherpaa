# StrongLog — Product Spec (v1)

A Connect IQ app for Garmin fenix that makes logging strength workouts on
the watch genuinely fast: pick a body part, pick an exercise, the watch
counts your reps, you confirm and move on.

---

## 1. Vision

> The strength training app that takes your eyes off the screen and your
> hands off the phone. You walk up to the rack, tap your exercise, lift,
> and the watch handles the rest.

Garmin's native strength activity counts reps unreliably across one flat
list of generic exercises, with no concept of "what did I lift last
time." StrongLog fixes the three things that matter for a single set:
**fast exercise selection, accurate rep counting, frictionless weight
logging.**

## 2. Target user

A recreational-to-serious lifter who trains 2–5×/week, owns a fenix, and
currently either ignores Garmin's strength tracking or uses a phone app
between sets. They are not a competitive powerlifter — they don't need
1RM percentage charts. They want to **know what they did last time** and
**not poke at their phone in the gym.**

## 3. Scope

### In scope (v1)
- Custom activity profile: "StrongLog" (saved as FIT strength activity)
- Body-part → exercise navigation with **recents** and **favorites** at top
- Per-exercise auto rep counting via accelerometer
- Optional weight entry per set (kg/lb, with one-tap "use last weight")
- Auto-detected set end with manual rep correction screen
- Auto-starting rest timer with vibration cues
- Session summary screen at end (total sets, reps, volume, duration)
- Watch-side history: last weight × reps per exercise, last 30 sessions
- Imperial / metric toggle
- One curated exercise library (~40 exercises across 8 body parts)

### Out of scope (v1 — deferred)
- Programming / templates (5/3/1, PPL, etc.) → **v1.2**
- RPE logging → **v1.1**
- Plate calculator → **v1.1**
- Custom user-defined exercises → **v1.2**
- Connect IQ Mobile companion / phone-side history → **v2**
- Cross-session analytics (volume trends, PR detection) → **v2**
- Apple Health / Strava export → **v2**
- Subscription tier → **v2** (if at all)

### Explicit non-goals
- We are not building a coaching app. No form cues, no "you should rest
  longer," no auto-prescribed weights.
- We are not building a social app.

## 4. Core user flow

```
[Launch]
    ↓
[Home: Recent exercises + Browse]
    ↓
[Exercise picked]
    ↓
[Set in progress — auto rep count]
    ↓ (auto-detect set end OR user taps Done)
[Confirm reps + enter weight]
    ↓
[Rest timer running]
    ↓
   (loop: same exercise → next set, OR back to Home → different exercise)
    ↓
[End workout — long-press]
    ↓
[Summary screen]
    ↓
[Save FIT activity]
```

**Target time from "rack approached" to "lifting":** under 4 seconds for
a recent exercise (2 taps), under 8 seconds for a new exercise (3 taps).

## 5. Screen-by-screen spec

### 5.1 Home screen
- Top half: **3 recent/favorite exercises** as one-tap chips
  - Sorted by frequency × recency
  - Each shows exercise name + "last: 8 × 135"
- Bottom half:
  - **Browse** → opens body-part grid
  - **End Workout** (only visible if a session is active)

### 5.2 Body-part grid
- 8 chips in a 2×4 grid:
  Chest · Back · Shoulders · Arms · Legs · Glutes · Core · Cardio-Strength
- Tap → exercise list for that part

### 5.3 Exercise list
- Scrollable list of ~5–8 exercises per body part
- Each item: name + last-used summary (e.g. "Bench Press · 5×185 last
  Tue")
- Tap → starts a set

### 5.4 In-set screen (the hero screen)
Layout (round display, AMOLED-optimized, black background):

```
┌────────────────────────┐
│      BENCH PRESS       │  ← exercise name, small, top
│                        │
│         8              │  ← LIVE rep count, huge (~140pt)
│                        │
│         185            │  ← weight from last set, medium
│                        │
│      00:42             │  ← elapsed set time, small
│                        │
│      [tap to end]      │  ← affordance hint
└────────────────────────┘
```

- Rep count updates in real time as detection fires
- Vibration confirmation on each detected rep (configurable: off / light / strong)
- Backlight on during set (configurable timeout)
- Tap anywhere or long-press to end set → goes to confirm screen
- Auto-end after 5s of no rep-like motion + 5s grace countdown
  ("Ending set... tap to keep lifting")

### 5.5 Confirm set screen
```
┌────────────────────────┐
│   Reps:    [ - 8 + ]   │
│                        │
│   Weight:  [ - 185 + ] │
│            (last: 185) │
│                        │
│         [ Save ]       │
│                        │
│  [ Discard ]  [ Skip ] │
└────────────────────────┘
```
- Reps default to detected count
- Weight defaults to last set's weight for this exercise
- ± buttons: 1 increment for reps, 5 lb / 2.5 kg for weight
- Long-press ± for larger jump (5 reps, 25 lb / 10 kg)
- Save → goes to rest timer

### 5.6 Rest timer screen
```
┌────────────────────────┐
│      BENCH PRESS       │
│                        │
│         02:30          │  ← countdown, large
│                        │
│      next set 2 of ?   │
│                        │
│   [+30s]  [Skip rest]  │
└────────────────────────┘
```
- Default rest: 90s (configurable: 60 / 90 / 120 / 180 / custom per
  exercise category)
- Vibrate at -10s, vibrate strong at 0s
- After 0s: auto-transitions to in-set screen for next set
- Skip rest → in-set screen immediately
- Tap rest time → custom rest input

### 5.7 Summary screen (workout end)
- Total volume (sets × reps × weight)
- Set count
- Workout duration (incl. rest)
- Time under load (excl. rest)
- Top exercises by volume (top 3)
- Save & Exit / Discard

## 6. Auto rep counting — technical approach

This is the single hardest part of the product and the main competitive
moat. Be honest: target **85%+ accuracy** on supported exercises, with
clear UX for the misses.

### 6.1 Sensor
- 3-axis accelerometer at 25 Hz (sufficient for human rep cadence,
  battery-friendly)
- Optional: gyroscope at 25 Hz for exercises where orientation matters
  (rotation in curls, lateral raises)
- Available on fenix 8 via `Sensor.registerSensorDataListener`

### 6.2 Pipeline
1. **Sample** 25 Hz accelerometer + gyro
2. **Smooth** with a 5-sample moving average (kills shake noise)
3. **Project** onto exercise-specific principal axis (e.g. for curls,
   the dominant axis is wrist roll + vertical translation; for presses,
   it's vertical translation only)
4. **Detect peaks/valleys** with minimum amplitude threshold per
   exercise template
5. **Validate** each candidate rep:
   - Duration between 0.6s and 5.0s (filters jerks and pauses)
   - Amplitude above threshold
   - Pattern matches template within tolerance
6. **Emit** rep event → UI + vibration + counter increment

### 6.3 Per-exercise templates
Each exercise in the library has:
- `dominantAxis`: x | y | z | magnitude | composite
- `amplitudeThreshold`: m/s² delta required
- `minRepDuration` / `maxRepDuration`: seconds
- `requiresGyro`: boolean
- `confidenceFloor`: 0–1; below this we mark the rep "uncertain" and
  show a dim count

### 6.4 Realistic per-exercise accuracy targets
| Exercise | Target accuracy | Notes |
|---|---|---|
| Bicep curl | 95% | Clear roll + lift signature |
| Overhead press | 90% | Clean vertical translation |
| Lateral raise | 90% | Distinct arc |
| Pull-up / Chin-up | 95% | Largest signal |
| Bench press | 80% | Wrist barely moves; relies on subtle vertical |
| Squat (low-bar) | 65% | Wrist on barbell, minimal motion → flag as "low-confidence exercise" |
| Squat (high-bar / front) | 75% | Better wrist position |
| Deadlift | 70% | Wrist moves but signal is short |
| Row (bent / cable) | 88% | Clear pull signature |

For sub-80% exercises, show a subtle "verify reps" hint on the confirm
screen so the user knows to double-check.

### 6.5 Set-end detection
- Trigger: 5 seconds with no detected rep activity AND accelerometer
  magnitude variance below a threshold
- Show 5-second countdown to user: "Ending set in 5..." → tap to abort
  the auto-end

## 7. Data model

### 7.1 On-watch persistence (`Application.Storage`)
```
exercises[]                   // library (read-only, shipped in app)
  id, name, bodyPart, template

sessions[]                    // ring buffer, last 30
  id, startTs, endTs, sets[]

sets[]
  exerciseId, reps, weight, weightUnit, restAfterSec, timestamp

userPrefs
  units, vibrationLevel, defaultRestSec, screenTimeout

exerciseStats[]               // per-exercise last-used cache
  exerciseId, lastWeight, lastReps, lastSessionTs, totalSets, totalReps
```

Storage budget: keep total under ~50 KB. Old sessions auto-trim.

### 7.2 FIT file output
- Activity type: `STRENGTH_TRAINING`
- Each set written as a `set` message with reps, weight, exercise
  category/name fields
- Compatible with Garmin Connect's strength view

## 8. Exercise library (v1)

40 exercises across 8 body parts. Hand-curated for fenix-realistic
detection.

**Chest:** Bench Press, Incline Bench, Dumbbell Bench, Push-Up, Cable Fly
**Back:** Pull-Up, Chin-Up, Lat Pulldown, Bent Row, Cable Row, T-Bar Row
**Shoulders:** Overhead Press, Lateral Raise, Front Raise, Rear Delt Fly
**Arms:** Bicep Curl, Hammer Curl, Tricep Extension, Cable Pushdown, Skullcrusher
**Legs:** Back Squat, Front Squat, Leg Press, Lunge, Romanian Deadlift, Leg Curl
**Glutes:** Hip Thrust, Glute Bridge, Cable Pull-Through, Bulgarian Split Squat
**Core:** Plank (time-based, not reps), Hanging Leg Raise, Ab Wheel, Cable Crunch
**Cardio-Strength:** Kettlebell Swing, Thruster, Burpee, Wall Ball, Box Jump

## 9. Settings

Available in the Connect IQ phone-side settings menu (no runtime
phone connection needed at workout time):

- Units: imperial / metric
- Default rest: 60 / 90 / 120 / 180 / custom seconds
- Per-exercise rest override (set inside the app)
- Rep vibration: off / light / strong
- Rest-end vibration: light / strong
- Auto-end set: on / off (default on)
- Auto-end timeout: 3 / 5 / 8 / 10 seconds
- Screen always-on during set: on / off
- "Verify reps" hint on low-confidence exercises: on / off
- Workout auto-save threshold: 1 / 3 / 5 sets minimum before save

## 10. Connect IQ specifics

- **App type:** Watch App with custom activity profile
- **Target devices (launch):**
  - fenix 8 (47mm AMOLED 416×416, 51mm AMOLED 454×454, Solar MIP 280×280)
  - fenix 7 / 7S / 7X (MIP: 260×260, 240×240, 280×280)
  - fenix 7 Pro AMOLED (47mm 416×416, 51mm 454×454)
  - Forerunner 965 (AMOLED 454×454)
  - Forerunner 955 (MIP 260×260)
- **CIQ SDK target:** 4.0 minimum (covers all listed devices); use
  4.2+ APIs guarded by `:typecheck` or capability flags where helpful
- **Language:** Monkey C
- **Key APIs:**
  - `WatchUi.View` hierarchy for screen flow
  - `Sensor.registerSensorDataListener` for raw accelerometer/gyro
  - `ActivityRecording.createSession` to make it a real FIT activity
  - `Attention.vibrate` for haptic cues
  - `Application.Storage` for persistence
  - `Timer.Timer` for rest countdown
- **Memory budgets to design against:**
  - Lowest common denominator: fenix 7S app graphic pool ≈ 96 KB
  - fenix 8 / FR965 AMOLED: ~256 KB — plenty of headroom
  - **Implication:** avoid bitmap fonts where possible, use vector
    drawing for the rep counter, no full-screen gradients on MIP variants
- **Display handling:**
  - All targets are round 1:1, so use **percentage-based layout** in
    code rather than per-device XML layouts
  - Maintain two color palettes: AMOLED (rich black + accent) and MIP
    (high-contrast white-on-black, no gradients)
  - Detect via `System.getDeviceSettings().screenShape` and
    capability flags at startup, select palette once

## 11. Project structure

```
manifest.xml
resources/
  strings/strings.xml
  layouts/                    // optional — many screens drawn directly
  drawables/icons.xml
  fonts/                      // small custom rep-counter font if needed
  settings/settings.xml + properties.xml
source/
  StrongLogApp.mc             // entry point
  StrongLogDelegate.mc        // top-level input handler
  views/
    HomeView.mc
    BrowseView.mc
    ExerciseListView.mc
    InSetView.mc
    ConfirmSetView.mc
    RestTimerView.mc
    SummaryView.mc
  domain/
    Exercise.mc               // library + template lookup
    Session.mc
    SetRecord.mc
    Stats.mc                  // last-used cache
  detect/
    RepDetector.mc            // sensor pipeline + template matching
    Template.mc
    Smoothing.mc
  storage/
    Store.mc                  // wrapper over Application.Storage
    FitWriter.mc              // ActivityRecording integration
  util/
    Units.mc
    Format.mc
    Haptics.mc
```

## 12. Build phases & milestones

### Phase 0 — Validation (1 week)
Build a **standalone rep detector test app** with no UI beyond a number
and a logger. Take it to the gym for 5 sessions. Dump raw acc/gyro to
`Application.Storage`. Tune templates for 4 exercises: bicep curl,
overhead press, pull-up, bench press.

**Exit criteria:** ≥85% rep accuracy on those 4 across a real workout.

### Phase 1 — MVP (3 weeks)
- Full screen flow (Home → Browse → Exercise → InSet → Confirm → Rest)
- 20-exercise library with templates
- On-watch session save (no FIT yet)
- Hard-coded settings (no settings UI yet)

**Exit criteria:** Complete a real 60-minute workout end-to-end on the watch.

### Phase 2 — Polish + multi-device (3–4 weeks)
- Full 40-exercise library
- FIT activity output
- Settings menu via CIQ phone app
- Summary screen with volume math
- Haptic tuning across rep / rest-warning / rest-end
- AMOLED burn-in mitigation if always-on during set is enabled
- **Multi-device pass:**
  - Verify layout at 240 / 260 / 280 / 416 / 454 px in simulator
  - MIP color palette + remove gradients on MIP variants
  - Memory profiling against fenix 7S budget
  - Test FIT output on each device family

**Exit criteria:** Personal daily-use for 2 weeks without paper backup,
plus clean simulator runs across all 5 resolutions.

### Phase 3 — Launch prep (2 weeks)
- 5 beta testers from r/Garmin or local gym (ideally mixed devices)
- App store screenshots (5 per device family — 5 families = 25 images)
- Listing copy + demo video
- Pricing: launch at $3.99 with 7-day free trial (tentative)

**Total realistic timeline:** 10–11 weeks of focused part-time work
(was 8 with fenix 8 only; broader device support adds ~2–3 weeks
mostly in Phase 2).

## 13. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Rep accuracy too low on key exercises | Medium | Phase 0 gate. Per-exercise tuning. Always allow manual correction. Mark low-confidence exercises in UI. |
| Battery drain from always-on sensors | Medium | Sensors only active during in-set state. 25 Hz not 50. Screen always-on opt-in. |
| Set-end auto-detect false-triggers mid-set | Medium | 5s timeout + 5s warning countdown. Tunable in settings. |
| User forgets to start workout | High | Watch face complication "start workout" shortcut as v1.1. |
| Garmin native strength gets dramatically better | Low | Even then, the per-exercise tuning is durable differentiation. |
| Memory exhaustion on fenix 7S (smallest pool) | Medium | Vector-draw the rep counter, lean exercise library data, avoid bitmap caches. Profile in Phase 2 against the 96 KB budget. |
| Layout breaks across 240→454 px range | Medium | Percentage-based positioning in code, simulator pass on all 5 resolutions before any device-specific work. |
| MIP vs AMOLED visual disparity | Medium | Two palettes selected at startup; gradients gated behind AMOLED capability check. |

## 14. Success criteria

### Personal (you as user)
- You stop using paper / phone notes for strength workouts within 2
  weeks of MVP completion.

### Product (post-launch)
- **3-month:** 500 paid installs, ≥4.3★ average, ≥20 reviews
- **6-month:** 2,000 paid installs, top 10 in "Health & Fitness" → "Strength" category
- **Revenue target Y1:** $6,000 net after Garmin's 30% cut (≈2,150 sales at $3.99)

## 15. Future roadmap

**v1.1 (2–3 months post-launch)**
- RPE entry on confirm screen (optional, 1-tap 6/7/8/9/10)
- Plate calculator overlay
- "Watch face complication: start last workout"
- Per-exercise rest override saved per exercise

**v1.2 (4–6 months post-launch)**
- Programming: ship 3 built-in templates (PPL, Upper/Lower, Full-Body 3x)
- Custom user-defined exercises
- Auto-suggest weight based on last session

**v2 (6–12 months post-launch)**
- Connect IQ Mobile companion app for richer history viewing
- PR detection + notifications
- Volume trend charts
- Strava export
- Subscription tier ($2.99/mo) for templates + advanced analytics

---

## Decisions locked

1. **Launch devices:** fenix 8 family + fenix 7 family + Forerunner 965
   + Forerunner 955. Broad reach prioritized over fastest ship.
2. **Pricing:** $3.99 + 7-day free trial. Lower-friction price point
   trades per-unit revenue for install volume; needs ~2,150 sales to
   hit the $6K Y1 net target.
3. **Scope:** v1 as written. No additions. RPE, plate calc, and
   programming all deferred to v1.1+.
