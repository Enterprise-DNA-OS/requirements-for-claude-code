# Bring ReqView records across

Checked 10 October 2026. [ReqView CSV documentation](https://www.reqview.com/doc/export-csv/) and [traceability documentation](https://www.reqview.com/doc/requirements-traceability-links/).

In ReqView, open a document, choose File, Export, CSV File. Repeat for each requirement and verification document. The documented standard headers include id, heading, text, hierarchy columns, custom attributes and link types. CSV does not carry rich formatting and attachments. Keep the original project and attachment archive.

## One command per exported document

Create the receiving document once:

```bash
npm run requirements -- add --kind=document --code=SRS --title="System requirements" --actor="Your name"
npm run requirements -- import reqview --document=SRS --file=imports/SRS.csv --actor="Your name" --dry-run
npm run requirements -- import reqview --document=SRS --file=imports/SRS.csv --actor="Your name"
```

Use --kind=test for a test-procedure document. Import runs as a single transaction. Every row must have an id, heading and text column; a blank heading becomes Object followed by its id. Duplicate ids or invalid values stop the entire file. The sample fixtures/reqview.csv is synthetic, based on the documented headers, not a captured customer's export.

| Export | Destination |
|---|---|
| id | external_id, scoped to destination document |
| heading | heading |
| text | body |
| owner, source, method, priority, due_on | Same named fields when present and valid |
| level, section, origin, status, custom fields, link columns | Original source_data, retained verbatim |

The display code is document code plus colon plus original id. Imported records start draft, regardless of exported approval status. No approval or test result is inferred. Standard methods are test, inspection, analysis and demonstration. Dates are YYYY-MM-DD. Custom header names can be mapped with --map=fixtures/field-map.json; keys are destination fields and values are CSV headers. The map supports id and the fields listed in the CLI's changeFields list.

Link columns are preserved but not automatically reconstructed: vendor link directions, qualified identifiers and custom types must be reviewed. Use link to create each verified relationship, from the test to the requirement for verification. Use derives or depends for requirement relationships. The command rejects self-links and dependency cycles. Exporting several documents is not a one-file migration.

Repeat imports with identical source rows do nothing. Changed rows stop unless --update is supplied after review. Changed source rows reset affected item approval and invalidate old verification through revision changes. Omitted optional fields do not erase existing local values; use update with an explicit empty field if that is intended. Original columns remain in source_data. A repeat with a different mapping but identical raw rows does not remap existing records; review and update those fields explicitly.

## Reconcile before switching

Compare counts and ids per document, inspect long text and non-English characters, map every required link, and review unassigned ownership. Export JSON to keep originals, links, run evidence, history and baselines. Run coverage, suspect-links and release-readiness. Rich formatting, attachments, Git history, external integrations and historical test runs need separate migration work. Enterprise DNA scopes and performs that work for the installed version. Keep ReqView available until the team accepts the reconciled result.
