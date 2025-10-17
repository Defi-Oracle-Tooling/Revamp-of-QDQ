# 🏗️ System Architecture Diagrams

## Network Architecture Overview

```mermaid
architecture-beta
    group quorum_network(cloud)[Quorum Network]
    
    service besu1(server)[Besu Node 1] in quorum_network
    service besu2(server)[Besu Node 2] in quorum_network
    service besu3(server)[Besu Node 3] in quorum_network
    service besu4(server)[Besu Node 4] in quorum_network
    
    group monitoring(internet)[Monitoring Stack]
    
    service prometheus(database)[Prometheus] in monitoring
    service grafana(server)[Grafana] in monitoring
    service explorer(internet)[Block Explorer] in monitoring
    
    group external(cloud)[External Services]
    
    service metamask(internet)[MetaMask] in external
    service dapps(server)[DApps] in external
    
    besu1:R -- L:besu2
    besu2:R -- L:besu3
    besu3:R -- L:besu4
    besu4:L -- R:besu1
    
    besu1:T --> B:prometheus{group}
    besu2:T --> B:prometheus{group}
    besu3:T --> B:prometheus{group}
    besu4:T --> B:prometheus{group}
    
    prometheus:R -- L:grafana
    
    besu1:B --> T:metamask{group}
    besu1:B --> T:dapps{group}
```

## GoQuorum Privacy Architecture

```mermaid
architecture-beta
    group privacy_layer(cloud)[Privacy Layer]
    
    service tessera1(server)[Tessera 1] in privacy_layer
    service tessera2(server)[Tessera 2] in privacy_layer
    service tessera3(server)[Tessera 3] in privacy_layer
    
    group consensus_layer(database)[Consensus Layer]
    
    service goquorum1(server)[GoQuorum 1] in consensus_layer
    service goquorum2(server)[GoQuorum 2] in consensus_layer
    service goquorum3(server)[GoQuorum 3] in consensus_layer
    
    group storage(disk)[Storage Layer]
    
    service db1(database)[LevelDB 1] in storage
    service db2(database)[LevelDB 2] in storage
    service db3(database)[LevelDB 3] in storage
    
    tessera1:B -- T:goquorum1
    tessera2:B -- T:goquorum2
    tessera3:B -- T:goquorum3
    
    tessera1:R -- L:tessera2
    tessera2:R -- L:tessera3
    tessera3:L -- R:tessera1
    
    goquorum1:R -- L:goquorum2
    goquorum2:R -- L:goquorum3
    goquorum3:L -- R:goquorum1
    
    goquorum1:B -- T:db1
    goquorum2:B -- T:db2
    goquorum3:B -- T:db3
```

## Regional Topology Architecture

```mermaid
architecture-beta
    group region_us(cloud)[US East Region]
    
    service besu_us1(server)[Besu US-1] in region_us
    service besu_us2(server)[Besu US-2] in region_us
    
    group region_eu(cloud)[EU West Region]
    
    service besu_eu1(server)[Besu EU-1] in region_eu
    service besu_eu2(server)[Besu EU-2] in region_eu
    
    group region_asia(cloud)[Asia Pacific Region]
    
    service besu_asia1(server)[Besu ASIA-1] in region_asia
    service besu_asia2(server)[Besu ASIA-2] in region_asia
    
    group global_services(internet)[Global Services]
    
    service load_balancer(server)[Load Balancer] in global_services
    service dns(internet)[DNS] in global_services
    
    besu_us1:R -- L:besu_us2
    besu_eu1:R -- L:besu_eu2
    besu_asia1:R -- L:besu_asia2
    
    besu_us1{group}:T --> B:load_balancer
    besu_eu1{group}:T --> B:load_balancer
    besu_asia1{group}:T --> B:load_balancer
    
    dns:B -- T:load_balancer
    
    besu_us1{group}:R -- L:besu_eu1{group}
    besu_eu1{group}:R -- L:besu_asia1{group}
    besu_asia1{group}:L -- R:besu_us1{group}
```

## ChainID 138 Integration Architecture

```mermaid
architecture-beta
    group chain138_core(cloud)[ChainID 138 Core]
    
    service validator1(server)[Validator 1] in chain138_core
    service validator2(server)[Validator 2] in chain138_core
    service validator3(server)[Validator 3] in chain138_core
    service validator4(server)[Validator 4] in chain138_core
    
    group integration_layer(internet)[Integration Layer]
    
    service wallet_service(server)[Wallet Service] in integration_layer
    service tatum_adapter(server)[Tatum Adapter] in integration_layer
    service etherscan_api(internet)[Etherscan API] in integration_layer
    
    group dodoex_ecosystem(cloud)[DODOEX Ecosystem]
    
    service pmm_factory(server)[PMM Factory] in dodoex_ecosystem
    service liquidity_pools(database)[Liquidity Pools] in dodoex_ecosystem
    service auto_trader(server)[Auto Trader] in dodoex_ecosystem
    
    group external_apis(internet)[External APIs]
    
    service price_feeds(internet)[Price Feeds] in external_apis
    service compliance_api(server)[Compliance API] in external_apis
    
    validator1:R -- L:validator2
    validator2:R -- L:validator3
    validator3:R -- L:validator4
    validator4:L -- R:validator1
    
    validator1:T --> B:wallet_service
    wallet_service:R -- L:tatum_adapter
    wallet_service:T -- B:etherscan_api
    
    validator1{group}:B --> T:pmm_factory
    pmm_factory:R -- L:liquidity_pools
    liquidity_pools:R -- L:auto_trader
    
    auto_trader:T --> B:price_feeds{group}
    tatum_adapter:B --> T:compliance_api{group}
```

## Data Flow Architecture

```mermaid
architecture-beta
    group user_interface(internet)[User Interface]
    
    service web_app(server)[Web Application] in user_interface
    service mobile_app(server)[Mobile App] in user_interface
    service cli_tool(server)[CLI Tool] in user_interface
    
    group api_gateway(cloud)[API Gateway]
    
    service rest_api(server)[REST API] in api_gateway
    service websocket_api(server)[WebSocket API] in api_gateway
    service graphql_api(server)[GraphQL API] in api_gateway
    
    group blockchain_layer(database)[Blockchain Layer]
    
    service rpc_nodes(server)[RPC Nodes] in blockchain_layer
    service consensus_nodes(server)[Consensus Nodes] in blockchain_layer
    
    group data_persistence(disk)[Data Persistence]
    
    service blockchain_db(database)[Blockchain DB] in data_persistence
    service indexer_db(database)[Indexer DB] in data_persistence
    service cache_redis(database)[Redis Cache] in data_persistence
    
    web_app:B --> T:rest_api
    mobile_app:B --> T:rest_api
    cli_tool:B --> T:websocket_api
    
    rest_api:B -- T:rpc_nodes
    websocket_api:B -- T:rpc_nodes
    graphql_api:B -- T:rpc_nodes
    
    rpc_nodes:R -- L:consensus_nodes
    
    consensus_nodes:B -- T:blockchain_db
    rpc_nodes:B -- T:indexer_db
    rest_api:L -- R:cache_redis
```

## Monitoring & Observability

```mermaid
architecture-beta
    group metrics_collection(cloud)[Metrics Collection]
    
    service node_exporters(server)[Node Exporters] in metrics_collection
    service cadvisor(server)[cAdvisor] in metrics_collection
    service custom_metrics(server)[Custom Metrics] in metrics_collection
    
    group monitoring_stack(database)[Monitoring Stack]
    
    service prometheus(database)[Prometheus] in monitoring_stack
    service alertmanager(server)[AlertManager] in monitoring_stack
    service grafana(server)[Grafana] in monitoring_stack
    
    group logging_stack(disk)[Logging Stack]
    
    service filebeat(server)[Filebeat] in logging_stack
    service logstash(server)[Logstash] in logging_stack
    service elasticsearch(database)[Elasticsearch] in logging_stack
    service kibana(server)[Kibana] in logging_stack
    
    group alerting(internet)[Alerting Channels]
    
    service slack_alerts(internet)[Slack] in alerting
    service email_alerts(internet)[Email] in alerting
    service pagerduty(server)[PagerDuty] in alerting
    
    node_exporters:B --> T:prometheus
    cadvisor:B --> T:prometheus
    custom_metrics:B --> T:prometheus
    
    prometheus:R -- L:alertmanager
    prometheus:T -- B:grafana
    
    filebeat:B --> T:logstash
    logstash:R -- L:elasticsearch
    elasticsearch:T -- B:kibana
    
    alertmanager:T --> B:slack_alerts{group}
    alertmanager:T --> B:email_alerts{group}
    alertmanager:T --> B:pagerduty{group}
```