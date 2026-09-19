---
type: llm
focus: last_message
---
PASS if all of the following hold:
1. The alternatives are compared on at least two criteria, and for each criterion the answer names a consequence specific to this problem (e.g. "in B, every caller must look up X itself"), not a generic property like "more flexible", "cleaner", or "more scalable" with no concrete tie-in.
2. The answer ends with a clear recommendation: one of the alternatives, or an explicitly described synthesis of them.
3. The stated reason for the recommendation refers back to the comparison.

FAIL if the comparison is generic or gut-feel, if there is no recommendation ("it depends" with no pick), or if the recommendation's reasoning ignores the comparison.
