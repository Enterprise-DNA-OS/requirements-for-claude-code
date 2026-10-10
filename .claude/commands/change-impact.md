# change-impact

Follow inbound links transitively. Include dependent requirements and test procedures. This is recorded-link impact only, not proof that every dependency has been captured.

```bash
npm run requirements -- change-impact --ref="SRS:1"
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
