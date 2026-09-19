---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Review this diff before I merge it. It adds support for users imported from the partner portal.

```diff
--- a/users/service.py
+++ b/users/service.py
@@ -12,14 +12,22 @@ class UserService:
-    def create_user(self, name, email, role, team, locale, tz, send_welcome):
-        self.validate({"name": name, "email": email, "role": role})
+    def create_user(self, name, email, role, team, locale, tz, send_welcome,
+                    is_partner_import=False):
+        source = "partner_portal" if is_partner_import else "signup"
+        self.validate({"name": name, "email": email, "role": role}, source=source)
         user = User(name=name, email=email, role=role, team=team,
                     locale=locale, tz=tz)
         self.repo.save(user)
-        if send_welcome:
+        if send_welcome and not is_partner_import:
             self.mailer.welcome(user)
         return user
 
-    def validate(self, fields):
+    def validate(self, fields, source="signup"):
         for key in ("name", "email", "role"):
             if not fields.get(key):
+                if source == "partner_portal" and key == "role":
+                    fields["role"] = "viewer"
+                    continue
                 raise ValidationError(f"missing {key}")
+        if source == "partner_portal":
+            fields["email"] = fields["email"].lower().strip()
         if "@" not in fields["email"]:
             raise ValidationError("bad email")
```
