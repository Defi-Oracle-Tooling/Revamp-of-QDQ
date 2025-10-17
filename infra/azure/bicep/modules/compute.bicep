// Compute module for Quorum node deployment
// Supports AKS, ACA, VM, and VMSS deployment types

@description('Deployment location')
param location string

@description('Resource name prefix')
param namePrefix string

@description('Total number of nodes to deploy')
param nodeCount int

@description('Deployment type for compute resources')
@allowed(['aks', 'aca', 'vm', 'vmss'])
param deploymentType string = 'aks'

@description('Number of validator nodes')
param validatorCount int = 4

@description('Number of RPC nodes')  
param rpcNodeCount int = 1

@description('Resource tags')
param tags object = {}

// Variables
var aksClusterName = '${namePrefix}-aks'
var acaEnvironmentName = '${namePrefix}-aca-env'
var vmssName = '${namePrefix}-vmss'

// AKS Cluster (if deployment type is AKS)
resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-08-01' = if (deploymentType == 'aks') {
  name: aksClusterName
  location: location
  tags: tags
  properties: {
    dnsPrefix: '${namePrefix}-aks'
    agentPoolProfiles: [
      {
        name: 'validators'
        count: validatorCount
        vmSize: 'Standard_D4s_v5'
        osType: 'Linux'
        mode: 'System'
      }
      {
        name: 'rpcnodes'
        count: rpcNodeCount
        vmSize: 'Standard_D2s_v5'
        osType: 'Linux'
        mode: 'User'
      }
    ]
    servicePrincipalProfile: {
      clientId: 'msi'
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Container Apps Environment (if deployment type is ACA)
resource acaEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = if (deploymentType == 'aca') {
  name: acaEnvironmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
    }
  }
}

// VM Scale Set (if deployment type is VMSS)
resource vmss 'Microsoft.Compute/virtualMachineScaleSets@2023-07-01' = if (deploymentType == 'vmss') {
  name: vmssName
  location: location
  tags: tags
  sku: {
    name: 'Standard_D4s_v5'
    tier: 'Standard'
    capacity: nodeCount
  }
  properties: {
    upgradePolicy: {
      mode: 'Manual'
    }
    virtualMachineProfile: {
      osProfile: {
        computerNamePrefix: namePrefix
        adminUsername: 'azureuser'
        disablePasswordAuthentication: true
        linuxConfiguration: {
          ssh: {
            publicKeys: [
              {
                path: '/home/azureuser/.ssh/authorized_keys'
                keyData: 'ssh-rsa REPLACE_WITH_PUBLIC_KEY'
              }
            ]
          }
        }
      }
      storageProfile: {
        imageReference: {
          publisher: 'Canonical'
          offer: '0001-com-ubuntu-server-jammy'
          sku: '22_04-lts-gen2'
          version: 'latest'
        }
      }
      networkProfile: {
        networkInterfaceConfigurations: [
          {
            name: '${namePrefix}-nic'
            properties: {
              primary: true
              ipConfigurations: [
                {
                  name: 'internal'
                  properties: {
                    subnet: {
                      id: resourceId('Microsoft.Network/virtualNetworks/subnets', '${namePrefix}-vnet', 'default')
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}

// Outputs
output deploymentType string = deploymentType
output nodeCount int = nodeCount
output validatorCount int = validatorCount
output rpcNodeCount int = rpcNodeCount

output aksClusterName string = deploymentType == 'aks' ? aksCluster.name : ''
output aksClusterFqdn string = deploymentType == 'aks' ? aksCluster.properties.fqdn : ''

output acaEnvironmentName string = deploymentType == 'aca' ? acaEnvironment.name : ''
output acaEnvironmentId string = deploymentType == 'aca' ? acaEnvironment.id : ''

output vmssName string = deploymentType == 'vmss' ? vmss.name : ''
output vmssId string = deploymentType == 'vmss' ? vmss.id : ''
