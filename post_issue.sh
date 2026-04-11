#!/bin/bash
set -e

# Create label (ignore if exists)
gh label create "pm-spec" --repo nav1885/QuantumForge --color "0075ca" --description "PM-generated product spec" 2>/dev/null || true

# Post the issue
gh issue create \
  --repo nav1885/QuantumForge \
  --title "[PM Spec] TrailVoice — Intelligent Segment Coach" \
  --label "pm-spec" \
  --body-file /tmp/trailvoice_spec.md
