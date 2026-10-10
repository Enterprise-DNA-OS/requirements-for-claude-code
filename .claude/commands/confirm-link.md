# confirm-link

Read both endpoint revisions and the old link. Require evidence that the relationship still holds. Confirming a link does not make old test results current.

```bash
npm run requirements -- confirm-link --from="TEST:1" --to="SRS:1" --kind=verification --evidence="Revised coverage reviewed" --actor="Your name"
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
