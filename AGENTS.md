# AGENTS.md

Guidance for AI coding agents working in this repository. For what Clairvoyance is and how to install it, see [README.md](README.md).

## Layout

- `skills/<name>/SKILL.md`: the skills themselves, each with YAML frontmatter (`name`, `description`) and optional `references/` files. This is the product.
- `agents/`: subagent definitions used by skills (e.g. `clean-room-alternative.md` for `design-it-twice`).
- `evals/<skill>/`: `claude plugin eval` suites. Each suite's README explains how to run it and what its graders score.
- Platform manifests: `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.kimi-plugin/`, `.agents/`, `.codex/`, `.gemini/`, `.opencode/`, `gemini-extension.json`, `plugin.json`, `package.json`.
- `docs/`: the clairvoyance.fyi site (Astro). It reads `skills/` at build time, so skill edits show up there automatically.
- `server.json`: the hosted MCP server's entry for the official MCP Registry. Its version is kept in sync by `scripts/bump-version.sh`.
- `docs/edge/`: the Cloudflare Worker in front of the site. It serves Markdown versions of pages via `Accept: text/markdown` and the read-only MCP server at `/mcp`. Cloudflare Workers Builds deploys it on every push to `main`. To deploy by hand, run `npx wrangler deploy` from that directory with `CLOUDFLARE_ACCOUNT_ID` set.

## Writing skills

- Skills translate *A Philosophy of Software Design* into checks an agent can run on real code. New or changed guidance should reinforce that philosophy, not general code-review advice.
- Follow the [`writing-skills`](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) process: write a failing scenario first, then the skill, then verify.
- A skill's `description` decides when it triggers. Changes to a description can change triggering for neighboring skills, so re-run the relevant eval suite.
- Keep `SKILL.md` focused; move long reference material into `references/`.
- The pillar each skill belongs to is defined in `docs/src/utils/skills.ts`. Add new skills there too.

## Checks

Run before committing:

```bash
scripts/check-skills.sh          # skill and agent frontmatter consistency
scripts/bump-version.sh --check  # every manifest carries the same version
claude plugin validate . --strict
```

For site changes:

```bash
cd docs && npm ci && npm run build && npm test
```

## Conventions

- Commit messages use conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `evals:`.
- Bump versions only with `scripts/bump-version.sh <version>`, never by hand, and record the change in `CHANGELOG.md`.
- Eval runs cost real money (see each suite's README). Don't start one unless asked.
