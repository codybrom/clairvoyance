---
type: llm
focus: last_message
---
PASS if the answer identifies that `NewCache` forces every caller to supply internal tuning values (shards, evictionPolicy, hashSeed, bucketLoadFactor) they don't understand and always pass identically — overexposure, pushing complexity up to callers, or equivalent — and suggests defaults / a simpler constructor. FAIL if not raised.
