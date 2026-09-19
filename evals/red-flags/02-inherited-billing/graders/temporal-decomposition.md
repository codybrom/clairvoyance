---
type: llm
focus: last_message
---
PASS if the answer identifies that the package is split into reader / parser / writer modules by processing step (execution order) rather than by what knowledge each owns — called temporal decomposition, pipeline-step split, or equivalent — and suggests organising around the invoice CSV format (e.g. one module that owns the format for both reading and writing). FAIL if the split itself is not criticised.
