# Securing Secrets in Azure Key Vault

## 1. Create Azure Key Vault
- Go to Azure Portal > Create a resource > Key Vault
- Name your vault (e.g., DodoexSecretsVault)
- Assign to your resource group and region

## 2. Store Secrets
- In Key Vault > Secrets > + Generate/Import
- Add secrets for:
  - PRIVATE_KEY
  - RPC_URL
  - Any other sensitive config

## 3. Access Secrets in Node.js
Install Azure SDK:
```
npm install @azure/identity @azure/keyvault-secrets
```

Example usage:
```js
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const vaultName = 'DodoexSecretsVault';
const url = `https://${vaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const client = new SecretClient(url, credential);

async function getSecret(secretName) {
  const secret = await client.getSecret(secretName);
  return secret.value;
}

// Usage:
// const privateKey = await getSecret('PRIVATE_KEY');
```

## 4. Update Scripts
- Replace hardcoded secrets with calls to `getSecret()`
- Use environment variables for vault name if needed

## 5. Security
- Assign least-privilege access to Key Vault
- Use managed identities for VMs or Azure Functions
- Rotate secrets regularly
