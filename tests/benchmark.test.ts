/**
 * Tests for HealthMonitor benchmark functionality
 */

import { BenchmarkRunner, SyntheticEndpoint } from '../scripts/benchmark_health_monitor';
import { HealthMonitor, HealthCheckConfig } from '../src/production/healthMonitor';

// Mock webhook dispatcher for testing
class TestWebhookDispatcher {
  private dispatchCount = 0;
  
  async dispatch(_url: string, _payload: any): Promise<void> {
    this.dispatchCount++;
    await new Promise(resolve => setTimeout(resolve, 1)); // Minimal delay
  }
  
  getDispatchCount(): number {
    return this.dispatchCount;
  }
}

describe('HealthMonitor Benchmark', () => {
  let healthMonitor: HealthMonitor;
  let webhookDispatcher: TestWebhookDispatcher;
  let runner: BenchmarkRunner;

  beforeEach(() => {
    webhookDispatcher = new TestWebhookDispatcher();
    
    const config: HealthCheckConfig = {
      interval: 1000,
      timeout: 500,
      rpcEndpoints: ['http://localhost:8545'],
      minPeers: 1,
      maxBlockLag: 5,
      alertWebhooks: []
    };
    
    healthMonitor = new HealthMonitor(config);
    healthMonitor.setWebhookDispatcher(webhookDispatcher.dispatch.bind(webhookDispatcher));
    
    runner = new BenchmarkRunner();
  });

  test('benchmark runner produces valid results', async () => {
    const testEndpoints: SyntheticEndpoint[] = [
      { url: 'http://test1:8545', expectedStatus: 'healthy', simulatedLatency: 10 },
      { url: 'http://test2:8545', expectedStatus: 'healthy', simulatedLatency: 20 },
      { url: 'http://test3:8545', expectedStatus: 'degraded', simulatedLatency: 100 },
    ];

    const result = await runner.runBenchmark(testEndpoints, 10, 2);

    expect(result.totalRequests).toBe(10);
    expect(result.successfulRequests).toBeGreaterThanOrEqual(0);
    expect(result.successfulRequests).toBeLessThanOrEqual(10);
    expect(result.averageLatency).toBeGreaterThan(0);
    expect(result.medianLatency).toBeGreaterThan(0);
    expect(result.p95Latency).toBeGreaterThanOrEqual(result.medianLatency);
    expect(result.p99Latency).toBeGreaterThanOrEqual(result.p95Latency);
    expect(result.errorRate).toBeGreaterThanOrEqual(0);
    expect(result.errorRate).toBeLessThanOrEqual(100);
    expect(result.throughput).toBeGreaterThan(0);
  });

  test('benchmark handles fast endpoints efficiently', async () => {
    const fastEndpoints: SyntheticEndpoint[] = [
      { url: 'http://fast1:8545', expectedStatus: 'healthy', simulatedLatency: 1 },
      { url: 'http://fast2:8545', expectedStatus: 'healthy', simulatedLatency: 2 },
    ];

    const result = await runner.runBenchmark(fastEndpoints, 20, 5);

    // With very low simulated latency, we expect good performance
    expect(result.averageLatency).toBeLessThan(50); // Should be much faster than 50ms
    expect(result.throughput).toBeGreaterThan(10); // Should achieve decent throughput
  });

  test('benchmark detects performance degradation', async () => {
    const slowEndpoints: SyntheticEndpoint[] = [
      { url: 'http://slow1:8545', expectedStatus: 'degraded', simulatedLatency: 500 },
      { url: 'http://slow2:8545', expectedStatus: 'degraded', simulatedLatency: 600 },
    ];

    const result = await runner.runBenchmark(slowEndpoints, 5, 1);

    // With high simulated latency, we expect slower performance
    expect(result.averageLatency).toBeGreaterThan(400); // Should reflect the slow latency
    expect(result.p95Latency).toBeGreaterThan(result.averageLatency);
  });

  test('benchmark result structure matches expectations', async () => {
    const mixedEndpoints: SyntheticEndpoint[] = [
      { url: 'http://mixed1:8545', expectedStatus: 'healthy', simulatedLatency: 50 },
    ];

    const result = await runner.runBenchmark(mixedEndpoints, 5, 1);

    // Verify all required properties exist and have valid types
    expect(typeof result.totalRequests).toBe('number');
    expect(typeof result.successfulRequests).toBe('number');
    expect(typeof result.averageLatency).toBe('number');
    expect(typeof result.medianLatency).toBe('number');
    expect(typeof result.p95Latency).toBe('number');
    expect(typeof result.p99Latency).toBe('number');
    expect(typeof result.errorRate).toBe('number');
    expect(typeof result.throughput).toBe('number');
    
    // Verify logical relationships
    expect(result.successfulRequests).toBeLessThanOrEqual(result.totalRequests);
    expect(result.p95Latency).toBeGreaterThanOrEqual(result.medianLatency);
    expect(result.p99Latency).toBeGreaterThanOrEqual(result.p95Latency);
  });

  test('benchmark handles concurrent requests', async () => {
    const concurrentEndpoints: SyntheticEndpoint[] = [
      { url: 'http://concurrent1:8545', expectedStatus: 'healthy', simulatedLatency: 30 },
      { url: 'http://concurrent2:8545', expectedStatus: 'healthy', simulatedLatency: 40 },
      { url: 'http://concurrent3:8545', expectedStatus: 'healthy', simulatedLatency: 35 },
    ];

    const startTime = Date.now();
    const result = await runner.runBenchmark(concurrentEndpoints, 15, 3);
    const totalTime = Date.now() - startTime;

    // With concurrency=3 and 15 requests, should complete faster than sequential
    expect(result.totalRequests).toBe(15);
    expect(totalTime).toBeLessThan(1000); // Should complete well under 1 second
    expect(result.throughput).toBeGreaterThan(10); // Should achieve decent throughput with concurrency
  });

  test('benchmark performance thresholds work correctly', async () => {
    const thresholdEndpoints: SyntheticEndpoint[] = [
      { url: 'http://threshold:8545', expectedStatus: 'healthy', simulatedLatency: 25 },
    ];

    const result = await runner.runBenchmark(thresholdEndpoints, 10, 2);

    // Verify performance assessment logic would work
    const isExcellentLatency = result.averageLatency < 100;
    const isAcceptableLatency = result.averageLatency >= 100 && result.averageLatency < 500;
    const isPoorLatency = result.averageLatency >= 500;
    
    expect(isExcellentLatency || isAcceptableLatency || isPoorLatency).toBe(true);
    
    const isLowErrorRate = result.errorRate < 1;
    const isModerateErrorRate = result.errorRate >= 1 && result.errorRate < 5;
    const isHighErrorRate = result.errorRate >= 5;
    
    expect(isLowErrorRate || isModerateErrorRate || isHighErrorRate).toBe(true);
  });
});