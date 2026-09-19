---
type: llm
focus: last_message
---
PASS if each design the answer proposes explicitly deals with undo when other users have edited the document since the operation being undone: e.g. whether undo is per-user or global, and how the inverse operation is adjusted for concurrent edits (transforming positions, or an equivalent mechanism).
FAIL if any proposed design treats undo as a plain local stack of inverse operations with no account of other users' concurrent edits.
