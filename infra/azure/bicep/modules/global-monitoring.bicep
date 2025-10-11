// Global monitoring module for multi-region Quorum deployments
// Aggregates monitoring across regions with centralized dashboards

@description('Network name prefix')
param networkName string

@description('Environment designation')
param environment string

@description('List of regions being monitored')
param regions array

@description('Total number of validator nodes across all regions')
param totalValidators int

@description('Total number of RPC nodes across all regions')
param totalRpcNodes int

@description('Resource tags')
param tags object = {}

// Variables
var namePrefix = '${networkName}-${environment}'
var primaryRegion = regions[0]

// Global Log Analytics Workspace
resource globalLogWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-global-logs'
  location: primaryRegion
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Global Application Insights
resource globalAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-global-insights'
  location: primaryRegion
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: globalLogWorkspace.id
  }
}

// Action Group for alerts
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${namePrefix}-alerts'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'QuorumAlert'
    enabled: true
    emailReceivers: [
      {
        name: 'QuorumAdmin'
        emailAddress: 'admin@example.com'
        useCommonAlertSchema: true
      }
    ]
  }
}

// Multi-region network health alert
resource networkHealthAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${namePrefix}-network-health'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when Quorum network health degrades across regions'
    severity: 1
    enabled: true
    scopes: [
      globalLogWorkspace.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ValidatorNodesDown'
          metricName: 'Heartbeat'
          operator: 'LessThan'
          threshold: totalValidators - (totalValidators / 3)
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Consensus failure alert
resource consensusAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${namePrefix}-consensus-failure'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when consensus mechanism fails'
    severity: 0 // Critical
    enabled: true
    scopes: [
      globalLogWorkspace.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ConsensusFailure'
          metricName: 'CustomMetrics'
          metricNamespace: 'Quorum/Consensus'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Workbook for global network dashboard
resource networkDashboard 'Microsoft.Insights/workbooks@2023-06-01' = {
  name: '${namePrefix}-dashboard'
  location: primaryRegion
  tags: tags
  kind: 'shared'
  properties: {
    displayName: 'Quorum Multi-Region Dashboard'
    serializedData: '{"version":"Notebook/1.0","items":[],"isLocked":false}'
    version: '1.0'
    sourceId: globalLogWorkspace.id
    category: 'workbook'
  }
}

// Outputs
output globalWorkspaceId string = globalLogWorkspace.id
output globalWorkspaceName string = globalLogWorkspace.name
output appInsightsId string = globalAppInsights.id
output instrumentationKey string = globalAppInsights.properties.InstrumentationKey
output actionGroupId string = actionGroup.id
output dashboardId string = networkDashboard.id
