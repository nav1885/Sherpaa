# Sherpaa — Product Brief
*Prepared for PM Agent | April 11, 2026*

> This brief supplements the Vein market research report (`Sherpaa_Market_Research.md`). Do not re-derive what is already there. Start from here.

---

## What We're Building — V1 Scope

**Proposal 1 only: The Intelligent Segment Coach.**

A mobile app (iOS first) that:
1. Connects to the rider's Strava account
2. At ride start, fetches their starred segments + last 90 days of effort history
3. Tracks GPS in real time during the ride
4. Triggers personalized voice coaching cues as the rider approaches and completes Strava segments
5. Delivers a spoken post-ride debrief
6. Updates the pacing model after each ride

MTB (Proposal 2) and Coach Mode (Proposal 3) are explicitly out of scope for v1. They share the same infrastructure and will be expansion tracks.

---

## The Golden Path — End-to-End Ride Experience

This is the core use case the PM spec must be built around.

### The night before
- Rider opens app, selects tomorrow's route (or drops a start point)
- App identifies which starred segments fall on the route
- App delivers a spoken pre-brief: segment count, PR targets, personal tendencies on each segment ("you fade in the final 400m on Hawk Hill every time")
- Rider sets goal: PR attempt or training effort. App sets coaching mode accordingly.

### Morning — ride start
- Rider connects earbuds, opens app
- App confirms GPS lock and speaks a short briefing: segments on today's route, mode, battery status
- Ride begins. App runs in background.

### En route — approaching a segment
- At 500m from segment start: spoken approach cue fires
  - Example: *"Hawk Hill in 500 meters. PR is 4:12. You've faded in the final 400m the last three times — hold 280 watts through the false flat, save your kick for the top."*
- At segment start: brief confirmation cue fires
- Mid-segment: rule-based cues only (no LLM) — compare current pace/HR to PR splits, pick from pre-written templates
  - Example: *"False flat now. You're 3 seconds up on PR pace — hold."*
- Segment end: result cue fires
  - Example: *"4:08. New PR. 4 seconds."*

### Between segments
- Silence by default — this is a feature, not a gap
- Occasional check-in only if rider is burning too hot for later segments
  - Example: *"You're 18 minutes from Lagunas. Heart rate is elevated — ease up, save legs."*

### Post-ride
- App delivers spoken debrief: PRs hit, what went well, where pacing model updated
- Activity syncs to Strava automatically
- Pacing model updates in background

---

## Technical Architecture — Decided, Not Up for Debate

These decisions are final. The PM spec should reflect them, not re-open them.

### Pre-generation (not real-time LLM)
All coaching cues are generated **before the ride starts**, while the phone is on WiFi. During the ride, the app only plays cached audio triggered by GPS. No LLM calls mid-ride.

**Why:** Riders are frequently in areas with spotty or no network coverage (mountain passes, forests, rural roads, tunnels). At 20mph, a 500m window to a segment start is ~25 seconds — any network latency or failure ruins the cue. The most important segments are in the most remote locations. Reliability is non-negotiable.

### Variant system
Per segment, generate **3 cue variants** at ride start:
- Aggressive (PR attempt mode)
- Moderate (training effort mode)
- Recovery (rider is fatigued — elevated HR/power detected)

At the geofence trigger, app checks live HR/power against baseline and selects the appropriate variant. No network call at trigger time.

### Cache text strings, not audio files
Pre-generate text cues via LLM → convert to speech on-device via native TTS (iOS AVSpeechSynthesizer). Do not cache MP3/audio files. This keeps the audio pipeline flexible — swapping to a premium voice or on-device LLM later requires no rearchitecting.

### Segment cue reuse
Do not regenerate cues for a segment on every ride. Regenerate only when:
- Rider has set a new PR on that segment (history changed meaningfully)
- Last generation was 30+ days ago

This dramatically reduces LLM calls for high-frequency users (who are also highest-value users).

### GPS
1Hz polling on-device. Geofence check is a simple distance calculation against cached segment coordinates — no network call, runs entirely on-device.

### Strava API
- Pre-ride only: fetch starred segments + 90-day effort history (~20-30 API calls)
- Post-ride only: sync completed activity
- Zero Strava API calls during the ride
- Aggressive caching: segment coordinates are static, only effort history changes

### Real-time LLM — future layer, not v1
Real-time LLM calls mid-ride are a v2+ feature, triggered only by significant deviations (e.g., HR spike, unexpected stop). Pre-generation handles 90%+ of v1 use cases.

### On-device model — future layer
Fine-tuned on-device model (Core ML) for pacing intelligence is a v3+ consideration once per-rider data volume justifies it.

---

## Cost Model — Per Ride

| Component | Cost per ride |
|-----------|--------------|
| GPS | $0 (on-device) |
| Strava API | $0 (free tier) |
| TTS | $0 (on-device native) |
| LLM (Haiku/GPT-4o mini) | ~$0.004 |
| Backend compute | ~$0.002 |
| **Total** | **~$0.005-0.01** |

Assume 12-15 rides/month per active user:

| Tier | Monthly revenue | Monthly cost | Gross margin |
|------|----------------|-------------|-------------|
| Free (3 segments) | $0 | ~$0.05 | — |
| Pro ($6.99/mo) | $6.99 | ~$0.10-0.15 | ~98% |
| Elite ($12.99/mo) | $12.99 | ~$0.15-0.20 | ~98% |

---

## Monetization Tiers

| Tier | Price | What's included |
|------|-------|----------------|
| Free | $0 | 3 starred segments, generic approach/exit cues, pace-only coaching |
| Pro | $6.99/mo or $59/yr | Unlimited segments, full PR Coach with splits analysis, HR-based coaching, post-ride audio debrief |
| Elite | $12.99/mo or $99/yr | Everything in Pro + adaptive fatigue detection, power-based coaching, pacing model that improves per ride, multi-ride trend analysis |

---

## Go-to-Market — Bay Area Pilot

- Launch with 50 curated segments across Bay Area road routes: Hawk Hill, Paradise Loop, Mt. Tam climbs
- Recruit 200 beta riders from local clubs (Alto Velo, MCBC)
- Seed waitlist via Strava Community Hub threads where riders have been requesting audio cues since 2014
- Partner with one segment-hunting cycling influencer for launch distribution
- Success metrics: PR improvement rate, weekly active rides with audio on, free → Pro conversion rate, NPS

---

## What the PM Agent Should Produce

A full build-ready ProductSpec covering:
- Personas (road cyclists who segment hunt, 3-5 profiles)
- Full user flows for: onboarding + Strava connect, route/ride setup, in-ride experience, post-ride debrief, subscription upgrade
- Screen definitions for every view in the app
- Functional and non-functional requirements
- Data model (rider, segment, effort, cue, pacing model entities)
- API surface (Strava OAuth, internal endpoints)
- Success metrics with 30/60/90-day targets
- Launch criteria checklist

Do not re-research the market. Do not re-open the technical architecture decisions above. Take them as given and spec the product.
