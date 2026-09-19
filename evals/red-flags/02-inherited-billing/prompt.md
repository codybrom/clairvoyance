---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
I just inherited the `billing/` package below. Anything structurally off before I start changing it?

```python
# billing/invoice_reader.py
import csv
from datetime import datetime

def read_invoices(path):
    rows = []
    with open(path) as f:
        for raw in csv.reader(f):
            raw[4] = datetime.strptime(raw[4].strip(), "%d/%m/%Y")
            rows.append(raw)
    return rows
```

```python
# billing/invoice_parser.py
from decimal import Decimal

def parse_invoices(rows):
    invoices = []
    for r in rows:
        invoices.append({
            "id": r[0],
            "customer": r[1],
            "amount": Decimal(r[2]) / 100,
            "currency": r[3],
            "issued": r[4],
        })
    return invoices
```

```python
# billing/invoice_writer.py
import csv
from datetime import datetime

def write_invoices(path, invoices):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        for inv in invoices:
            issued = inv["issued"]
            if isinstance(issued, str):
                issued = datetime.strptime(issued.strip(), "%d/%m/%Y")
            w.writerow([
                inv["id"],
                inv["customer"],
                int(inv["amount"] * 100),
                inv["currency"],
                issued.strftime("%d/%m/%Y"),
            ])
```

```python
# billing/__init__.py
from .invoice_reader import read_invoices
from .invoice_parser import parse_invoices
from .invoice_writer import write_invoices

def load(path):
    return parse_invoices(read_invoices(path))
```
