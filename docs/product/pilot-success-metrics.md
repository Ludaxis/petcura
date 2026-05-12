# Pilot Success Metrics

## Baseline

Measure during week 0 before go-live:

- routine inbound calls per business day
- WhatsApp messages per business day
- median first response time
- missed follow-ups per week
- staff hours spent on phone or unstructured messaging

## Week 12 Success Criteria

- routine inbound calls reduced by at least 25 percent
- at least 150 real owner requests processed
- at least 80 percent of requests categorized correctly
- median first response time at or below 4 business hours
- AI summary accept rate at or above 70 percent
- AI reply drafts require only minor edits in at least 50 percent of cases
- accepted AI memory is cited in at least 30 percent of repeat-owner/pet requests after enough history exists
- staff reject or expire unsafe, stale, or non-useful memory without workflow interruption
- reminder delivery success at or above 95 percent
- explicit reminder acknowledgement at or above 50 percent
- zero medical safety incidents
- zero GDPR incidents
- Alex agrees to continue paying

## Agent System Acceptance

- A new agent can understand the repo from `AGENTS.md` and `CLAUDE.md`.
- Claude can build a UI surface without touching backend-owned files.
- Codex can integrate Claude UI work without rewriting the design.
- QA can run a repeatable checklist and produce actionable failures.
- No file contains conflicting agent instructions.

## AI Memory V1 Pilot Watchpoints

- Track candidate accept/edit/reject rates by clinic and memory type.
- Track draft generation latency and whether generated drafts include visible source and target locale metadata.
- Track zero cross-clinic memory retrieval incidents.
- Track zero cases where AI memory changes final urgency, diagnosis, prescription, or autonomous owner-facing advice.
