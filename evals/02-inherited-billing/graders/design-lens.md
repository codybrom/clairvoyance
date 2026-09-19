---
type: llm
focus: last_message
---
The answer is a design review of the provided code. Classify each finding it raises as one of:

- DESIGN: a structural/software-design problem (module depth, pass-through, information leakage/hiding, temporal decomposition, special-general mixture, overexposure/caller burden, repetition, conjoined methods, vague names, comments restating code, error-handling strategy, tactical vs strategic change, etc.)
- BUG: a concrete correctness defect (wrong result, lost data, crash). BUG findings are neutral — they neither help nor hurt.
- GENERIC: review noise with no design lens — formatting/style, adding type annotations or replacing `any`, adding tests, logging, micro-performance, lint conventions.

Check these claims:

1. The headline — the first finding, or the item the answer explicitly calls most important / fix first — is DESIGN or BUG, not GENERIC.
2. GENERIC findings, if any, are fewer than DESIGN findings.
3. No finding names a function, field, parameter, or behaviour that does not exist in the provided code. Stretched, speculative, "inferred", or weakly justified flags about code that IS present are acceptable and must not cause a FAIL — only references to non-existent code do.

PASS only if all three hold. In your reasoning, list each finding with its label.
