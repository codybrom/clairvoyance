---
type: llm
focus: last_message
---
PASS if each design the answer proposes states (a) where the per-tenant (and per-route enterprise) limit configuration lives or is looked up, and (b) how a route handler ends up with the right limit applied, without the handler hard-coding tier logic itself, or, if the handler does own it, the answer names that as a cost.
FAIL if either design ignores how per-tenant/per-route limits are resolved, or the designs only differ in the counting algorithm while leaving limit ownership unaddressed.
