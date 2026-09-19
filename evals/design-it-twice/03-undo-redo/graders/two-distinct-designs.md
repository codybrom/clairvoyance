---
type: llm
focus: last_message
weight: 2
---
Find the design alternatives the answer compares against each other on criteria. Some answers compare at more than one level (e.g. two interfaces, then two mechanisms); treat each level as its own comparison. Ignore naming, wording, and presentation order.

For a pair of compared alternatives A and B, check three structural axes:

(a) the interface the caller sees: the shape of the public API (e.g. one function vs. an object with methods, push vs. pull, declarative config vs. imperative calls);
(b) where state and data live: which component owns the key data and decisions;
(c) module decomposition or core mechanism: how responsibilities are divided, or what fundamentally does the work.

PASS if, at some level the answer compares, there is a pair of alternatives that differ substantively on at least two of the three axes, and the answer treats both as serious candidates (not a one-sentence mention).

FAIL if any of these hold:
- every compared pair matches on two or more axes (semantically the same design, even if differently named or described);
- the answer itself says its alternatives converged on the same design and no other alternative is compared in comparable depth;
- the second alternative is the first with components added, an option added, or one small internal change (e.g. "lazy vs. eager" versions of the same mechanism);
- the answer presents only one design.
