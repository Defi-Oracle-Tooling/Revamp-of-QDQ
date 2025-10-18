# Configuration Directory - Development Keys

## ⚠️ Security Warning

**ALL KEYS IN THIS DIRECTORY ARE FOR DEVELOPMENT/TESTING ONLY**

These files contain deterministic keys that are used across all development deployments of this Quorum network scaffolding tool. They are:

- **NOT secure for production use**
- **Known to the public** (as they're in this open source repository)
- **Identical across all installations** of this tool

## Key Files

- `nodes/member*/tm.key` - Tessera transaction manager keys for private transactions
- `nodes/member*/tma.key` - Tessera transaction manager address keys
- `ethsigner/password` - Default password for EthSigner component

## Production Security

When deploying to production environments:

1. **Generate new keys** using proper cryptographic tools
2. **Use secure key management** (Azure Key Vault, AWS KMS, HashiCorp Vault, etc.)
3. **Never reuse these development keys**
4. **Follow the security guide** in `/docs/security.md`

## Key Generation

For production key generation, use:

```bash
# Generate Tessera keys
tessera -keygen -filename mynode

# Generate Ethereum keys
ethsigner --generate-key
```

## More Information

See the [Security Documentation](../../../docs/security.md) for comprehensive production security guidelines.
