---
max_turns: 10
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
I'm about to write the interface for a plugin system for our internal CLI tool (Python, built on argparse). Plugins need to be able to add new subcommands, and also hook into config loading (e.g. a plugin can contribute default config values or validate its own config section). Plugins are installed as separate pip packages. What should the plugin API look like?
