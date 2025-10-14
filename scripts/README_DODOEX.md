# Dodoex PMM Integration Guide (ChainID 138)

## Steps

1. Deploy Dodoex PMM contracts on ChainID 138 (see dodoex_deploy_contracts.md)
2. Update `/src/config/currencies.ts` with deployed token, pool, and WETH addresses, plus target prices.
3. Run `dodoex_create_pools.js` to batch-create pools for all tokens.
4. Run `dodoex_fund_pools.js` to deposit initial liquidity into each pool.
5. Run `dodoex_auto_trader.js` to enable auto-trading and price stabilization.
6. Monitor pools and adjust target prices as needed.

## Security
- Store private keys securely.
- Test scripts on testnet before mainnet.
- Monitor for failed transactions and pool health.
