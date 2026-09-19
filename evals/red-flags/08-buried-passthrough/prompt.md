---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Anything off in this user service?

```python
# users/service.py
import hashlib
import secrets
from datetime import datetime, timedelta, timezone


class UserStore:
    def __init__(self, db):
        self.db = db

    def get(self, user_id):
        return self.db.fetch_one("SELECT * FROM users WHERE id = ?", user_id)

    def find_by_email(self, email):
        return self.db.fetch_one("SELECT * FROM users WHERE email = ?", email.lower())

    def insert(self, user):
        return self.db.insert("users", user)

    def update(self, user_id, fields):
        self.db.update("users", user_id, fields)

    def delete(self, user_id):
        self.db.delete("users", user_id)

    def list_active(self):
        return self.db.fetch_all("SELECT * FROM users WHERE active = 1")


class CachedUserStore:
    def __init__(self, store, cache):
        self.store = store
        self.cache = cache

    def get(self, user_id):
        hit = self.cache.get(f"user:{user_id}")
        if hit is not None:
            return hit
        user = self.store.get(user_id)
        self.cache.set(f"user:{user_id}", user, ttl=300)
        return user

    def find_by_email(self, email):
        return self.store.find_by_email(email)

    def insert(self, user):
        return self.store.insert(user)

    def update(self, user_id, fields):
        return self.store.update(user_id, fields)

    def delete(self, user_id):
        return self.store.delete(user_id)

    def list_active(self):
        return self.store.list_active()


class UserService:
    def __init__(self, store, mailer, clock=None):
        self.store = store
        self.mailer = mailer
        self.clock = clock or (lambda: datetime.now(timezone.utc))

    def register(self, email, password):
        if self.store.find_by_email(email):
            raise ValueError("email already registered")
        salt = secrets.token_hex(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
        user_id = self.store.insert({
            "email": email.lower(),
            "salt": salt,
            "password_hash": digest.hex(),
            "active": 1,
            "created_at": self.clock().isoformat(),
        })
        self.mailer.send(email, "Welcome!", "Thanks for signing up.")
        return user_id

    def authenticate(self, email, password):
        user = self.store.find_by_email(email)
        if not user or not user["active"]:
            return None
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), user["salt"].encode(), 200_000)
        if not secrets.compare_digest(digest.hex(), user["password_hash"]):
            return None
        self.store.update(user["id"], {"last_login": self.clock().isoformat()})
        return user

    def find_by_email(self, email):
        return self.store.find_by_email(email)

    def start_password_reset(self, email):
        user = self.store.find_by_email(email)
        if not user:
            return
        token = secrets.token_urlsafe(32)
        expires = self.clock() + timedelta(hours=1)
        self.store.update(user["id"], {"reset_token": token, "reset_expires": expires.isoformat()})
        self.mailer.send(email, "Reset your password", f"Token: {token}")

    def deactivate_stale(self, days=365):
        cutoff = self.clock() - timedelta(days=days)
        count = 0
        for user in self.store.list_active():
            last = user.get("last_login") or user["created_at"]
            if datetime.fromisoformat(last) < cutoff:
                self.store.update(user["id"], {"active": 0})
                count += 1
        return count
```
