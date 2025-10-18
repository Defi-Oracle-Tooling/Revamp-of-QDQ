# TESTING

Holds curated test scenario manifests separate from Jest code.

Scenario Manifest Example (`wells-fargo-reconciliation.scenario.json`):
```jsonc
{
  "id": "wf-reconciliation-basic",
  "connectors": ["wells-fargo"],
  "mode": "simulation",
  "steps": [
    { "action": "fetchBalances" },
    { "action": "fetchTransactions" },
    { "action": "reconcile", "accountId": "SIM-USD-001" }
  ],
  "assertions": {
    "duplicateExternalRefs": 0,
    "newTransactionsMin": 1
  }
}
```
