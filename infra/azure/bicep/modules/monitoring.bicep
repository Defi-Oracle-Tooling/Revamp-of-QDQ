// Monitoring module for Quorum networks
// Deploys Log Analytics, Application Insights, and monitoring dashboards

@description('Deployment location')
param location string

@description('Resource name prefix')
param namePrefix string

@description('Number of nodes to monitor')
param nodeCount int

@description('Resource tags')
param tags object = {}

// Variables
var workspaceName = '${namePrefix}-logs'
var appInsightsName = '${namePrefix}-insights'

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// Data Collection Rule for custom metrics
resource dataCollectionRule 'Microsoft.Insights/dataCollectionRules@2023-03-11' = {
  name: '${namePrefix}-dcr'
  location: location
  tags: tags
  properties: {
    dataSources: {
      performanceCounters: [
        {
          name: 'perfCounterDataSource'
          streams: ['Microsoft-Perf']
          samplingFrequencyInSeconds: 60
          counterSpecifiers: [
            '\\Processor(_Total)\\% Processor Time'
            '\\Memory\\Available Bytes'
            '\\Network Interface(*)\\Bytes Total/sec'
          ]
        }
      ]
      syslog: [
        {
          name: 'syslogDataSource'
          streams: ['Microsoft-Syslog']
          facilityNames: ['*']
          logLevels: ['Warning', 'Error', 'Critical', 'Alert', 'Emergency']
        }
      ]
    }
    destinations: {
      logAnalytics: [
        {
          name: 'logAnalyticsDestination'
          workspaceResourceId: logAnalyticsWorkspace.id
        }
      ]
    }
    dataFlows: [
      {
        streams: ['Microsoft-Perf', 'Microsoft-Syslog']
        destinations: ['logAnalyticsDestination']
      }
    ]
  }
}

// Alert Rules for node health
resource alertRule 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${namePrefix}-node-health-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when Quorum nodes are unhealthy'
    severity: 2
    enabled: true
    scopes: [
      logAnalyticsWorkspace.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'NodeDown'
          metricName: 'Heartbeat'
          operator: 'LessThan'
          threshold: nodeCount
          timeAggregation: 'Count'
        }
      ]
    }
    actions: []
  }
}

// Outputs
output workspaceName string = logAnalyticsWorkspace.name
output workspaceId string = logAnalyticsWorkspace.id
output workspaceCustomerId string = logAnalyticsWorkspace.properties.customerId

output appInsightsName string = applicationInsights.name
output appInsightsId string = applicationInsights.id
output instrumentationKey string = applicationInsights.properties.InstrumentationKey
output connectionString string = applicationInsights.properties.ConnectionString

output dataCollectionRuleName string = dataCollectionRule.name
output dataCollectionRuleId string = dataCollectionRule.id
