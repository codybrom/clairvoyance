---
type: llm
focus: last_message
---
This checks for strawmen: an alternative the answer itself generated, then made weak so it would lose.

Apply the check only to alternatives the answer generated (including ones produced by a sub-agent). A design the user supplied in their prompt is never a strawman, even if the answer criticizes it heavily.

PASS if every alternative the answer generated is something a competent engineer could reasonably ship for this problem, AND the answer states at least one concrete advantage of each generated alternative over the others, or a concrete condition under which it would be the better choice (not merely "simpler" with no specifics).

FAIL if any generated alternative is a strawman: it has an obvious flaw that seems built in to make it lose, it is described so thinly it could not be evaluated, or the answer gives no genuine advantage or winning condition for it. Also FAIL if the answer generated no alternative design at all.
