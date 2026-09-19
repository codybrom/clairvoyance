---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Review the design of these three modules.

```python
# session_store.py
import json
import time


class SessionStore:
    def __init__(self, redis):
        self.redis = redis
        self._pending = None

    def begin(self, user_id):
        self._pending = {"uid": user_id, "ts": int(time.time()), "scopes": []}

    def finish(self, token):
        self.redis.set(f"sess:{token}", json.dumps(self._pending), ex=3600)
        self._pending = None

    def raw(self, token):
        blob = self.redis.get(f"sess:{token}")
        return json.loads(blob) if blob else None
```

```python
# auth.py
import secrets


def login(store, user_id, scopes):
    store.begin(user_id)
    store._pending["scopes"] = list(scopes)
    token = secrets.token_urlsafe(24)
    store.finish(token)
    return token


def check(store, token, scope):
    s = store.raw(token)
    return bool(s) and scope in s["scopes"]
```

```python
# audit.py
import json


def session_owner(redis, token):
    blob = redis.get(f"sess:{token}")
    if not blob:
        return None
    return json.loads(blob)["uid"]


def session_age(redis, token, now):
    blob = redis.get(f"sess:{token}")
    return now - json.loads(blob)["ts"] if blob else None
```
