---
type: llm
focus: last_message
---
PASS if the answer identifies that `NewCache` forces callers to supply internal tuning values (any of shards, evictionPolicy, hashSeed, bucketLoadFactor) that a cache user has no basis to choose — overexposure, pushing complexity up to callers, leaking implementation details into the constructor, or equivalent — and suggests defaults / a simpler constructor (e.g. options for rare tuning). The answer does not need to claim anything about how many call sites exist. FAIL if not raised.
