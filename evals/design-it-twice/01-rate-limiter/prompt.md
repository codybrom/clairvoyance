---
max_turns: 10
timeout_seconds: 600
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Design it twice: I need a rate limiter module for our API gateway (Python, asyncio). Callers are the per-route request handlers. Limits vary by tenant (free tenants get 60 req/min, paid get 1000 req/min, and a few enterprise tenants have custom limits per route). The gateway runs as 6 replicas behind a load balancer and we already have Redis. Don't write the full implementation. I want the design.
