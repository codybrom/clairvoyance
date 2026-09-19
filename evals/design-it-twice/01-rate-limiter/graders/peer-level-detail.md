---
type: llm
focus: last_message
---
This checks that the answer offers a real second design, not one design plus suggested changes to it.

PASS if each alternative the answer compares is a design in its own right: it has its own core mechanism or structure, and it is described well enough that a reader can tell how callers would use it and where its state lives. An alternative may be shorter than the recommended design, and the answer may end with a synthesis that is more detailed than either.

FAIL if any of these hold:
- the "second design" is a set of modifications to the first ("you could also add X", "alternatively, change Y", "things I'd avoid");
- an alternative is only a one-line label or name with no description of its mechanism or how callers use it;
- the answer presents only one design.
