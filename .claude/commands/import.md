# import

Read docs/replace-reqview.md. Start with a dry run. Create the destination document first with add --kind=document. Confirm mapping and totals before applying. Raw link columns are retained but never interpreted automatically. Identical rows repeat safely; changed rows need explicit --update after review.

```bash
npm run requirements -- import reqview --document=SRS --file=imports/reqview.csv --actor="Your name" --dry-run
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
