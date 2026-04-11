---
To: developers@strava.com
Subject: API Use Case Clarification — AI Coaching Cue Generation
Status: DRAFT — send before launch
---

Hi Strava team,

I'm building Sherpaa, an iOS/Android app that provides real-time audio coaching to cyclists during rides. I'm writing to clarify whether our use of the Strava API complies with your updated API agreement, specifically around AI/ML usage.

**What we do with Strava data:**

1. We use OAuth to access a rider's own starred segments and personal effort history (times, dates) via the Strava API.
2. Before a ride, we send a small anonymized summary of that rider's own stats for a given segment — their best time, average time, and a pacing tendency derived from their last 5 efforts — to a large language model (Claude by Anthropic) to generate personalized coaching cues.
3. No Strava athlete IDs, names, or identifiable information are sent to the LLM. Only relative performance stats (e.g. "best time: 4:32, tendency: fades in final third").
4. The LLM is not trained or fine-tuned on this data. It is a standard inference call — the model generates a short coaching sentence and the data is not retained or used beyond that single request.
5. Cues are delivered as audio to the rider during their ride on the same segment.

In short: we are using a rider's own Strava data, with their consent, to serve personalized coaching back to that same rider. No data is aggregated, sold, or used to build competing models.

**Our question:**

Does this use case comply with your current API agreement and AI/ML policy? If there are specific anonymization or data handling requirements we should meet, we're happy to implement them.

We're big fans of the Strava platform and want to be a compliant, additive partner — Sherpaa drives more segment attempts and engagement, not less.

Happy to jump on a call if that's easier.

Thanks,
[Your name]
[Your email]
Sherpaa — https://[your domain]
