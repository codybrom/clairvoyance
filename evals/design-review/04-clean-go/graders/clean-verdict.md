---
type: llm
focus: last_message
---
Judge what the answer RECOMMENDS, not the labels it uses. PASS if the answer treats the overall structure, module shape, and interface as sound — i.e. its recommendations are local: edge-case handling, input validation, correctness fixes, documentation/contract clarifications, naming, or adding an optional parameter. This holds even if it calls those items "design problems". FAIL only if it recommends restructuring: splitting or merging modules/functions for design reasons, introducing new abstraction layers or classes, or replacing the core approach.
