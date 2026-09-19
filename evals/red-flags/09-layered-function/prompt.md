---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Can you take a look at `compute_price`?

```python
# pricing.py
from decimal import Decimal, ROUND_HALF_UP

VAT = {"UK": Decimal("0.20"), "DE": Decimal("0.19"), "FR": Decimal("0.20")}


def compute_price(item, user, promo=None, legacy=False, region=None, is_bulk=False, qty=1):
    price = Decimal(item["price"])

    if legacy:
        price = Decimal(item.get("legacy_price", item["price"]))
    elif user.get("tier") == "gold":
        price = price * Decimal("0.90")

    if promo:
        if promo.get("type") == "percent":
            if not (legacy and promo.get("code") == "SPRING"):
                price = price * (1 - Decimal(promo["value"]) / 100)
        elif promo.get("type") == "fixed":
            price = max(price - Decimal(promo["value"]), Decimal("0"))
        if promo.get("code") == "STAFF" and not user.get("is_staff"):
            price = Decimal(item["price"])

    if is_bulk and qty >= 10:
        if region == "DE":
            price = price * Decimal("0.93")
        else:
            price = price * Decimal("0.95")

    total = price * qty

    if region:
        if region in VAT and not (region == "UK" and user.get("vat_exempt")):
            total = total * (1 + VAT[region])
        if region == "FR" and legacy:
            total = total.quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
```
