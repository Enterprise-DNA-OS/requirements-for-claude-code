# baseline

Capture items, links, runs and history for the review. Baselines cannot be edited by this CLI. Record the meeting evidence and compare later with baseline-diff.

```bash
npm run requirements -- baseline --code=REVIEW-01 --evidence="Review minutes" --actor="Your name"
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
