---
type: llm
focus: last_message
---
PASS if the answer identifies the `for_invoice` flag in `calculate_total` as a problem because it bakes one use case's special needs — invoice-style rounding and a string return type — into a general calculation (special-general mixture, boolean/flag parameter that switches behaviour, mixed return types, or equivalent), and suggests separating it (e.g. a distinct function, or moving the formatting to the code that needs it). The answer does not need to name any specific caller. FAIL if the flag is not discussed, or discussed only as "add a type hint".
