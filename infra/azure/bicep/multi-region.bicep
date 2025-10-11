// Multi-region deployment template for Quorum networks
// Supports cross-region validator distribution and failover

targetScope = 'subscription'

@description('Primary region for deployment')
param primaryRegion string = 'eastus'

@description('Secondary regions for multi-region deployment')
param secondaryRegions array = ['westus2', 'centralus']

@description('Environment designation')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Network name prefix')
param networkName string = 'quorum'

@description('Consensus mechanism')
@allowed(['ibft', 'qbft', 'clique', 'ethash'])
param consensus string = 'qbft'

@description('Total number of validator nodes')
@minValue(1)
@maxValue(50)
param validatorCount int = 4

@description('Number of RPC nodes per region')
@minValue(1)
@maxValue(10)
param rpcNodesPerRegion int = 1

@description('Deployment type for compute resources')
@allowed(['aks', 'aca', 'vm', 'vmss'])
param deploymentType string = 'aks'

@description('Resource tags')
param tags object = {
  project: 'quorum-quickstart'
  environment: environment
  consensus: consensus
  deployment: 'multi-region'
}

// Variables
var allRegions = union([primaryRegion], secondaryRegions)
var validatorsPerRegion = validatorCount / length(allRegions)
var remainingValidators = validatorCount % length(allRegions)

// Create resource group for each region
resource resourceGroups 'Microsoft.Resources/resourceGroups@2023-07-01' = [for (region, i) in allRegions: {
  name: '${networkName}-${environment}-${region}-rg'
  location: region
  tags: tags
}]

// Deploy to primary region with additional validators if remainder exists
module primaryDeployment 'main.bicep' = {
  name: '${networkName}-${environment}-${primaryRegion}-deployment'
  scope: resourceGroups[0]
  params: {
    location: primaryRegion
    environment: environment
    networkName: networkName
    consensus: consensus
    validatorCount: int(validatorsPerRegion) + remainingValidators
    rpcNodeCount: rpcNodesPerRegion
    deploymentType: deploymentType
    networkMode: 'flat'
    tags: union(tags, {
      region: primaryRegion
      role: 'primary'
    })
  }
}

// Deploy to secondary regions
module secondaryDeployments 'main.bicep' = [for (region, i) in secondaryRegions: {
  name: '${networkName}-${environment}-${region}-deployment'
  scope: resourceGroups[i + 1]
  params: {
    location: region
    environment: environment
    networkName: networkName
    consensus: consensus
    validatorCount: int(validatorsPerRegion)
    rpcNodeCount: rpcNodesPerRegion
    deploymentType: deploymentType
    networkMode: 'flat'
    tags: union(tags, {
      region: region
      role: 'secondary'
    })
  }
}]

// Global networking for cross-region connectivity
module globalNetworking 'modules/global-networking.bicep' = {
  name: '${networkName}-${environment}-global-networking'
  scope: resourceGroups[0]
  params: {
    networkName: networkName
    environment: environment
    regions: allRegions
    tags: tags
  }
}

// Global monitoring and alerting
module globalMonitoring 'modules/global-monitoring.bicep' = {
  name: '${networkName}-${environment}-global-monitoring'
  scope: resourceGroups[0]
  params: {
    networkName: networkName
    environment: environment
    regions: allRegions
    totalValidators: validatorCount
    totalRpcNodes: rpcNodesPerRegion * length(allRegions)
    tags: tags
  }
}

// Outputs
output deploymentSummary object = {
  networkName: networkName
  environment: environment
  consensus: consensus
  regions: allRegions
  validatorDistribution: {
    total: validatorCount
    perRegion: int(validatorsPerRegion)
    primaryRegionExtra: remainingValidators
  }
  rpcNodeDistribution: {
    perRegion: rpcNodesPerRegion
    total: rpcNodesPerRegion * length(allRegions)
  }
  deploymentType: deploymentType
}

output regionalDeployments array = [for (region, i) in allRegions: {
  region: region
  resourceGroup: resourceGroups[i].name
  validators: i == 0 ? int(validatorsPerRegion) + remainingValidators : int(validatorsPerRegion)
  rpcNodes: rpcNodesPerRegion
  role: i == 0 ? 'primary' : 'secondary'
}]

output primaryEndpoints object = primaryDeployment.outputs.endpoints

output secondaryEndpoints array = [for i in range(0, length(secondaryRegions)): secondaryDeployments[i].outputs.endpoints]

output globalNetworkingEndpoints object = globalNetworking.outputs

output globalMonitoringEndpoints object = globalMonitoring.outputs
