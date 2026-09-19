---
type: llm
focus: last_message
---
PASS if each design the answer proposes specifies how a plugin (1) adds a subcommand AND (2) participates in config loading (contributing defaults and/or validating its section), and how the CLI discovers installed plugin packages.
FAIL if any proposed design leaves out subcommands or config participation, or if discovery of pip-installed plugins is never addressed in any design.
