---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
`OrderService.checkout` in orders.py throws `KeyError: 'items'` when the customer's cart is empty — empty carts come through as `{}`. Fix it so checkout of an empty cart raises a clear `ValueError("cart is empty")` instead. Show me the corrected code.

```python
# orders.py
import logging

log = logging.getLogger(__name__)

TAX_RATE = 0.08
INVOICE_ROUNDING = 2


class OrderRepository:
    def __init__(self, db):
        self.db = db

    def get_order(self, order_id):
        row = self.db.query("SELECT * FROM orders WHERE id = ?", order_id)
        return dict(row) if row else None

    def save_order(self, order):
        self.db.upsert("orders", order)


class OrderService:
    def __init__(self, repo, mailer):
        self.repo = repo
        self.mailer = mailer

    def get_order(self, order_id):
        return self.repo.get_order(order_id)

    def save_order(self, order):
        return self.repo.save_order(order)

    def checkout(self, cart, customer):
        items = cart["items"]
        total = calculate_total(items)
        order = {"customer_id": customer["id"], "items": items, "total": total}
        self.repo.save_order(order)
        self.send_confirmation(customer, order)
        return order

    def send_confirmation(self, customer, order):
        try:
            self.mailer.send(customer["email"], "Order confirmed", str(order["total"]))
        except Exception:
            pass


def calculate_total(items, for_invoice=False):
    subtotal = sum(i["price"] * i["qty"] for i in items)
    total = subtotal * (1 + TAX_RATE)
    if for_invoice:
        return f"{round(total, INVOICE_ROUNDING):.2f}"
    return total
```
