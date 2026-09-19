---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Here are four places we call `client.fetch`. Does the design look right?

```python
# reports/daily.py
def load_sales(client, day):
    for attempt in range(3):
        try:
            return client.fetch(f"/sales/{day}")
        except TimeoutError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
```

```python
# sync/inventory.py
def pull_inventory(client, sku):
    for attempt in range(3):
        try:
            return client.fetch(f"/inventory/{sku}")
        except TimeoutError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
```

```python
# api/handlers.py
def get_customer(client, customer_id):
    for attempt in range(3):
        try:
            return client.fetch(f"/customers/{customer_id}")
        except TimeoutError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
```

```python
# jobs/reconcile.py
def fetch_ledger(client, account):
    for attempt in range(5):
        try:
            return client.fetch(f"/ledger/{account}")
        except (TimeoutError, ConnectionError):
            if attempt == 4:
                raise
            time.sleep(1)
```

```python
# http_client.py
class Client:
    def __init__(self, base_url, session):
        self.base_url = base_url
        self.session = session

    def fetch(self, path):
        resp = self.session.get(self.base_url + path, timeout=5)
        resp.raise_for_status()
        return resp.json()
```
