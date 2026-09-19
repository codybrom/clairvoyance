---
max_turns: 5
timeout_seconds: 120
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Rename `getUsr` to `getUser` everywhere in this snippet and show me the result.

```js
export async function getUsr(id) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

export async function getUsrName(id) {
  const u = await getUsr(id);
  return u.name;
}

export async function greet(id) {
  const u = await getUsr(id);
  return `Hello, ${u.name}`;
}
```
