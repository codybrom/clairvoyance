---
type: llm
focus: last_message
---
PASS if the answer points out that the function cannot be described simply (its behaviour depends on interacting flags / ordering, "does X except when Y unless Z"), AND proposes a restructuring that changes the design — e.g. separate pricing rules/steps with explicit ordering, a price pipeline, policy objects, or moving legacy/region handling out — rather than only extracting helper functions with the same flags passed through. FAIL if the only suggestion is "break it into smaller functions" or renaming.
