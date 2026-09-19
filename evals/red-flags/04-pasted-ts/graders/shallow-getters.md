---
type: llm
focus: last_message
---
PASS if the answer identifies that `UserData` is a shallow class: its getters/setters simply expose the private fields (`data`, `info`), so callers still manipulate the raw object themselves (as the usage shows with displayName) — described as shallow module, false encapsulation, exposing internal representation, or equivalent. FAIL if not raised or raised only as "use TypeScript getters".
