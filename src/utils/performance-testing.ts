// Performance testing utilities for NovaTask
import { useState, useEffect, useRef, useCallback } from 'react';

export interface PerformanceTestResult {
  name: string;
  duration: number;
  passed: boolean;
  threshold: number;
  actual: number;
  unit: string;
  details?: Record<string, unknown>;
}

export interface PerformanceBenchmark {
  name: string;
  tests: PerformanceTestResult[];
  averageScore: number;
  passedTests: number;
  totalTests: number;
  timestamp: string;
}

// Performance test runner
export class PerformanceTestRunner {
  private static results: PerformanceTestResult[] = [];

  static async runTest(
    name: string,
    testFn: () => Promise<number> | number,
    threshold: number,
    unit: string = 'ms',
    details?: Record<string, unknown>
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    
    try {
      const result = await testFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const testResult: PerformanceTestResult = {
        name,
        duration,
        passed: duration <= threshold,
        threshold,
        actual: result,
        unit,
        details,
      };
      
      this.results.push(testResult);
      return testResult;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const testResult: PerformanceTestResult = {
        name,
        duration,
        passed: false,
        threshold,
        actual: 0,
        unit,
        details: { error: error instanceof Error ? error.message : String(error) },
      };
      
      this.results.push(testResult);
      return testResult;
    }
  }

  static async runBenchmark(
    name: string,
    tests: Array<{
      name: string;
      testFn: () => Promise<number> | number;
      threshold: number;
      unit?: string;
      details?: Record<string, unknown>;
    }>
  ): Promise<PerformanceBenchmark> {
    const testResults: PerformanceTestResult[] = [];
    
    for (const test of tests) {
      const result = await this.runTest(
        test.name,
        test.testFn,
        test.threshold,
        test.unit,
        test.details
      );
      testResults.push(result);
    }

    const passedTests = testResults.filter(test => test.passed).length;
    const averageScore = testResults.reduce((sum, test) => sum + test.duration, 0) / testResults.length;

    const benchmark: PerformanceBenchmark = {
      name,
      tests: testResults,
      averageScore,
      passedTests,
      totalTests: testResults.length,
      timestamp: new Date().toISOString(),
    };

    return benchmark;
  }

  static getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  static clearResults(): void {
    this.results = [];
  }
}

// Specific performance tests
export class PerformanceTests {
  // Test render performance
  static async testRenderPerformance(
    component: () => React.ReactNode,
    iterations: number = 100
  ): Promise<number> {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      component();
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  // Test state update performance
  static async testStateUpdatePerformance(
    updates: Array<() => void>,
    iterations: number = 100
  ): Promise<number> {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      updates.forEach(update => update());
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  // Test list rendering performance
  static async testListRenderingPerformance(
    itemCount: number,
    renderItem: (index: number) => React.ReactNode,
    iterations: number = 10
  ): Promise<number> {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const items = Array.from({ length: itemCount }, (_, index) => renderItem(index));
      // Simulate rendering
      items.toString();
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  // Test memory usage
  static async testMemoryUsage(
    operation: () => void,
    iterations: number = 1000
  ): Promise<number> {
    const initialMemory = this.getMemoryUsage();
    
    for (let i = 0; i < iterations; i++) {
      operation();
    }
    
    const finalMemory = this.getMemoryUsage();
    return finalMemory - initialMemory;
  }

  // Test animation performance
  static async testAnimationPerformance(
    animateFn: () => void,
    duration: number = 1000,
    iterations: number = 60
  ): Promise<number> {
    const startTime = performance.now();
    const frameDuration = duration / iterations;
    
    for (let i = 0; i < iterations; i++) {
      const frameStart = performance.now();
      animateFn();
      const frameEnd = performance.now();
      
      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, Math.max(0, frameDuration - (frameEnd - frameStart))));
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  // Test scroll performance
  static async testScrollPerformance(
    scrollContainer: HTMLElement,
    scrollAmount: number = 1000,
    iterations: number = 10
  ): Promise<number> {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const scrollStart = performance.now();
      scrollContainer.scrollTop = scrollAmount;
      await new Promise(resolve => setTimeout(resolve, 16)); // Wait for frame
      scrollContainer.scrollTop = 0;
      const scrollEnd = performance.now();
      
      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 100 - (scrollEnd - scrollStart))));
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  // Test resize performance
  static async testResizePerformance(
    resizeElement: HTMLElement,
    width: number,
    height: number,
    iterations: number = 10
  ): Promise<number> {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const resizeStart = performance.now();
      resizeElement.style.width = `${width}px`;
      resizeElement.style.height = `${height}px`;
      await new Promise(resolve => setTimeout(resolve, 16)); // Wait for frame
      resizeElement.style.width = '';
      resizeElement.style.height = '';
      const resizeEnd = performance.now();
      
      // Wait for resize to complete
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 100 - (resizeEnd - resizeStart))));
    }
    
    const endTime = performance.now();
    return (endTime - startTime) / iterations;
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      const perfMemory = performance as unknown as { memory: { usedJSHeapSize: number } };
      return perfMemory.memory.usedJSHeapSize || 0;
    }
    return 0;
  }
}

// Performance comparison utilities
export class PerformanceComparator {
  static compareResults(
    baseline: PerformanceBenchmark,
    current: PerformanceBenchmark
  ): {
    improved: boolean;
    improvement: number;
    regression: boolean;
    degradation: number;
  } {
    const baselineScore = baseline.averageScore;
    const currentScore = current.averageScore;
    
    const improvement = baselineScore - currentScore;
    const regression = improvement < 0;
    const degradation = Math.abs(improvement);
    
    return {
      improved: improvement > 0,
      improvement,
      regression,
      degradation,
    };
  }

  static generateReport(
    baseline: PerformanceBenchmark,
    current: PerformanceBenchmark
  ): string {
    const comparison = this.compareResults(baseline, current);
    
    return `
Performance Comparison Report
========================

Baseline: ${baseline.name} (${baseline.timestamp})
- Average Score: ${baseline.averageScore.toFixed(2)}ms
- Tests Passed: ${baseline.passedTests}/${baseline.totalTests}

Current: ${current.name} (${current.timestamp})
- Average Score: ${current.averageScore.toFixed(2)}ms
- Tests Passed: ${current.passedTests}/${current.totalTests}

Comparison:
- ${comparison.improved ? '✅ IMPROVED' : comparison.regression ? '❌ REGRESSION' : '⚠️ NO CHANGE'}
- Performance Change: ${comparison.improvement > 0 ? '+' : ''}${comparison.improvement.toFixed(2)}ms
- Degradation: ${comparison.degradation.toFixed(2)}ms

Detailed Results:
${this.generateDetailedResults(baseline, current)}
    `.trim();
  }

  private static generateDetailedResults(
    baseline: PerformanceBenchmark,
    current: PerformanceBenchmark
  ): string {
    let report = '';
    
    // Find common tests
    const baselineTestNames = new Set(baseline.tests.map(test => test.name));
    const currentTestNames = new Set(current.tests.map(test => test.name));
    const commonTests = [...baselineTestNames].filter(name => currentTestNames.has(name));
    
    for (const testName of commonTests) {
      const baselineTest = baseline.tests.find(test => test.name === testName);
      const currentTest = current.tests.find(test => test.name === testName);
      
      if (baselineTest && currentTest) {
        const change = currentTest.duration - baselineTest.duration;
        const changePercent = (change / baselineTest.duration) * 100;
        
        report += `
${testName}:
  Baseline: ${baselineTest.duration.toFixed(2)}ms (${baselineTest.passed ? 'PASS' : 'FAIL'})
  Current: ${currentTest.duration.toFixed(2)}ms (${currentTest.passed ? 'PASS' : 'FAIL'})
  Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}ms (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)
        `;
      }
    }
    
    return report;
  }
}

// Performance monitoring hook
export function usePerformanceTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PerformanceBenchmark[]>([]);
  useEffect(() => {
    // Initialize performance testing
  }, []);

  const runBenchmark = useCallback(async (
    name: string,
    tests: Array<{
      name: string;
      testFn: () => Promise<number> | number;
      threshold: number;
      unit?: string;
      details?: Record<string, unknown>;
    }>
  ) => {
    setIsRunning(true);
    
    try {
      const benchmark = await PerformanceTestRunner.runBenchmark(name, tests);
      setResults((prev: PerformanceBenchmark[]) => [...prev, benchmark]);
      return benchmark;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    PerformanceTestRunner.clearResults();
  }, []);

  return {
    isRunning,
    results,
    runBenchmark,
    clearResults,
  };
}

// Performance profiling utilities
export class PerformanceProfiler {
  private static profiles: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    marks: Array<{ name: string; time: number }>;
  }> = [];

  static startProfile(name: string): void {
    this.profiles.push({
      name,
      startTime: performance.now(),
      marks: [],
    });
  }

  static endProfile(name: string): number {
    const profile = this.profiles.find(p => p.name === name && !p.endTime);
    if (!profile) return 0;

    const endTime = performance.now();
    const duration = endTime - profile.startTime;
    
    profile.endTime = endTime;
    profile.duration = duration;
    
    return duration;
  }

  static addMark(name: string, markName: string): void {
    const profile = this.profiles.find(p => p.name === name && !p.endTime);
    if (profile) {
      profile.marks.push({
        name: markName,
        time: performance.now(),
      });
    }
  }

  static getProfile(name: string) {
    return this.profiles.find(p => p.name === name);
  }

  static getAllProfiles() {
    return [...this.profiles];
  }

  static clearProfiles(): void {
    this.profiles = [];
  }
}

// Export all utilities
export default {
  PerformanceTestRunner,
  PerformanceTests,
  PerformanceComparator,
  usePerformanceTesting,
  PerformanceProfiler,
};