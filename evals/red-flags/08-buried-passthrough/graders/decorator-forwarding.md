---
type: llm
focus: last_message
---
PASS if the answer identifies that `CachedUserStore` forwards five of its six methods unchanged to add caching to one (`get`), and treats that as a design problem (shallow decorator, boilerplate forwarding that must track every UserStore change, or equivalent), optionally noting consequences such as stale cache after `update`/`delete`. A stale-cache bug alone, without the forwarding point, does not count. FAIL if the forwarding is not raised.
