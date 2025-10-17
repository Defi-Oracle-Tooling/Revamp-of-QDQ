# Wells Fargo Integration Documentation Export

## Architecture
- Modular adapter pattern for all banking services
- DTO normalization and persistence pipeline
- Compliance, fraud, and security hooks

## API Usage
- Each adapter exposes async functions for submitting requests and handling responses
- See `/src/integrations/wellsfargo/` for implementation details

## Monitoring & Compliance
- Metrics emitted for reconciliation lag, payment latency, and fetch errors
- Compliance events logged for audit and regulatory purposes

## Security
- All API calls enforce mTLS, OAuth2, and least privilege
- Secrets managed via Azure Key Vault

## Testing
- Unit and integration tests in `/tests/` for all adapters and compliance hooks

## Deployment
- See `/scripts/deployment/runbook.md` for step-by-step deployment and troubleshooting
