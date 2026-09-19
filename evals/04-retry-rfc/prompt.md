---
max_turns: 10
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Help me write the design section of an RFC for a job-retry system in our background worker platform (Go). Jobs fail transiently (timeouts, 503s from downstream services). Some job types are idempotent and some are not (e.g. "charge card", "send SMS"). Today a failed job is just logged and dropped. Write the design section I can paste into the RFC.
