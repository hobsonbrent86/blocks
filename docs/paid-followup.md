# Paid Follow-up Structure

**Status:** Saved for later. Not in scope for OSS v1.

Return to this doc when OSS v1.0 ships and there is adoption signal (GitHub stars, npm downloads, teams using Cursor pack).

---

## Positioning

OSS owns the **religion and local enforcement**:

- Spec, creed, ontology
- CLI, verify, lint, test
- Cursor rules, skills, hooks, local MCP
- GitHub Action
- Reference examples

Paid owns **team scale, discovery, and feedback loops** OSS cannot do well alone.

One-liner:

> Free: blocks compile. Paid: blocks compose at org scale.

---

## Product name (working)

**Blocks Cloud** or **Blocks Studio** — decide at monetization time. OSS repo stays `blocks-dev/blocks`.

---

## Tier structure

### Free — `$0` (the OSS stack)

Everything in [oss-build-plan.md](./oss-build-plan.md):

- `blocks-cli`, `@blocks/verify`, `@blocks/schemas`, `@blocks/mcp`
- Cursor integration
- GitHub Action
- Public example templates
- Local block registry (filesystem only)
- Community Discord / GitHub discussions

No account required.

---

### Team — `$19/seat/month` (target; validate with design partners)

**For:** 5–50 engineer teams standardizing AI-assisted development.

| Feature | Description |
|---------|-------------|
| **Org block registry** | Search blocks across connected repos |
| **Graph sync** | `.blocks/` synced to cloud; PR graph diff UI |
| **Shared policy packs** | Org-wide required layers, allowed species, banned heresies |
| **Team Cursor pack** | Managed rules/skills version pinned by admin |
| **PR graph review** | Web UI: graph diff, contract diff, approve topology |
| **Basic analytics** | Blocks per repo, verify failure trends, reuse rate |
| **Seats + roles** | Admin, blockwright, blocksmith |

**Limits:**

- 10 connected repos
- 90-day analytics retention
- Email support

---

### Business — `$49/seat/month`

**For:** Compliance-conscious or 50+ engineer orgs.

Everything in Team, plus:

| Feature | Description |
|---------|-------------|
| **SSO / SAML** | Okta, Google Workspace |
| **Audit log** | Who changed graph, policy, heresy approvals |
| **Custom layers** | Org-defined mandatory layers beyond standard four |
| **Heresy workflow** | Mega-block / N/A layer requires approver |
| **Advanced analytics** | Cross-repo failure correlation, fragile graph detection |
| **SLA support** | 24h response |
| **Unlimited repos** | |

---

### Enterprise — custom

- Self-hosted registry option
- VPC / private cloud
- Custom contract types
- Professional services: graph migration, block explosion audits
- Annual contract

---

## Usage-based add-ons (optional, either tier)

| Add-on | Model | Description |
|--------|-------|-------------|
| **AI decompose API** | Per 1k requests | "Break this feature into a proposed graph" |
| **Contract codegen** | Per repo/month | Generate TS/Python types from contracts at scale |
| **Production telemetry** | Per 1M events | Block-level failure rates from instrumented apps |
| **Premium templates** | Per pack or subscription | Stripe signup, HIPAA ingest, etc. |

Keep core verify free forever. Never paywall `blocks verify`.

---

## Cloud architecture (high level)

```
┌──────────────┐     sync      ┌─────────────────────┐
│  Dev repo    │ ────────────► │  Blocks Cloud API   │
│  .blocks/    │ ◄──────────── │  (registry, policy) │
└──────────────┘   policy pull └──────────┬──────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Graph store           Policy engine          Analytics
              (Postgres)            (rules eval)           (events)
```

### Sync model

- CLI: `blocks cloud login` + `blocks cloud sync`
- GitHub App (optional): auto-sync on push to main
- Conflict resolution: repo wins locally; cloud wins for org policy overlay

### Auth

- GitHub OAuth for individuals
- SAML for Business
- API keys for CI sync (read-only vs read-write scopes)

### Data stored

| Data | Purpose |
|------|---------|
| Contract YAML | Registry search, diff |
| Graph YAML | PR review UI, analytics |
| Verify results | Trends (no source code) |
| Policy YAML | Org enforcement |

**Not stored by default:** block Core source code. Metadata only unless user opts into code indexing.

---

## Paid Cursor / agent features

| Feature | Tier | Description |
|---------|------|-------------|
| Org-aware MCP | Team | MCP queries cloud registry, not just local |
| Policy-enforced skills | Team | Skills refuse heresies blocked by org policy |
| Cross-repo reuse hints | Team | "Org has 3 similar Validate blocks" |
| Managed skill updates | Team | Admin pushes skill version; devs auto-refresh |
| AI graph propose | Usage | Decompose feature → proposed graph PR |
| Session analytics | Business | Which blocks get most AI edit churn (quality signal) |

Agent enforcement path:

```
Local:  rules + skills + hooks + verify     (OSS, always)
Cloud:  policy overlay + org registry       (paid, optional)
```

Paid never replaces local verify. Cloud policy is **strict superset** — can add rules, cannot disable OSS checks.

---

## GitHub integration (paid)

| Feature | Tier |
|---------|------|
| Action (verify only) | Free |
| PR graph diff comment | Free (basic markdown) |
| PR graph diff web UI | Team |
| Required graph approval check | Team |
| Org-wide blocks status badge | Team |
| Auto-sync registry on merge | Team |

---

## Go-to-market sequence

1. **OSS launch** — credibility, community, SEO ("block vibe coding", "AI context boundaries")
2. **Design partners** — 3–5 teams using OSS heavily; interview pain (reuse, policy, review)
3. **Team private beta** — registry + graph diff only (smallest paid slice)
4. **GA Team tier** — self-serve billing
5. **Business tier** — after SSO request appears twice
6. **Enterprise** — inbound only

Do not start paid until:

- [ ] OSS v1.0 shipped ≥30 days
- [ ] ≥500 npm downloads/week OR ≥1k GitHub stars OR 3 design partners committed
- [ ] Clear repeated ask: "how do we share blocks across repos?"

---

## Competitive moat (why pay)

| Moat | Weak alone | Strong combined |
|------|------------|-----------------|
| Verify CLI | Copied in a weekend | Commodity |
| Org registry | Needs network effects | Medium |
| Graph-aware PR review | Needs GitHub App + UI | Medium |
| Policy + heresy workflow | Needs admin buyers | Strong for enterprise |
| Production block telemetry | Needs SDK adoption | Strong long-term |

Lead sales conversation with **PR review at graph level**, not "another linter."

---

## Pricing experiments to run later

- Open source maintainer free Team tier (≤5 seats)
- Startup program: Team free for 1 year under 20 engineers
- Usage-only for AI decompose (no seat fee) — test cannibalization
- Marketplace rev share with template authors (70/30)

---

## Legal / business checklist (before charging)

- [ ] Terms of service
- [ ] Privacy policy (what sync stores)
- [ ] SOC 2 roadmap if targeting Business tier
- [ ] Trademark search on "Blocks" + product name
- [ ] Apache 2.0 patent grant on OSS remains clean vs cloud proprietary

---

## Open questions (resolve at paid time)

1. Product name distinct from generic "blocks"
2. Self-hosted vs cloud-only for Enterprise
3. Whether to build web UI or GitHub App–only for v1 paid
4. Code indexing opt-in: worth the privacy complexity?
5. Partnership with Cursor marketplace vs neutral IDE stance

---

## Relationship to this repo

| Repo | Contents |
|------|----------|
| `blocks-dev/blocks` (OSS) | Spec, CLI, verify, integrations — this repo |
| `blocks-dev/blocks-cloud` (future, private) | API, dashboard, GitHub App backend |
| `blocks-dev/block-templates` (future, mixed) | Free community + paid premium templates |

Keep cloud repo separate. Never hide verify checks behind cloud auth.

---

## When you come back to this

1. Read OSS launch metrics against go-to-market gates above
2. Pick smallest paid slice: **org registry + graph diff UI**
3. Run 4-week design partner with manual onboarding (concierge MVP)
4. Automate what partners actually used; ignore what they ignored

The religion stays free. The organization memory is what you sell.
