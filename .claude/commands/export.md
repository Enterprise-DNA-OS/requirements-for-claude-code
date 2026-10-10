# export

Export the complete JSON backup or use --kind=items for CSV. Exports contain operational records; keep them private. JSON includes baselines and original import columns.

```bash
npm run requirements -- export --file=exports/requirements.json
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
