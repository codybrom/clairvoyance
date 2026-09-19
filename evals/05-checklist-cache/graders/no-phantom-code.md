---
type: llm
focus: last_message
weight: 0.33
---
PASS unless the answer names a function, method, field, parameter, file, or code behaviour that does not exist in the code provided in the prompt. Claims about code that IS present are fine even if they are stretched, speculative, "inferred", wrong in severity, or you disagree with them. Remarks that a file was not found on disk are fine. General facts about languages or libraries are fine. Names the answer itself proposes — suggested fixes, renames, new functions/types/APIs, example code — are NOT references to existing code and never cause a FAIL; neither are names the answer explicitly says are absent (e.g. "there is no Rollback"). FAIL only on a reference to non-existent code, and quote it in your reasoning.
