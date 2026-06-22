# Changelog

## 0.1.0 — 2026-06-22

Initial OSS release.

### Added

- Block contract + graph JSON Schema
- `@blocks/verify` — creed and structure checks, graph progress, graph e2e tests
- `blocks-cli` — verify, test, inspect, studio, progress, init, new, doctor, lint
- Block Inspector and Block Studio traffic-light UI
- Fixture-based block and graph testing
- Cursor rules, skills, and MCP integration (`blocks cursor install`)
- Claude Code CLAUDE.md, skills, and MCP integration (`blocks claude install`)
- GitHub Action for CI merge gates
- Signup reference example (5 blocks)

### Known limitations

- TypeScript blocks only (reference implementation)
- npm packages require publish before `npm install -g blocks-cli` works for external users
