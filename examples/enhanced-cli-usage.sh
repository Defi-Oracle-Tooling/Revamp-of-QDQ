#!/bin/bash

# Example CLI commands for enhanced regional topology

# Basic regional distribution
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureRegionalDistribution "eastus:validators=3+rpc=2+boot=1,westus2:validators=2+archive=1,centralus:rpc=3" \
  --azureDeploymentMap "validators=aks,rpc=aca,archive=vmss,boot=vm"

# Advanced regional configuration with subtypes
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureRegionalConfig ./enhanced-topology.json \
  --azureNetworkMode hub-spoke \
  --azureHubRegion eastus

# Interactive regional setup (proposed)
npx quorum-dev-quickstart \
  --interactive \
  --azureRegionalWizard true

# Hybrid approach with base config + overrides
npx quorum-dev-quickstart \
  --clientType besu \
  --azureTopologyFile ./base-topology.json \
  --azureRegionOverride "centralus:rpc.loadBalanced.scale.max=10" \
  --azureAddRegion "northeurope:validators=1+rpc=1"