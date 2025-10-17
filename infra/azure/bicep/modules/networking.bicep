// Networking module for Quorum deployments
// Supports flat, hub-spoke, and isolated network topologies

@description('Deployment location')
param location string

@description('Resource name prefix')
param namePrefix string

@description('Network topology mode')
@allowed(['flat', 'hub-spoke', 'isolated'])
param networkMode string = 'flat'

@description('Resource tags')
param tags object = {}

// Variables
var vnetName = '${namePrefix}-vnet'
var nsgName = '${namePrefix}-nsg'
var addressPrefix = '10.0.0.0/16'

// Network Security Group
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-06-01' = {
  name: nsgName
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowQuorumP2P'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '21000'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowRPC'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '8545'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1001
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowWebSocket'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '8546'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1002
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowSSH'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1100
          direction: 'Inbound'
        }
      }
    ]
  }
}

// Virtual Network - Flat topology
resource vnetFlat 'Microsoft.Network/virtualNetworks@2023-06-01' = if (networkMode == 'flat') {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: 'validators'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
      {
        name: 'rpc-nodes'
        properties: {
          addressPrefix: '10.0.2.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
      {
        name: 'monitoring'
        properties: {
          addressPrefix: '10.0.3.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
    ]
  }
}

// Hub-Spoke topology (simplified for now)
resource vnetHub 'Microsoft.Network/virtualNetworks@2023-06-01' = if (networkMode == 'hub-spoke') {
  name: '${vnetName}-hub'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/24'
      ]
    }
    subnets: [
      {
        name: 'gateway'
        properties: {
          addressPrefix: '10.0.0.0/26'
        }
      }
    ]
  }
}

resource vnetSpoke 'Microsoft.Network/virtualNetworks@2023-06-01' = if (networkMode == 'hub-spoke') {
  name: '${vnetName}-spoke'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.1.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'nodes'
        properties: {
          addressPrefix: '10.1.1.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
    ]
  }
}

// Isolated topology
resource vnetIsolated 'Microsoft.Network/virtualNetworks@2023-06-01' = if (networkMode == 'isolated') {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: 'isolated-nodes'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
    ]
  }
}

// Outputs
output networkMode string = networkMode
output vnetName string = networkMode == 'flat' ? vnetFlat.name : (networkMode == 'hub-spoke' ? vnetHub.name : vnetIsolated.name)
output vnetId string = networkMode == 'flat' ? vnetFlat.id : (networkMode == 'hub-spoke' ? vnetHub.id : vnetIsolated.id)
output nsgName string = nsg.name
output nsgId string = nsg.id

output subnets array = networkMode == 'flat' ? [
  {
    name: 'validators'
    id: vnetFlat.properties.subnets[0].id
  }
  {
    name: 'rpc-nodes'  
    id: vnetFlat.properties.subnets[1].id
  }
] : []
