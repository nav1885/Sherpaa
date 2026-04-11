# Sherpaa — Deep Research Brief
*Prepared by Vein | April 11, 2026*

---

## The Idea

An AI voice coach that rides with you — using your GPS position, Strava segment history, and live ride data to deliver personalized, in-ear audio guidance in real time. Not post-ride analysis. Not a dashboard glance. A voice that knows your legs, knows this road, and tells you what to do *right now*.

---

## What Exists (And Why It's Not Enough)

The market has four categories, all falling short:

**Strava Live Segments** — shows real-time gap to your PR on a head unit. No voice. No personalization beyond a single historical comparison. Strava's own community has been requesting audio cues for cycling since 2014 — still not delivered. Audio announcements exist only for running.

**Garmin/Wahoo ELEMNT computers** — offer alert-based voice prompts (lap time, turn-by-turn, segment approach pings). Rigid, metric-based, not conversational, not contextual. The Wahoo ACE didn't even have Strava Live Segments at launch in late 2024.

**AI training platforms (Spoked, CoachCat, Vekta, Athletica)** — post-ride feedback only. Smart, improving, but zero real-time audio delivery. CoachCat (FasCat) costs $35/month and still operates on upload-then-analyze logic.

**MapMyRide / Cyclemeter** — generic audio stat readouts. Mileage, pace, heart rate. No segment awareness. No personal history. No coaching intelligence.

**Nike Run Club's Guided Runs** — the closest UX analogue. Wildly successful for running. Zero equivalent exists for cycling.

The white space is exact: *real-time, voice-delivered, personally contextualized coaching during outdoor cycling rides.*

---

## What Customers Are Actually Saying

- Cyclists explicitly request that Strava surface "Last Best" and "Recent Best" alongside all-time PRs on Live Segments — because competing against a PR from five years ago is useless for training. *(WeLoveCycling)*
- Strava users have switched away *because* there is no audio feedback during cycling rides. *(Strava Community Hub complaint thread)*
- The core frustration with AI training apps: plan quality is opaque and feedback arrives too late to change behavior mid-ride. *(Cycling Weekly)*
- MTB riders have rich trail data (Trailforks: 650,000+ trails, Strava segments) but zero voice-based contextual guidance during descents or climbs. *(Trailforks)*
- The audience spends. Mountain bikers average €70,900 household income, plan next-bike budgets around €5,300, and skew 44.5 years old — high disposable income, performance-motivated, already multi-app subscribers. *(ENDURO MTB Reader Survey 2025)*

---

## The Gaps (What Doesn't Exist Yet)

1. **No app combines Strava segment history + GPS position + real-time voice output** for outdoor rides. This specific stack does not exist.
2. **No personalized pacing language during segments** — e.g., "You went out 8 seconds too hot here last Tuesday. Dial back the first 30 seconds." No product does this.
3. **Mountain bike has no voice guidance layer at all** — trail apps (Trailforks, MTB Project) offer maps and conditions, nothing spoken during the descent.
4. **Bone conduction headphone adoption is mainstream** (CyclingWeekly 2026 buyers guide), safety concern is solved — but no audio product is built for outdoor cycling at the coaching intelligence level.
5. **Strava has a structural reluctance to build this** — they make money on subscriptions and social engagement, not coaching depth. Their audio gap has sat open for 12+ years.

---

## Product Proposals

### Proposal 1: Sherpaa Segments — The Intelligent Segment Coach

**The bet:** A mobile app that connects to Strava API, tracks GPS in real time, and triggers personalized voice coaching when you enter a starred segment — drawing on your last 90 days of effort history on that specific segment.

**The gap it fills:** Strava's Live Segments show you a number. Sherpaa tells you what to do with it. "This climb takes you 4:12. You've been fading in the final 400m every time. Start your sprint 20 seconds earlier than feels right."

**Why now:** Bone conduction hardware is mainstream. LLM inference is cheap enough for real-time voice synthesis at scale. Strava's API still allows segment and activity history pulls.

**Differentiation:** Every other coaching tool operates post-ride. This is the only one that delivers insight *at the moment of decision* — mid-effort, on the segment, when it can change the outcome.

**Monetization:** Freemium. Free: 3 starred segments, generic audio cues. Premium ($12.99/month or $99/year): unlimited segments, full history coaching, effort trend analysis. Targets TrainerRoad's price floor ($189/year) from below while serving a broader outdoor-riding audience.

**Confidence level:** High. The technology stack is proven (Strava API + GPS geofencing + TTS/LLM voice synthesis). The demand signal is explicit and multi-year. No direct competitor.

**First move:** Build a waitlist around the Strava community hub threads where users have been asking for this. Partner with one cycling influencer who does segment hunting content. Launch iOS beta with 5 supported segment types within 90 days.

---

### Proposal 2: Sherpaa MTB — The Descent and Climb Whisperer

**The bet:** A mountain-bike-specific audio layer that reads Trailforks trail data + your GPS position and delivers spoken guidance before and during technical features — "steep switchback in 50m, weight back," "this is where you washed out last time, entry speed matters" — combined with segment pacing for climb efforts.

**The gap it fills:** No voice coaching exists for MTB. Trailforks is maps-only. Trail conditions are community-sourced text that nobody reads mid-ride. A voice that knows the trail and your history on it is a genuinely new product.

**Why now:** MTB participation and trail infrastructure investment are both surging. The Trailforks database (Pinkbike/Outside Inc.) has an API. The audience spends heavily and is experience-hungry.

**Differentiation:** Running and road cycling have Nike Run Club and Garmin voice prompts respectively — MTB has nothing. First mover in a sport with fierce loyalty and strong word-of-mouth.

**Monetization:** $14.99/month or $129/year. Single sport, specialist positioning justifies a slight premium over road. B2B angle: sell white-label trail audio guides to trail networks and bike parks as a revenue driver and distribution hack.

**Confidence level:** Medium-High. The Trailforks API access and technical feature detection add complexity. Doable but requires 6–9 months to get coaching intelligence reliable on variable terrain.

**First move:** Build the road segment product first (Proposal 1). Use that user base and infrastructure to launch MTB as an expansion track — same audio engine, different data sources.

---

### Proposal 3: Sherpaa Coach Mode — Human + AI Hybrid Coaching

**The bet:** A B2B/B2C hybrid where human coaches use a dashboard to pre-script voice cues that fire at GPS-triggered moments on a route — then Sherpaa AI fills in real-time gap commentary between scripted anchors. Sold to cycling coaches as a tool to coach athletes during races and training rides without being physically present.

**The gap it fills:** Coaches can currently give feedback only before or after a ride. This gives them a voice inside the athlete's ear at exactly the right geographic moment — "Now. This is the hill where we talked about staying seated through 300W."

**Why now:** Online coaching is a $300M+ market. FasCat charges $35/month for post-ride AI feedback. A coach who can "ride with" their client at scale — with AI covering the gaps — charges more and retains longer.

**Monetization:** SaaS for coaches: $49/month per coach, up to 10 athletes. Athletes pay $9.99/month for the listener app. Creates a two-sided marketplace dynamic with strong retention on both sides.

**Confidence level:** Medium. Requires building a coach-side web dashboard and a scripting/geofencing tool, plus athlete app. More complex GTM but solves a real pain for a paying professional segment with existing budget.

**First move:** Cold-reach 20 independent cycling coaches with 50–500 athletes. Offer 3-month free beta in exchange for co-design. Coaches are the best distribution channel — every athlete they onboard becomes a word-of-mouth vector.

---

## Verdict

The gap is real, specific, and embarrassingly uncontested. Strava has left audio coaching for cycling riders open for 12 years. The hardware (bone conduction earbuds), the data (Strava API, GPS), and the AI (cheap real-time voice synthesis) all exist and are mature. The customer is a 44-year-old with household income near six figures who already pays for three cycling apps and buys a €5,000 bike.

Build Proposal 1 first. It has the shortest path to a working product, the most explicit demand signal, and the clearest differentiation. Proposal 2 (MTB) is the natural expansion. Proposal 3 (Coach Mode) is the enterprise ceiling.

The window is open. Strava is distracted by API politics and social features. Garmin is hardware-first. No AI coaching startup has shipped real-time outdoor voice. Ship the segment coach. Own the category before Strava wakes up.

---

## Sources

- [Strava Audio Announcements Support](https://support.strava.com/hc/en-us/articles/216917237-Audio-Announcements)
- [Strava Community: Add audio cues for cycling](https://communityhub.strava.com/t5/ideas/add-audio-cues-for-other-activity-types/idi-p/9628)
- [Wahoo ACE In-Depth Review — DC Rainmaker](https://www.dcrainmaker.com/2024/12/wahoo-elemnt-ace-in-depth-review-bike-computer.html)
- [CoachCat AI — FasCat](https://fascatcoaching.com/blogs/training-tips/coachcat-ai-instant-workout-analysis)
- [AI Cycling Platforms — Cycling Weekly](https://www.cyclingweekly.com/news/gadget-knows-best-how-are-ai-coaching-platforms-changing-how-we-train)
- [Dopamine Trap of Chasing Strava Segments — WeLoveCycling](https://www.welovecycling.com/wide/2025/11/18/inside-the-cyclists-mind-the-dopamine-trap-of-chasing-strava-segments/)
- [Trailforks Mobile App](https://www.trailforks.com/apps/map)
- [ENDURO MTB Reader Survey 2025](https://enduro-mtb.com/en/readers-survey-2025/)
- [Best Headphones for Cycling 2026 — Cycling Weekly](https://www.cyclingweekly.com/group-tests/best-headphones-for-cycling-with-sound)
- [Nike Run Club App](https://www.nike.com/nrc-app)
- [Spoked AI Cycling Coach](https://www.spoked.ai/)
- [Best Cycling Apps 2026 — BikeRadar](https://www.bikeradar.com/advice/buyers-guides/best-cycling-apps)
