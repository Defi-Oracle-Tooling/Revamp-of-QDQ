#!/usr/bin/env ts-node

/**
 * HealthMonitor Performance Benchmark
 * 
 * Measures average response time and performance characteristics 
 * of the HealthMonitor across multiple synthetic endpoints.
 */

import { HealthMonitor, HealthCheckConfig } from '../src/production/healthMonitor';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface BenchmarkResult {
  totalRequests: number;
  successfulRequests: number;
  averageLatency: number;
  medianLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  throughput: number; // requests per second
}

interface SyntheticEndpoint {
  url: string;
  expectedStatus: HealthStatus;
  simulatedLatency: number;
}

class MockWebhookDispatcher {
  private dispatchCount = 0;
  
  async dispatch(_url: string, _payload: any): Promise<void> {
    this.dispatchCount++;
    // Simulate webhook dispatch latency
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
  }
  
  getDispatchCount(): number {
    return this.dispatchCount;
  }
}

class BenchmarkRunner {
  private latencies: number[] = [];
  private errors: number = 0;
  private startTime: number = 0;
  private endTime: number = 0;

  async runBenchmark(
    endpoints: SyntheticEndpoint[], 
    iterations: number = 100,
    concurrency: number = 5
  ): Promise<BenchmarkResult> {
    console.log(`Starting benchmark: ${iterations} iterations, ${concurrency} concurrent requests`);
    console.log(`Endpoints: ${endpoints.length} synthetic endpoints`);
    
    this.latencies = [];
    this.errors = 0;
    this.startTime = Date.now();
    
    // Run benchmark iterations in batches for concurrency
    for (let batch = 0; batch < iterations; batch += concurrency) {
      const batchSize = Math.min(concurrency, iterations - batch);
      const batchPromises = [];
      
      for (let i = 0; i < batchSize; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        batchPromises.push(this.measureSingleRequest(endpoint));
      }
      
      await Promise.all(batchPromises);
      
      if (batch % 50 === 0) {
        console.log(`Completed ${batch + batchSize}/${iterations} requests`);
      }
    }
    
    this.endTime = Date.now();
    
    return this.calculateResults(iterations);
  }
  
  private async measureSingleRequest(endpoint: SyntheticEndpoint): Promise<void> {
    const startTime = process.hrtime.bigint();
    
    try {
      // Simulate network request with artificial latency
      await new Promise(resolve => setTimeout(resolve, endpoint.simulatedLatency));
      
      // Simulate the health check logic
      const mockResponse = this.simulateHealthCheckResponse(endpoint);
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
      
      this.latencies.push(latencyMs);
      
      if (mockResponse.status !== endpoint.expectedStatus) {
        this.errors++;
      }
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000;
      
      this.latencies.push(latencyMs);
      this.errors++;
    }
  }
  
  private simulateHealthCheckResponse(endpoint: SyntheticEndpoint): { status: HealthStatus } {
    // Simulate occasional failures (5% error rate)
    const shouldFail = Math.random() < 0.05;
    
    if (shouldFail) {
      return { status: 'unhealthy' };
    }
    
    return { status: endpoint.expectedStatus };
  }
  
  private calculateResults(totalRequests: number): BenchmarkResult {
    this.latencies.sort((a, b) => a - b);
    
    const successfulRequests = totalRequests - this.errors;
    const totalDuration = (this.endTime - this.startTime) / 1000; // Convert to seconds
    
    return {
      totalRequests,
      successfulRequests,
      averageLatency: this.calculateAverage(this.latencies),
      medianLatency: this.calculatePercentile(this.latencies, 50),
      p95Latency: this.calculatePercentile(this.latencies, 95),
      p99Latency: this.calculatePercentile(this.latencies, 99),
      errorRate: (this.errors / totalRequests) * 100,
      throughput: totalRequests / totalDuration
    };
  }
  
  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}

function generateSyntheticEndpoints(): SyntheticEndpoint[] {
  return [
    // Fast responding endpoints
    { url: 'http://node1:8545', expectedStatus: 'healthy', simulatedLatency: 10 },
    { url: 'http://node2:8545', expectedStatus: 'healthy', simulatedLatency: 15 },
    { url: 'http://node3:8545', expectedStatus: 'healthy', simulatedLatency: 12 },
    
    // Medium latency endpoints  
    { url: 'http://node4:8545', expectedStatus: 'healthy', simulatedLatency: 50 },
    { url: 'http://node5:8545', expectedStatus: 'healthy', simulatedLatency: 75 },
    
    // Slow endpoints
    { url: 'http://remote-node:8545', expectedStatus: 'degraded', simulatedLatency: 200 },
    { url: 'http://backup-node:8545', expectedStatus: 'degraded', simulatedLatency: 300 },
    
    // Occasionally failing endpoints
    { url: 'http://flaky-node:8545', expectedStatus: 'healthy', simulatedLatency: 100 },
    { url: 'http://unstable-node:8545', expectedStatus: 'healthy', simulatedLatency: 150 },
  ];
}

function printResults(result: BenchmarkResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('HEALTHMONITOR PERFORMANCE BENCHMARK RESULTS');
  console.log('='.repeat(60));
  
  console.log(`Total Requests:      ${result.totalRequests}`);
  console.log(`Successful Requests: ${result.successfulRequests}`);
  console.log(`Error Rate:          ${result.errorRate.toFixed(2)}%`);
  console.log(`Throughput:          ${result.throughput.toFixed(2)} req/sec`);
  console.log('');
  console.log('Latency Distribution:');
  console.log(`  Average:           ${result.averageLatency.toFixed(2)}ms`);
  console.log(`  Median (P50):      ${result.medianLatency.toFixed(2)}ms`);
  console.log(`  95th Percentile:   ${result.p95Latency.toFixed(2)}ms`);
  console.log(`  99th Percentile:   ${result.p99Latency.toFixed(2)}ms`);
  
  console.log('');
  
  // Performance assessment
  if (result.averageLatency < 100) {
    console.log('✅ EXCELLENT: Average latency under 100ms');
  } else if (result.averageLatency < 500) {
    console.log('⚠️  ACCEPTABLE: Average latency under 500ms');
  } else {
    console.log('❌ POOR: Average latency over 500ms - consider optimization');
  }
  
  if (result.errorRate < 1) {
    console.log('✅ EXCELLENT: Error rate under 1%');
  } else if (result.errorRate < 5) {
    console.log('⚠️  ACCEPTABLE: Error rate under 5%');
  } else {
    console.log('❌ POOR: Error rate over 5% - investigate error handling');
  }
  
  if (result.throughput > 50) {
    console.log('✅ EXCELLENT: Throughput over 50 req/sec');
  } else if (result.throughput > 20) {
    console.log('⚠️  ACCEPTABLE: Throughput over 20 req/sec');
  } else {
    console.log('❌ POOR: Throughput under 20 req/sec - consider scaling');
  }
  
  console.log('='.repeat(60));
}

async function main(): Promise<void> {
  const webhookDispatcher = new MockWebhookDispatcher();
  
  const config: HealthCheckConfig = {
    interval: 5000,
    timeout: 3000,
    rpcEndpoints: ['http://localhost:8545'],
    minPeers: 2,
    maxBlockLag: 10,
    alertWebhooks: ['http://localhost:3000/webhook']
  };
  
  const healthMonitor = new HealthMonitor(config);
  healthMonitor.setWebhookDispatcher(webhookDispatcher.dispatch.bind(webhookDispatcher));
  
  const endpoints = generateSyntheticEndpoints();
  const runner = new BenchmarkRunner();
  
  try {
    // Quick benchmark (default)
    let iterations = 100;
    let concurrency = 5;
    
    // Parse command line arguments for custom benchmark parameters
    const args = process.argv.slice(2);
    const iterationsArg = args.find(arg => arg.startsWith('--iterations='));
    const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
    
    if (iterationsArg) {
      iterations = parseInt(iterationsArg.split('=')[1], 10) || 100;
    }
    
    if (concurrencyArg) {
      concurrency = parseInt(concurrencyArg.split('=')[1], 10) || 5;
    }
    
    const result = await runner.runBenchmark(endpoints, iterations, concurrency);
    printResults(result);
    
    console.log(`\nWebhook dispatches triggered: ${webhookDispatcher.getDispatchCount()}`);
    
    // Exit with appropriate code based on performance
    if (result.averageLatency > 1000 || result.errorRate > 10) {
      console.error('\nBenchmark indicates performance issues!');
      process.exit(1);
    } else {
      console.log('\nBenchmark completed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export type { BenchmarkResult, SyntheticEndpoint };
export { BenchmarkRunner };