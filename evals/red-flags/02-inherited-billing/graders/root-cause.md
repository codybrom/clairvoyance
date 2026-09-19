---
type: llm
focus: last_message
---
PASS if the answer explicitly connects at least two of its findings to a single shared underlying design cause — for example a module boundary drawn in the wrong place, one piece of knowledge owned by several modules, a general-purpose mechanism absorbing one caller's special case, or an interface exposing internals — AND states (or clearly implies via its recommended fix) that addressing that one cause resolves those findings together.

FAIL if the answer is essentially a list of independent issues, each with its own local fix, with no stated common cause — even if every individual issue is correct.
