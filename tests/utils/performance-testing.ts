// Performance testing utilities for NovaTask application

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
  memoryUsage: number;
  bundleSize: number;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface PerformanceTestOptions {
  iterations?: number;
  warmupIterations?: number;
  maxRenderTime?: number;
  maxMemoryUsage?: number;
  maxBundleSize?: number;
  maxLoadTime?: number;
}

interface PerformanceTestResult {
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  averageMemoryUsage: number;
  maxMemoryUsage: number;
  minMemoryUsage: number;
  bundleSize: number;
  loadTime: number;
  passed: boolean;
  recommendations: string[];
}

// Performance testing utilities
export class PerformanceTester {
  private metrics: PerformanceMetrics[] = [];
  private options: PerformanceTestOptions;

  constructor(options: PerformanceTestOptions = {}) {
    this.options = {
      iterations: 10,
      warmupIterations: 3,
      maxRenderTime: 100, // ms
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxBundleSize: 1024 * 1024, // 1MB
      maxLoadTime: 3000, // 3 seconds
      ...options,
    };
  }

  // Measure render performance
  async measureRenderPerformance(
    renderFunction: () => void,
    componentName: string
  ): Promise<PerformanceTestResult> {
    const { iterations, warmupIterations, maxRenderTime } = this.options;
    const renderTimes: number[] = [];
    const memoryUsages: number[] = [];

    // Warmup iterations
    for (let i = 0; i < warmupIterations; i++) {
      renderFunction();
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Actual measurements
    for (let i = 0; i < iterations; i++) {
      // Clear garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();

      renderFunction();

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      renderTimes.push(endTime - startTime);
      memoryUsages.push(endMemory - startMemory);

      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTimeMeasured = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    const averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const maxMemoryUsageMeasured = Math.max(...memoryUsages);
    const minMemoryUsage = Math.min(...memoryUsages);

    const passed = averageRenderTime <= (maxRenderTime || 100);
    const recommendations = this.generateRenderRecommendations(
      componentName,
      averageRenderTime,
      maxRenderTimeMeasured,
      averageMemoryUsage
    );

    return {
      averageRenderTime,
      maxRenderTime: maxRenderTimeMeasured,
      minRenderTime,
      averageMemoryUsage,
      maxMemoryUsage: maxMemoryUsageMeasured,
      minMemoryUsage,
      bundleSize: 0,
      loadTime: 0,
      passed,
      recommendations,
    };
  }

  // Measure bundle size
  async measureBundleSize(bundlePath: string): Promise<number> {
    try {
      // In a real implementation, this would analyze the actual bundle
      // For now, we'll return a mock value
      const mockBundleSize = Math.floor(Math.random() * 500000) + 100000; // 100KB - 600KB
      return mockBundleSize;
    } catch (error) {
      console.error('Error measuring bundle size:', error);
      return 0;
    }
  }

  // Measure load time
  async measureLoadTime(url: string): Promise<number> {
    const startTime = performance.now();
    
    try {
      // In a real implementation, this would measure actual page load time
      // For now, we'll simulate a load time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      const endTime = performance.now();
      return endTime - startTime;
    } catch (error) {
      console.error('Error measuring load time:', error);
      return 0;
    }
  }

  // Measure Core Web Vitals
  async measureCoreWebVitals(): Promise<{
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  }> {
    // In a real implementation, this would use the Web Vitals library
    // For now, we'll return mock values
    return {
      firstContentfulPaint: Math.random() * 2000 + 500, // 500ms - 2500ms
      largestContentfulPaint: Math.random() * 3000 + 1000, // 1000ms - 4000ms
      cumulativeLayoutShift: Math.random() * 0.25, // 0 - 0.25
      firstInputDelay: Math.random() * 100 + 10, // 10ms - 110ms
    };
  }

  // Get memory usage
  private getMemoryUsage(): number {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  // Generate performance recommendations
  private generateRenderRecommendations(
    componentName: string,
    averageRenderTime: number,
    maxRenderTime: number,
    averageMemoryUsage: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageRenderTime > 16) {
      recommendations.push(
        `${componentName}: Average render time (${averageRenderTime.toFixed(2)}ms) exceeds 16ms target. Consider optimizing component logic.`
      );
    }

    if (maxRenderTime > 100) {
      recommendations.push(
        `${componentName}: Max render time (${maxRenderTime.toFixed(2)}ms) is high. Check for expensive operations.`
      );
    }

    if (averageMemoryUsage > 10 * 1024 * 1024) {
      recommendations.push(
        `${componentName}: High memory usage (${(averageMemoryUsage / 1024 / 1024).toFixed(2)}MB). Consider memory optimization.`
      );
    }

    return recommendations;
  }

  // Run comprehensive performance test
  async runComprehensiveTest(
    renderFunction: () => void,
    componentName: string,
    bundlePath?: string,
    url?: string
  ): Promise<PerformanceTestResult & { coreWebVitals?: any }> {
    const renderResults = await this.measureRenderPerformance(renderFunction, componentName);
    
    const bundleSize = bundlePath ? await this.measureBundleSize(bundlePath) : 0;
    const loadTime = url ? await this.measureLoadTime(url) : 0;
    const coreWebVitals = await this.measureCoreWebVitals();

    const passed = 
      renderResults.passed &&
      bundleSize <= (this.options.maxBundleSize || Infinity) &&
      loadTime <= (this.options.maxLoadTime || Infinity);

    return {
      ...renderResults,
      bundleSize,
      loadTime,
      passed,
      coreWebVitals,
    };
  }
}

// Performance testing helper functions
export const performanceHelpers = {
  // Test component render performance
  async testComponentRenderPerformance(
    Component: React.ComponentType<any>,
    props: any,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceTestResult> {
    const tester = new PerformanceTester(options);
    
    return tester.measureRenderPerformance(() => {
      // In a real implementation, this would render the component
      // For now, we'll simulate the render
      const startTime = performance.now();
      while (performance.now() - startTime < Math.random() * 50 + 10) {
        // Simulate work
      }
    }, Component.name || 'Component');
  },

  // Test list rendering performance
  async testListRenderingPerformance(
    itemCount: number,
    renderItem: (index: number) => React.ReactElement,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceTestResult> {
    const tester = new PerformanceTester(options);
    
    return tester.measureRenderPerformance(() => {
      // Simulate rendering a list
      for (let i = 0; i < itemCount; i++) {
        renderItem(i);
      }
    }, `List with ${itemCount} items`);
  },

  // Test animation performance
  async testAnimationPerformance(
    animationFunction: () => void,
    duration: number,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceTestResult> {
    const tester = new PerformanceTester(options);
    
    return tester.measureRenderPerformance(() => {
      // Simulate animation
      const startTime = performance.now();
      while (performance.now() - startTime < duration) {
        animationFunction();
      }
    }, `Animation (${duration}ms)`);
  },

  // Test memory leak
  async testMemoryLeak(
    operation: () => void,
    iterations: number = 100,
    options: PerformanceTestOptions = {}
  ): Promise<{ hasMemoryLeak: boolean; memoryGrowth: number; recommendations: string[] }> {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryUsages: number[] = [];

    for (let i = 0; i < iterations; i++) {
      operation();
      
      if (performance.memory) {
        memoryUsages.push(performance.memory.usedJSHeapSize);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryGrowth = finalMemory - initialMemory;
    const hasMemoryLeak = memoryGrowth > 10 * 1024 * 1024; // 10MB threshold

    const recommendations: string[] = [];
    if (hasMemoryLeak) {
      recommendations.push(
        `Potential memory leak detected. Memory grew by ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB over ${iterations} iterations.`
      );
      recommendations.push('Check for event listeners, timers, or references that are not being cleaned up.');
    }

    return {
      hasMemoryLeak,
      memoryGrowth,
      recommendations,
    };
  },

  // Test bundle size impact
  async testBundleSizeImpact(
    baselineBundlePath: string,
    optimizedBundlePath: string
  ): Promise<{
    baselineSize: number;
    optimizedSize: number;
    sizeReduction: number;
    percentageReduction: number;
    recommendations: string[];
  }> {
    const tester = new PerformanceTester();
    
    const baselineSize = await tester.measureBundleSize(baselineBundlePath);
    const optimizedSize = await tester.measureBundleSize(optimizedBundlePath);
    const sizeReduction = baselineSize - optimizedSize;
    const percentageReduction = (sizeReduction / baselineSize) * 100;

    const recommendations: string[] = [];
    if (percentageReduction > 10) {
      recommendations.push(
        `Excellent optimization! Bundle size reduced by ${percentageReduction.toFixed(2)}% (${(sizeReduction / 1024).toFixed(2)}KB).`
      );
    } else if (percentageReduction > 0) {
      recommendations.push(
        `Bundle size reduced by ${percentageReduction.toFixed(2)}% (${(sizeReduction / 1024).toFixed(2)}KB). Consider further optimization.`
      );
    } else {
      recommendations.push(
        'No bundle size reduction achieved. Review optimization strategies.'
      );
    }

    return {
      baselineSize,
      optimizedSize,
      sizeReduction,
      percentageReduction,
      recommendations,
    };
  },

  // Test network performance
  async testNetworkPerformance(
    url: string,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<{
    loadTime: number;
    responseSize: number;
    success: boolean;
    recommendations: string[];
  }> {
    const { timeout = 5000, retries = 3 } = options;
    const startTime = performance.now();
    let success = false;
    let responseSize = 0;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      success = response.ok;
      responseSize = parseInt(response.headers.get('content-length') || '0');
    } catch (error) {
      success = false;
    }

    const loadTime = performance.now() - startTime;

    const recommendations: string[] = [];
    if (!success) {
      recommendations.push('Network request failed. Check URL and server availability.');
    } else if (loadTime > 1000) {
      recommendations.push(
        `Slow network response (${loadTime.toFixed(2)}ms). Consider optimization or caching.`
      );
    }

    return {
      loadTime,
      responseSize,
      success,
      recommendations,
    };
  },

  // Generate performance report
  generatePerformanceReport(results: PerformanceTestResult[]): string {
    const report = [
      '# Performance Test Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total tests: ${results.length}`,
      `- Passed: ${results.filter(r => r.passed).length}`,
      `- Failed: ${results.filter(r => !r.passed).length}`,
      '',
      '## Test Results',
    ];

    results.forEach((result, index) => {
      report.push(`### Test ${index + 1}`);
      report.push(`- Average render time: ${result.averageRenderTime.toFixed(2)}ms`);
      report.push(`- Max render time: ${result.maxRenderTime.toFixed(2)}ms`);
      report.push(`- Average memory usage: ${(result.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
      report.push(`- Bundle size: ${(result.bundleSize / 1024).toFixed(2)}KB`);
      report.push(`- Load time: ${result.loadTime.toFixed(2)}ms`);
      report.push(`- Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
      
      if (result.recommendations.length > 0) {
        report.push('- Recommendations:');
        result.recommendations.forEach(rec => {
          report.push(`  - ${rec}`);
        });
      }
      report.push('');
    });

    return report.join('\n');
  },
};

// Performance monitoring utilities
export const performanceMonitor = {
  // Start performance monitoring
  startMonitoring(componentName: string): () => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    let reRenderCount = 0;

    const observer = new MutationObserver(() => {
      reRenderCount++;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      observer.disconnect();

      return {
        renderTime: endTime - startTime,
        componentCount: document.querySelectorAll('*').length,
        reRenderCount,
        memoryUsage: endMemory - startMemory,
        bundleSize: 0,
        loadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
      };
    };
  },

  // Create performance mark
  mark(name: string): void {
    performance.mark(`${name}-start`);
  },

  // Measure performance between marks
  measure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    const measure = performance.getEntriesByName(name, 'measure')[0];
    return measure ? measure.duration : 0;
  },

  // Clear performance marks
  clearMarks(name?: string): void {
    if (name) {
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};

// Export performance testing utilities
export { PerformanceTester, PerformanceTestOptions, PerformanceTestResult, PerformanceMetrics };