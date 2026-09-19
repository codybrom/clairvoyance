---
type: llm
focus: last_message
---
The gateway runs as 6 replicas behind a load balancer, so a tenant's limit must hold across all replicas, not per replica.

PASS if each design the answer proposes explains how counting is coordinated across the replicas, so that a tenant cannot get up to 6x its quota. Any of these counts: a shared atomic counter (e.g. a Redis script or INCR), quota leased from or allocated by a central store, or a per-replica share of the limit (limit / replica count). Alternatively, the answer may explicitly state and justify that the design enforces different semantics (e.g. approximate or per-replica limits) and what over-admission that allows.

FAIL if any proposed design keeps independent per-process counters without addressing the cross-replica problem, or if the answer never considers the replicas when describing how counting works.
