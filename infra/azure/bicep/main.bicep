// Main Azure deployment template for Quorum networks
// Supports multi-region deployment with AKS, ACA, VM, and VMSS options

@description('Primary deployment location')
param location string = resourceGroup().location

@description('Environment designation')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Network name prefix for resources')
param networkName string = 'quorum'

@description('Consensus mechanism for the blockchain network')
@allowed(['ibft', 'qbft', 'clique', 'ethash'])
param consensus string = 'ibft'

@description('Number of validator nodes')
@minValue(1)
@maxValue(50)
param validatorCount int = 4

@description('Number of RPC nodes')
@minValue(1)
@maxValue(20)
param rpcNodeCount int = 1

@description('Default deployment type for nodes')
@allowed(['aks', 'aca', 'vm', 'vmss'])
param deploymentType string = 'aks'

@description('Network mode configuration')
@allowed(['flat', 'hub-spoke', 'isolated'])
param networkMode string = 'flat'

@description('Resource tags')
param tags object = {
  project: 'quorum-quickstart'
  environment: environment
  consensus: consensus
}

// Variables
var namePrefix = '${networkName}-${environment}'
var totalNodeCount = validatorCount + rpcNodeCount

// Deploy compute resources based on deployment type
module compute 'modules/compute.bicep' = {
  name: '${namePrefix}-compute'
  params: {
    location: location
    namePrefix: namePrefix
    nodeCount: totalNodeCount
    deploymentType: deploymentType
    validatorCount: validatorCount
    rpcNodeCount: rpcNodeCount
    tags: tags
  }
}

// Deploy networking based on network mode
// Using networking module (supports networkMode & tags)
module networking 'modules/networking.bicep' = {
  name: '${namePrefix}-networking'
  params: {
    location: location
    namePrefix: namePrefix
    networkMode: networkMode
    tags: tags
  }
}

// Deploy monitoring if enabled
module monitoring 'modules/monitoring.bicep' = {
  name: '${namePrefix}-monitoring'
  params: {
    location: location
    namePrefix: namePrefix
    nodeCount: totalNodeCount
    tags: tags
  }
}

// Outputs
output resourceGroupName string = resourceGroup().name
output deploymentSummary object = {
  networkName: networkName
  environment: environment
  consensus: consensus
  location: location
  validatorCount: validatorCount
  rpcNodeCount: rpcNodeCount
  deploymentType: deploymentType
  networkMode: networkMode
  totalNodes: totalNodeCount
}

output endpoints object = {
  compute: compute.outputs
  networking: networking.outputs
  monitoring: monitoring.outputs
}
