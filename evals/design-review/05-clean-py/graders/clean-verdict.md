---
type: llm
focus: last_message
---
Step 1. Find the answer's overall verdict on the design (usually near the top: "well-designed", "sound", "the shape is good", "no structural problems", or the opposite).

Step 2. Check whether the answer recommends RESTRUCTURING. Restructuring means ONLY one of these:
- splitting the file/module/type into several, or merging it with something else;
- replacing the core approach or algorithm (e.g. "don't use a token bucket", "rewrite this as a class hierarchy");
- telling the user to replace the code with a library instead of keeping it.

These are NOT restructuring, however they are labelled: adding a method, option, or parameter to the existing type/function; input validation; edge-case or correctness fixes; comments, docstrings, or naming; mentioning that a library exists as background.

PASS if the verdict in Step 1 is positive (sound / well designed / good shape) AND Step 2 finds no restructuring recommendation. FAIL otherwise. Quote the verdict sentence and any restructuring recommendation in your reasoning.
