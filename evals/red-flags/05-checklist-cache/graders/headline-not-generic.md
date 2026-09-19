---
type: llm
focus: last_message
weight: 0.33
---
Classify each finding the answer raises as one of:
- DESIGN: a structural/software-design problem (module depth, pass-through, information leakage/hiding, temporal decomposition, special-general mixture, overexposure/caller burden, repetition, conjoined methods, vague names, comments restating code, error-handling strategy, tactical vs strategic change, etc.)
- BUG: a concrete correctness defect (wrong result, lost data, crash, deadlock). BUG findings are neutral.
- GENERIC: review noise with no design lens — formatting/style, adding type annotations or replacing `any`, adding tests, logging, micro-performance, lint conventions.

PASS if the answer's headline — its first finding, or the item it explicitly calls most important / critical / fix-first — is DESIGN or BUG. FAIL only if that headline is GENERIC. Judge only the headline; ignore everything else in the answer. State the headline and its label in your reasoning.
