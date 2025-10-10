/**
 * Monitoring Dashboard Generator
 * 
 * Generates pre-configured monitoring dashboards for Grafana, Kibana, and other
 * monitoring systems with blockchain-specific metrics and visualizations.
 * 
 * @category Production Features
 */

export interface DashboardConfig {
  /** Dashboard type */
  type: 'grafana' | 'kibana' | 'datadog' | 'prometheus';
  /** Data source configuration */
  dataSource: {
    type: 'prometheus' | 'elasticsearch' | 'influxdb';
    url: string;
    database?: string;
    username?: string;
    password?: string;
  };
  /** Network configuration */
  network: {
    name: string;
    nodes: string[];
    consensus: 'ibft' | 'qbft' | 'clique' | 'ethash';
    client: 'besu' | 'goquorum';
  };
}

export interface MetricDefinition {
  name: string;
  query: string;
  description: string;
  unit: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

/**
 * Dashboard generator for blockchain monitoring
 */
export class MonitoringDashboard {
  private config: DashboardConfig;

  constructor(config: DashboardConfig) {
    this.config = config;
  }

  /**
   * Generates complete dashboard configuration
   */
  generateDashboard(): any {
    switch (this.config.type) {
      case 'grafana':
        return this.generateGrafanaDashboard();
      case 'kibana':
        return this.generateKibanaDashboard();
      case 'datadog':
        return this.generateDatadogDashboard();
      default:
        throw new Error(`Unsupported dashboard type: ${this.config.type}`);
    }
  }

  /**
   * Generates Grafana dashboard JSON
   */
  private generateGrafanaDashboard(): any {
    const metrics = this.getBlockchainMetrics();
    
    return {
      dashboard: {
        id: null,
        title: `${this.config.network.name} Blockchain Network`,
        tags: ['blockchain', 'quorum', this.config.network.client],
        timezone: 'UTC',
        panels: [
          this.createGrafanaPanel('Network Overview', metrics.slice(0, 4), 0, 0, 12, 8),
          this.createGrafanaPanel('Node Health', metrics.slice(4, 8), 12, 0, 12, 8),
          this.createGrafanaPanel('Consensus Metrics', metrics.slice(8, 12), 0, 8, 12, 8),
          this.createGrafanaPanel('Performance Metrics', metrics.slice(12), 12, 8, 12, 8)
        ],
        time: {
          from: 'now-1h',
          to: 'now'
        },
        refresh: '30s'
      }
    };
  }

  /**
   * Creates a Grafana panel configuration
   */
  private createGrafanaPanel(title: string, metrics: MetricDefinition[], x: number, y: number, width: number, height: number): any {
    return {
      id: Math.floor(Math.random() * 1000),
      title,
      type: 'graph',
      gridPos: { x, y, w: width, h: height },
      targets: metrics.map((metric, index) => ({
        expr: metric.query,
        legendFormat: metric.name,
        refId: String.fromCharCode(65 + index)
      })),
      yAxes: [{
        label: metrics[0]?.unit || 'count',
        show: true
      }],
      xAxes: [{
        mode: 'time',
        show: true
      }],
      thresholds: metrics[0]?.thresholds ? [
        {
          value: metrics[0].thresholds.warning,
          colorMode: 'critical',
          op: 'gt'
        }
      ] : []
    };
  }

  /**
   * Generates Kibana dashboard configuration
   */
  private generateKibanaDashboard(): any {
    return {
      version: '7.10.0',
      objects: [
        {
          id: `${this.config.network.name}-overview`,
          type: 'dashboard',
          attributes: {
            title: `${this.config.network.name} Blockchain Dashboard`,
            panelsJSON: JSON.stringify([
              {
                version: '7.10.0',
                gridData: { x: 0, y: 0, w: 24, h: 15 },
                panelIndex: '1',
                embeddableConfig: {},
                panelRefName: 'panel_1'
              }
            ]),
            timeRestore: false,
            kibanaSavedObjectMeta: {
              searchSourceJSON: JSON.stringify({
                query: {
                  match_all: {}
                },
                filter: []
              })
            }
          }
        }
      ]
    };
  }

  /**
   * Generates Datadog dashboard configuration
   */
  private generateDatadogDashboard(): any {
    const metrics = this.getBlockchainMetrics();
    
    return {
      title: `${this.config.network.name} Blockchain Network`,
      widgets: metrics.map((metric, index) => ({
        definition: {
          type: 'timeseries',
          requests: [{
            q: metric.query,
            display_type: 'line'
          }],
          title: metric.name
        },
        layout: {
          x: (index % 2) * 6,
          y: Math.floor(index / 2) * 4,
          width: 6,
          height: 4
        }
      })),
      layout_type: 'ordered',
      is_read_only: false,
      notify_list: []
    };
  }

  /**
   * Gets blockchain-specific metrics definitions
   */
  private getBlockchainMetrics(): MetricDefinition[] {
    const client = this.config.network.client;
    const consensus = this.config.network.consensus;
    
    const baseMetrics: MetricDefinition[] = [
      {
        name: 'Block Height',
        query: `ethereum_blockchain_height{instance=~".*${this.config.network.name}.*"}`,
        description: 'Current blockchain height',
        unit: 'blocks'
      },
      {
        name: 'Peer Count',
        query: `ethereum_peer_count{instance=~".*${this.config.network.name}.*"}`,
        description: 'Number of connected peers',
        unit: 'peers',
        thresholds: { warning: 3, critical: 1 }
      },
      {
        name: 'Transaction Pool Size',
        query: `ethereum_pending_transactions{instance=~".*${this.config.network.name}.*"}`,
        description: 'Pending transactions in mempool',
        unit: 'txs'
      },
      {
        name: 'Block Time',
        query: `rate(ethereum_blockchain_height{instance=~".*${this.config.network.name}.*"}[5m])`,
        description: 'Average block production time',
        unit: 'seconds'
      }
    ];

    // Add client-specific metrics
    if (client === 'besu') {
      baseMetrics.push(
        {
          name: 'Besu JVM Memory',
          query: `jvm_memory_used_bytes{instance=~".*${this.config.network.name}.*"}`,
          description: 'JVM memory usage',
          unit: 'bytes'
        },
        {
          name: 'Besu Sync Status',
          query: `ethereum_blockchain_sync_status{instance=~".*${this.config.network.name}.*"}`,
          description: 'Blockchain sync status',
          unit: 'status'
        }
      );
    }

    // Add consensus-specific metrics
    if (consensus === 'ibft' || consensus === 'qbft') {
      baseMetrics.push(
        {
          name: 'Consensus Rounds',
          query: `ethereum_consensus_height{instance=~".*${this.config.network.name}.*"}`,
          description: 'Consensus round number',
          unit: 'rounds'
        },
        {
          name: 'Validator Participation',
          query: `ethereum_consensus_validators_active{instance=~".*${this.config.network.name}.*"}`,
          description: 'Active validator count',
          unit: 'validators'
        }
      );
    }

    return baseMetrics;
  }

  /**
   * Generates Prometheus recording rules
   */
  generatePrometheusRules(): any {
    return {
      groups: [
        {
          name: `${this.config.network.name}-blockchain`,
          rules: [
            {
              record: 'blockchain:block_production_rate',
              expr: `rate(ethereum_blockchain_height[5m])`,
              labels: {
                network: this.config.network.name
              }
            },
            {
              record: 'blockchain:network_health_score',
              expr: `(
                count(up{job="${this.config.network.name}"} == 1) / 
                count(up{job="${this.config.network.name}"})
              ) * 100`,
              labels: {
                network: this.config.network.name
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Generates alerting rules
   */
  generateAlertingRules(): any {
    return {
      groups: [
        {
          name: `${this.config.network.name}-alerts`,
          rules: [
            {
              alert: 'NodeDown',
              expr: `up{job="${this.config.network.name}"} == 0`,
              for: '2m',
              labels: {
                severity: 'critical',
                network: this.config.network.name
              },
              annotations: {
                summary: 'Blockchain node is down',
                description: 'Node {{ $labels.instance }} has been down for more than 2 minutes'
              }
            },
            {
              alert: 'LowPeerCount',
              expr: `ethereum_peer_count{job="${this.config.network.name}"} < 2`,
              for: '5m',
              labels: {
                severity: 'warning',
                network: this.config.network.name
              },
              annotations: {
                summary: 'Low peer count detected',
                description: 'Node {{ $labels.instance }} has only {{ $value }} peers'
              }
            },
            {
              alert: 'BlockProductionStopped',
              expr: `increase(ethereum_blockchain_height{job="${this.config.network.name}"}[10m]) == 0`,
              for: '10m',
              labels: {
                severity: 'critical',
                network: this.config.network.name
              },
              annotations: {
                summary: 'Block production has stopped',
                description: 'No new blocks produced in the last 10 minutes'
              }
            }
          ]
        }
      ]
    };
  }
}