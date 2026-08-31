# Baseline QA suite

Run the current Support Agent against the fixed baseline scenarios:

```powershell
npm run qa:baseline
```

The runner calls the production `evaluateSupportRequest()` function directly and loads the production Help Center JSON. It writes:

- `qa/baseline-results.json` — machine-readable full results
- `qa/baseline-report.md` — QA table, metrics, failure analysis, and recommendations

Use `node qa/baseline-suite.mjs --strict` when CI should return a non-zero exit code if any scenario fails.
