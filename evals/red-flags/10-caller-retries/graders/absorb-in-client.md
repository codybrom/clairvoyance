---
type: llm
focus: last_message
---
PASS if the answer argues that retry handling belongs inside `Client.fetch` (or a layer the client owns) so callers do not need to know about timeouts/retries — pulling complexity down, defining the error out of existence for callers, or equivalent — rather than only proposing a shared `retry()` helper that each caller must still remember to wrap around its call. Proposing a helper as a stepping stone is fine if the answer also says the client should own it. FAIL otherwise.
