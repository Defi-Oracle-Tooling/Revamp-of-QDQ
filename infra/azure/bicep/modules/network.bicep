// Placeholder network module (Phase 2)
// Will later define virtual networks, subnets, NSGs, and optionally
// Azure Front Door / Application Gateway integration.

param location string
param namePrefix string

// Placeholder resource name construction using parameters
var networkResourceName = '${namePrefix}-vnet-${location}'

// Placeholder outputs that demonstrate parameter usage
output placeholder string = 'network-module-stub'
output resourceName string = networkResourceName
output deployedLocation string = location
