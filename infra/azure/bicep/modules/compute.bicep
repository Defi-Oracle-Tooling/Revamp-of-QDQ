// Placeholder compute module (Phase 2)
// Will provision Container Apps / VM Scale Sets depending on future flags.

param location string
param namePrefix string
param nodeCount int

// Placeholder resource name construction using parameters
var computeResourceName = '${namePrefix}-compute-${location}'
var nodeCountFormatted = string(nodeCount)

// Placeholder outputs that demonstrate parameter usage
output placeholder string = 'compute-module-stub'
output resourceName string = computeResourceName
output deployedLocation string = location
output plannedNodeCount string = nodeCountFormatted
