# approve

This records a human review decision. Require the reviewer name and evidence. Approval does not mean verification has passed. A later content or metadata change clears approval.

```bash
npm run requirements -- approve --ref="SRS:1" --evidence="Approved review minutes" --actor="Your name"
```

Use --json for structured output. The operator supplies all values shown as examples. For changes, inspect the affected records first, run the command, then read them again. If a name is ambiguous, list the matches and stop.
