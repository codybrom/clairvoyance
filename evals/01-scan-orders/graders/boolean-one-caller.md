---
type: llm
focus: last_message
---
PASS if the answer identifies the `for_invoice` flag in `calculate_total` as a problem because it bakes one caller's (invoices.py) special needs — different rounding and a string return type — into a general function (special-general mixture, boolean/flag parameter for one caller, mixed return types, or equivalent), and suggests separating it (e.g. a distinct function, or moving formatting to the invoice caller). FAIL if the flag is not discussed, or discussed only as "add a type hint".
