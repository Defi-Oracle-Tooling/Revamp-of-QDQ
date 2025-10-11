// Global networking module for multi-region Quorum deployments
// Handles VNet peering and cross-region connectivity

@description('Network name prefix')
param networkName string

@description('Environment designation')
param environment string

@description('List of regions for deployment')
param regions array

@description('Resource tags')
param tags object = {}

// Variables
var namePrefix = '${networkName}-${environment}'

// Virtual Network Gateway for cross-region connectivity
resource vpnGateway 'Microsoft.Network/virtualNetworkGateways@2023-06-01' = {
  name: '${namePrefix}-vpn-gateway'
  location: regions[0]
  tags: tags
  properties: {
    ipConfigurations: [
      {
        name: 'default'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          publicIPAddress: {
            id: gatewayPublicIP.id
          }
          subnet: {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', '${namePrefix}-vnet', 'GatewaySubnet')
          }
        }
      }
    ]
    sku: {
      name: 'VpnGw1'
      tier: 'VpnGw1'
    }
    gatewayType: 'Vpn'
    vpnType: 'RouteBased'
    enableBgp: false
  }
}

// Public IP for VPN Gateway
resource gatewayPublicIP 'Microsoft.Network/publicIPAddresses@2023-06-01' = {
  name: '${namePrefix}-gateway-pip'
  location: regions[0]
  tags: tags
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

// Traffic Manager Profile for global load balancing
resource trafficManager 'Microsoft.Network/trafficmanagerprofiles@2022-04-01' = {
  name: '${namePrefix}-tm'
  location: 'global'
  tags: tags
  properties: {
    profileStatus: 'Enabled'
    trafficRoutingMethod: 'Performance'
    dnsConfig: {
      relativeName: '${namePrefix}-quorum'
      ttl: 60
    }
    monitorConfig: {
      protocol: 'HTTP'
      port: 8545
      path: '/'
      intervalInSeconds: 30
      toleratedNumberOfFailures: 3
      timeoutInSeconds: 10
    }
  }
}

// Output
output vpnGatewayId string = vpnGateway.id
output trafficManagerFqdn string = trafficManager.properties.dnsConfig.fqdn
output gatewayPublicIPAddress string = gatewayPublicIP.properties.ipAddress
