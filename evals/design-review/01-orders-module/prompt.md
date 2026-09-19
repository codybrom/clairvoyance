---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Do a full design review of the `orders/` module.

```python
# orders/validator.py
class OrderValidator:
    def validate(self, order):
        # check the order
        if not order.get("lines"):
            raise ValueError("no lines")
        payload = {
            "amt": int(order["total"] * 100),
            "ccy": order["currency"].upper(),
            "ref": f"ORD-{order['id']:08d}",
        }
        if len(payload["ref"]) > 12 or payload["amt"] <= 0:
            raise ValueError("payment payload invalid")
        return True
```

```python
# orders/submitter.py
class OrderSubmitter:
    def __init__(self, gateway):
        self.gateway = gateway

    def doIt(self, order):
        # build the data
        data = {
            "amt": int(order["total"] * 100),
            "ccy": order["currency"].upper(),
            "ref": f"ORD-{order['id']:08d}",
        }
        # send it
        return self.gateway.charge(data)
```

```python
# orders/__init__.py
from .validator import OrderValidator
from .submitter import OrderSubmitter


def place(order, gateway):
    OrderValidator().validate(order)
    return OrderSubmitter(gateway).doIt(order)
```
