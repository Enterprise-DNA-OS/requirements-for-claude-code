# Requirements for Claude Code

For engineering teams managing requirements, verification procedures, review evidence and traceability. The database is the source of truth. Ask the operator for their business name, owner and review cadence when they customise the demo.

## Work from records

Run npm run requirements -- help. Every command accepts --json. Read before writing. Ambiguous identifiers list matches and exit with failure. Every mutation requires --actor. Never record a pass or approval without a human-supplied evidence reference. Never send, publish or delete records. Drafts stay in drafts/.

## The weekly jobs

| Ask | Recipe |
|---|---|
| coverage | /coverage |
| attention | /attention |
| suspect-links | /suspect-links |
| review-queue | /review-queue |
| overdue-reviews | /overdue-reviews |
| source-gaps | /source-gaps |
| owner-load | /owner-load |
| release-readiness | /release-readiness |
| run-history | /run-history |
| activity | /activity |
| compliance | /compliance |
| help | /help |
| list | /list |
| show | /show |
| weekly-review | /weekly-review |
| change-impact | /change-impact |
| add | /add |
| update | /update |
| log | /log |
| link | /link |
| confirm-link | /confirm-link |
| record-run | /record-run |
| approve | /approve |
| baseline | /baseline |
| baseline-diff | /baseline-diff |
| import | /import |
| export | /export |
| draft-spec | /draft-spec |
| draft-review | /draft-review |
| docs | /docs |
| view | /view |
| customise | /customise |
| new-view | /new-view |

Monday's review combines readiness, attention and suspect links. Requirements approval is separate from successful verification. Content changes increment revision and clear approval. All linked active tests must have a current pass for readiness. Changed requirements and procedures make earlier results stale. Confirm a changed link only after review.

## Files

One CLI: scripts/requirements.mjs. One database adapter: scripts/lib/db.mjs. Migrations: supabase/migrations. Commands: .claude/commands. Brand: brand.json. Documents: documents.json. Reports: views.json. Do not create another workflow library.

Use local PGlite by default. DATABASE_URL selects PostgreSQL. Never seed a shared database. Run npm test before shipping a change. TEST_DATABASE_URL must point to an empty disposable PostgreSQL database. RLS is enabled without public access policies: a configured trusted operator role is required for shared use. This is not a multi-tenant service.

## Customisation

/customise writes a new migration and updates validation, commands and tests. /new-view adds a read-only report. Retire records with update --status=retired; never delete to hide a failed result. Baselines and history can be altered by a database administrator and are not tamper-proof.

Omni by Enterprise DNA installs, customises and operates this system. https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=reqview
