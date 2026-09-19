---
type: llm
focus: last_message
---
PASS if the answer identifies that `compute_price` has accumulated caller- or case-specific branches (`legacy`, `region` checks for DE/FR/UK, `is_bulk`, promo codes like SPRING/STAFF) inside what should be a general pricing function, and names this as a design problem (special-general mixture, flag parameters, special cases piled into one function, or equivalent). FAIL if the answer only lists individual bugs or only says the function is long.
