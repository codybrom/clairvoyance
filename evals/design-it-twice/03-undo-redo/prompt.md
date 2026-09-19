---
max_turns: 10
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
We need to add undo/redo to our collaborative text editor (TypeScript). Several users edit the same document at once; edits already sync between clients through our own operation log on the server (each op is insert/delete at a position, with the server assigning a sequence number). How should I structure undo/redo?
