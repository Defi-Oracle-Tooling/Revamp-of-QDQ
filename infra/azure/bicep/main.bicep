// Phase 2 Azure deployment scaffold
// This is a placeholder Bicep template. Future phases will parameterize
// network resources, container deployments, monitoring, and security.
// NOTE: Not used by CLI yet; validation layer will later parse schemas.

param location string = resourceGroup().location
param environment string = 'dev'
param consensus string = 'ibft' // matches CLI consensus option
param nodeCount int = 4

// Placeholder output until real resources are added
output summary object = {
  message: 'Azure scaffold deployed (placeholder)'
  consensus: consensus
  nodeCount: nodeCount
  environment: environment
  location: location
}
