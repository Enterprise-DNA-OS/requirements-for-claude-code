# record-run

Read the procedure and its linked requirements first. Only record a result supplied by the operator with an evidence reference. The command records evidence; it never performs a test or invents a pass. Run confirm-link after reviewing changed links.

```bash
npm run requirements -- record-run --ref="TEST:1" --result=pass --evidence="Evidence location" --actor="Your name"
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
