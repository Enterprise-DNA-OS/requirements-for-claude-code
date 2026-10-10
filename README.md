# Requirements for Claude Code

Your requirements, verification procedures, traceability links and review evidence in a database you own. See what changed and what still needs proof before the design review.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and run the demo. | Your fields, review rules, ReqView exports and paperwork. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=reqview) · [Instead of ReqView](https://enterprisedna.co/omni/instead-of/reqview?utm_source=github&utm_medium=readme&utm_campaign=reqview)

## Start with a working review

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/requirements-for-claude-code.git
cd requirements-for-claude-code
npm install
npm run demo
npm run requirements -- weekly-review
npm run docs
npm run view
```

Open the folder with Claude Code, Codex, OpenCode or Cursor. AGENTS.md and CLAUDE.md point every runtime to the same commands. Local PGlite needs no separate database install. DATABASE_URL selects PostgreSQL; use a configured trusted operator role. DATA_DIR selects another local directory. Never seed a shared database.

The fictional Kauri Sensor Gateway demo has a changed buffering requirement with stale passing evidence, a failed timing test, an unowned access requirement and a current label inspection. Dates are relative to today. Seeding twice preserves existing rows.

## The weekly rituals

Monday: /weekly-review combines readiness, attention, changed links and workload. Before a design review: /source-gaps, /review-queue and /change-impact. At the meeting: /approve records the human decision and its evidence, then /baseline preserves the review snapshot. After changes: /suspect-links and /confirm-link. During verification: /record-run records the supplied result and evidence, then /coverage checks whether it still applies. /draft-spec and /draft-review write drafts and never send.

29 CLI commands and 33 slash-command recipes, including /docs, /view, /customise and /new-view. Every CLI command accepts --json. Case-insensitive names, exact codes and partial UUIDs work; ambiguous matches list candidates and exit with failure. Run help for the full list.

## Evidence that stays tied to a revision

A changed requirement or procedure increments its revision and clears approval. Links remember both revisions; a change makes the link suspect. Test runs capture the current procedure revision and all linked requirement revisions. Readiness requires requirement approval and a current passing result for every active linked procedure. A later failed result replaces an earlier pass in readiness checks. Confirming a link does not rewrite old evidence. Requirements approval is a review decision, not proof of test success.

The history records actor, before/after values and notes. Baselines capture records, links and evidence and support comparisons. Administrators can still alter the database, so these are not tamper-proof records or electronic signatures. /compliance checks record completeness, review deadlines and personal-information purpose reminders; it does not certify engineering or legal compliance. [Rules and sources](docs/compliance.md).

## Ten questions this build answers

These demonstrate tested capabilities, not a claim that ReqView cannot answer them.

1. Which passing tests refer to an older requirement revision? Run coverage.
2. Which links need review after either endpoint changed? Run suspect-links.
3. Which requirements have no linked test procedure? Run coverage.
4. Which approved requirements still lack current passing evidence? Run release-readiness.
5. What else is affected if we change the buffer requirement? Run change-impact --ref=SRS:1.
6. Who has the largest overdue review queue? Run owner-load.
7. Which requirements have no source reference? Run source-gaps.
8. What changed since our recorded design review? Run baseline-diff --ref=REVIEW-01.
9. Which personal-information records need a purpose review? Run compliance.
10. Who changed a record and what did it say before? Run activity.

## Bring your history

Export each ReqView document as CSV. Create its destination document, then import it in one command:

```bash
npm run requirements -- import reqview --document=SRS --file=imports/SRS.csv --actor="Your name" --dry-run
npm run requirements -- import reqview --document=SRS --file=imports/SRS.csv --actor="Your name"
```

The importer retains every original column. Repeated identical rows are unchanged; changed rows require explicit --update. Link columns remain available for reviewed mapping; attachments, formatting and historical approvals are separate migration work. [Export steps, mapping and reconciliation](docs/replace-reqview.md).

## Documents and views

Change brand.json once. npm run docs produces specifications, verification matrices and review records. npm run view produces weekly, traceability and workload snapshots. Print HTML to PDF after checking it. Generated files remain private and are excluded from version control. [What a screen adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our business name and logo on the specification.
2. Import one document without saving it.
3. Map our custom owner field.
4. Add our review due dates.
5. Link each procedure to its requirement.
6. Show changed requirements with old passing evidence.
7. Add a customer reference field.
8. Group overdue reviews by owner.
9. Capture the next review as a baseline.
10. Prepare our verification matrix.

/customise writes a migration, applies it and tests the requested rule. /new-view adds a read-only report. The free version has no application front end.

## Price context

ReqView publishes annual named-user and concurrent-licence plans. Twelve Enterprise floating clients at EUR 1,800 each imply EUR 21,600 annually. This is a scenario from a public rate, not an actual customer bill; free readers and shared licensing can reduce the needed licence count. [Vendor pricing](https://www.reqview.com/pricing/), checked 10 October 2026. [Selection and evidence](docs/research.md).

## Verification

npm test uses a temporary database, migrates and seeds twice, exercises all 29 CLI commands, and checks changed evidence, approvals, latest failures, cycles, baselines, import rollback, idempotency, mapping, provenance, exports, drafts and escaped HTML. CI defines Node 20/22 on Linux and Windows, plus PostgreSQL 17. TEST_DATABASE_URL must point to an empty disposable database. See the actual CI results before claiming an environment passed.

## Built and run for you

Enterprise DNA brings across your agreed records, checks the result, builds your review rules and documents, and adds a web front end or a different stack when agreed. Omni by Enterprise DNA runs the system for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=reqview).

MIT. Not affiliated with ReqView or Anthropic. Hosting and agent usage have their own costs.
