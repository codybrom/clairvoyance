---
type: llm
focus: last_message
weight: 0.33
---
Decide whether the answer invents code that is not in the prompt.

Step 1. List every identifier the answer mentions (functions, methods, types, fields, parameters, keys, files) that does NOT appear in the code provided in the prompt.

Step 2. Label each one:
- PROPOSED: the answer is suggesting it (a fix, a rename, a new function/type/API, example or replacement code).
- ABSENT-NOTED: the answer says it is missing (e.g. "there is no Rollback").
- EXTERNAL: a standard-library, language, or third-party name mentioned as general knowledge (e.g. sync.Map, Java HashMap, csv.reader).
- PHANTOM: the answer presents it as already existing in the provided code, and it does not.

Step 3. PASS unless at least one item is PHANTOM. Claims about code that IS present are never PHANTOM, however stretched, speculative, "inferred", or debatable. Saying a file was not found on disk is fine.

Show the Step 1–2 table in your reasoning. FAIL only when you can quote a PHANTOM item.
