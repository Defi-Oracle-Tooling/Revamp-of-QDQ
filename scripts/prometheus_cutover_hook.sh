#!/bin/bash
# Prometheus hook for cutover monitoring
source .besu_env
# Example: Push custom cutover metric to Prometheus Pushgateway
curl -X POST --data "instance_cutover{instance=\"$REMOTE_HOST\"} 1" http://<prometheus_pushgateway>:9091/metrics/job/besu_cutover
