---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Scan retry.py and client.py for design red flags.

```python
# retry.py
import random

BASE_DELAY = 0.5
MAX_DELAY = 30


def backoff(attempt):
    delay = min(BASE_DELAY * (2 ** attempt), MAX_DELAY)
    return delay + random.uniform(0, delay / 10)


def should_retry(status):
    return status in (429, 502, 503, 504)
```

```python
# client.py
import time

import requests

from retry import backoff, should_retry


class ApiClient:
    def __init__(self, base_url, base_timeout_ms=2000, max_attempts=5):
        self.base_url = base_url
        self.base_timeout_ms = base_timeout_ms
        self.max_attempts = max_attempts

    def get(self, path):
        for attempt in range(self.max_attempts):
            timeout_ms = self.base_timeout_ms + backoff(attempt)
            resp = requests.get(self.base_url + path, timeout=timeout_ms / 1000)
            if not should_retry(resp.status_code):
                return resp
            time.sleep(backoff(attempt) / 1000)
        return resp
```
