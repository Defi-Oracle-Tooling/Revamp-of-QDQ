# Wells Fargo Adapters Overview

This document describes the integration points for Wells Fargo API adapters:

- Balances
- Transactions
- ACH Payments
- Wire Transfers
- RTP Payments
- FX Quotes & Trades
- Liquidity Sweeps
- Lockbox Ingestion
- Positive Pay
- Fraud & Sanctions Screening
- Compliance Logging
- Metrics & Monitoring

## Usage

Each adapter exposes async functions for submitting requests and handling responses. See `/src/integrations/wellsfargo/` for implementation details.

## Monitoring & Compliance

Metrics are emitted for reconciliation lag, payment latency, and fetch errors. Compliance events are logged for audit and regulatory purposes.

## Security

All API calls enforce mTLS, OAuth2, and least privilege. Secrets are managed via Azure Key Vault.

## Testing

Unit and integration tests are provided in `/tests/` for all adapters and compliance hooks.
