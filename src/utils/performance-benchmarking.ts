// Performance benchmarking utilities for NovaTask

export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
  p99: number;
  standardDeviation: number;
  timestamp: string;
}

export interface BenchmarkSuite {
  name: string;
  benchmarks: BenchmarkResult[];
  totalDuration: number;
  timestamp: string;
}

export interface BenchmarkComparison {
  baseline: BenchmarkSuite;
  current: BenchmarkSuite;
  improvements: Array<{
    name: string;
    improvement: number;
    improvementPercent: number;
    significant: boolean;
  }>;
  regressions: Array<{
    name: string;
    regression: number;
    regressionPercent: number;
    significant: boolean;
  }>;
  overallImprovement: number;
  overallImprovementPercent: number;
}

// Benchmark runner class
export class BenchmarkRunner {
  private static results: BenchmarkResult[] = [];

  static async runBenchmark(
    name: string,
    fn: () => void | Promise<void>,
    options: {
      iterations?: number;
      warmupIterations?: number;
      minTime?: number;
      maxTime?: number;
    } = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 100,
      warmupIterations = 10,
      minTime = 100,
      maxTime = 5000
    } = options;

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    const times: number[] = [];
    let totalDuration = 0;

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      times.push(duration);
      totalDuration += duration;

      // Stop if we've exceeded max time
      if (totalDuration > maxTime) {
        break;
      }
    }

    // Calculate statistics
    const sortedTimes = times.sort((a, b) => a - b);
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];
    const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    // Calculate standard deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    const result: BenchmarkResult = {
      name,
      duration: totalDuration,
      iterations: times.length,
      average,
      min,
      max,
      median,
      p95,
      p99,
      standardDeviation,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);
    return result;
  }

  static async runSuite(
    name: string,
    benchmarks: Array<{
      name: string;
      fn: () => void | Promise<void>;
      options?: {
        iterations?: number;
        warmupIterations?: number;
        minTime?: number;
        maxTime?: number;
      };
    }>
  ): Promise<BenchmarkSuite> {
    const startTime = performance.now();
    const results: BenchmarkResult[] = [];

    for (const benchmark of benchmarks) {
      const result = await this.runBenchmark(benchmark.name, benchmark.fn, benchmark.options);
      results.push(result);
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const suite: BenchmarkSuite = {
      name,
      benchmarks: results,
      totalDuration,
      timestamp: new Date().toISOString(),
    };

    return suite;
  }

  static getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  static clearResults(): void {
    this.results = [];
  }
}

// Benchmark comparison utilities
export class BenchmarkComparator {
  static compareSuites(baseline: BenchmarkSuite, current: BenchmarkSuite): BenchmarkComparison {
    const improvements: Array<{
      name: string;
      improvement: number;
      improvementPercent: number;
      significant: boolean;
    }> = [];

    const regressions: Array<{
      name: string;
      regression: number;
      regressionPercent: number;
      significant: boolean;
    }> = [];

    let totalImprovement = 0;
    let totalBaseline = 0;

    // Compare individual benchmarks
    for (const currentBenchmark of current.benchmarks) {
      const baselineBenchmark = baseline.benchmarks.find(b => b.name === currentBenchmark.name);
      
      if (baselineBenchmark) {
        const improvement = baselineBenchmark.average - currentBenchmark.average;
        const improvementPercent = (improvement / baselineBenchmark.average) * 100;
        
        // Check if improvement is statistically significant (using 95% confidence interval)
        const significant = Math.abs(improvement) > (baselineBenchmark.standardDeviation * 1.96);
        
        if (improvement > 0) {
          improvements.push({
            name: currentBenchmark.name,
            improvement,
            improvementPercent,
            significant,
          });
        } else if (improvement < 0) {
          regressions.push({
            name: currentBenchmark.name,
            regression: Math.abs(improvement),
            regressionPercent: Math.abs(improvementPercent),
            significant,
          });
        }

        totalImprovement += improvement;
        totalBaseline += baselineBenchmark.average;
      }
    }

    const overallImprovement = totalImprovement;
    const overallImprovementPercent = totalBaseline > 0 ? (totalImprovement / totalBaseline) * 100 : 0;

    return {
      baseline,
      current,
      improvements,
      regressions,
      overallImprovement,
      overallImprovementPercent,
    };
  }

  static generateReport(comparison: BenchmarkComparison): string {
    const { baseline, current, improvements, regressions, overallImprovement, overallImprovementPercent } = comparison;

    return `
Benchmark Comparison Report
========================

Baseline: ${baseline.name} (${baseline.timestamp})
- Total Duration: ${baseline.totalDuration.toFixed(2)}ms
- Benchmarks: ${baseline.benchmarks.length}

Current: ${current.name} (${current.timestamp})
- Total Duration: ${current.totalDuration.toFixed(2)}ms
- Benchmarks: ${current.benchmarks.length}

Overall Performance:
- ${overallImprovement > 0 ? '✅ IMPROVEMENT' : overallImprovement < 0 ? '❌ REGRESSION' : '⚠️ NO CHANGE'}
- Overall Change: ${overallImprovement > 0 ? '+' : ''}${overallImprovement.toFixed(2)}ms (${overallImprovementPercent > 0 ? '+' : ''}${overallImprovementPercent.toFixed(1)}%)

Improvements (${improvements.length}):
${improvements.map(imp => 
  `  ✅ ${imp.name}: ${imp.improvement.toFixed(2)}ms (${imp.improvementPercent.toFixed(1)}%) ${imp.significant ? '(significant)' : '(not significant)'}`
).join('\n')}

Regressions (${regressions.length}):
${regressions.map(reg => 
  `  ❌ ${reg.name}: ${reg.regression.toFixed(2)}ms (${reg.regressionPercent.toFixed(1)}%) ${reg.significant ? '(significant)' : '(not significant)'}`
).join('\n')}

Detailed Results:
${this.generateDetailedResults(baseline, current)}
    `.trim();
  }

  private static generateDetailedResults(baseline: BenchmarkSuite, current: BenchmarkSuite): string {
    let report = '';
    
    for (const currentBenchmark of current.benchmarks) {
      const baselineBenchmark = baseline.benchmarks.find(b => b.name === currentBenchmark.name);
      
      if (baselineBenchmark) {
        const improvement = baselineBenchmark.average - currentBenchmark.average;
        const improvementPercent = (improvement / baselineBenchmark.average) * 100;
        
        report += `
${currentBenchmark.name}:
  Baseline: ${baselineBenchmark.average.toFixed(2)}ms (±${baselineBenchmark.standardDeviation.toFixed(2)}ms)
  Current:  ${currentBenchmark.average.toFixed(2)}ms (±${currentBenchmark.standardDeviation.toFixed(2)}ms)
  Change:   ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}ms (${improvementPercent > 0 ? '+' : ''}${improvementPercent.toFixed(1)}%)
  P95:      ${baselineBenchmark.p95.toFixed(2)}ms → ${currentBenchmark.p95.toFixed(2)}ms
  P99:      ${baselineBenchmark.p99.toFixed(2)}ms → ${currentBenchmark.p99.toFixed(2)}ms
        `;
      }
    }
    
    return report;
  }
}

// Predefined benchmarks for common operations
export class CommonBenchmarks {
  static benchmarkArrayOperations(): Array<{
    name: string;
    fn: () => void;
  }> {
    const largeArray = Array.from({ length: 10000 }, (_, i) => i);
    const largeObjectArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: Math.random() }));

    return [
      {
        name: 'Array.map',
        fn: () => {
          largeArray.map(x => x * 2);
        },
      },
      {
        name: 'Array.filter',
        fn: () => {
          largeArray.filter(x => x % 2 === 0);
        },
      },
      {
        name: 'Array.reduce',
        fn: () => {
          largeArray.reduce((sum, x) => sum + x, 0);
        },
      },
      {
        name: 'Array.find',
        fn: () => {
          largeArray.find(x => x === 5000);
        },
      },
      {
        name: 'Array.includes',
        fn: () => {
          largeArray.includes(5000);
        },
      },
      {
        name: 'Object array filter',
        fn: () => {
          largeObjectArray.filter(obj => obj.value > 0.5);
        },
      },
      {
        name: 'Object array find',
        fn: () => {
          largeObjectArray.find(obj => obj.id === 5000);
        },
      },
    ];
  }

  static benchmarkStringOperations(): Array<{
    name: string;
    fn: () => void;
  }> {
    const longString = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
    const stringArray = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);

    return [
      {
        name: 'String concatenation',
        fn: () => {
          longString + longString;
        },
      },
      {
        name: 'String split',
        fn: () => {
          longString.split(' ');
        },
      },
      {
        name: 'String join',
        fn: () => {
          stringArray.join(', ');
        },
      },
      {
        name: 'String replace',
        fn: () => {
          longString.replace(/ipsum/g, 'replacement');
        },
      },
      {
        name: 'String match',
        fn: () => {
          longString.match(/ipsum/g);
        },
      },
    ];
  }

  static benchmarkDOMOperations(): Array<{
    name: string;
    fn: () => void;
  }> {
    const container = document.createElement('div');
    document.body.appendChild(container);

    return [
      {
        name: 'DOM element creation',
        fn: () => {
          const div = document.createElement('div');
          div.textContent = 'Test';
          container.appendChild(div);
          container.removeChild(div);
        },
      },
      {
        name: 'DOM property access',
        fn: () => {
          container.style.color = 'red';
          container.style.backgroundColor = 'blue';
          container.style.padding = '10px';
          container.style.margin = '5px';
        },
      },
      {
        name: 'DOM classList operations',
        fn: () => {
          container.classList.add('test-class');
          container.classList.remove('test-class');
          container.classList.toggle('test-class');
        },
      },
    ];
  }

  static benchmarkReactOperations(): Array<{
    name: string;
    fn: () => void;
  }> {
    // These would need to be implemented in a React context
    return [
      {
        name: 'Component render',
        fn: () => {
          // Placeholder for React component rendering benchmark
          console.log('React render benchmark');
        },
      },
      {
        name: 'State update',
        fn: () => {
          // Placeholder for React state update benchmark
          console.log('React state update benchmark');
        },
      },
      {
        name: 'Props update',
        fn: () => {
          // Placeholder for React props update benchmark
          console.log('React props update benchmark');
        },
      },
    ];
  }
}

// Performance profiling utilities
export class PerformanceProfiler {
  private static profiles: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    marks: Array<{ name: string; time: number }>;
    measures: Array<{ name: string; startTime: number; duration: number }>;
  }> = [];

  static startProfile(name: string): void {
    this.profiles.push({
      name,
      startTime: performance.now(),
      marks: [],
      measures: [],
    });
    
    performance.mark(`${name}-start`);
  }

  static endProfile(name: string): number {
    const profile = this.profiles.find(p => p.name === name && !p.endTime);
    if (!profile) return 0;

    const endTime = performance.now();
    const duration = endTime - profile.startTime;
    
    profile.endTime = endTime;
    profile.duration = duration;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    return duration;
  }

  static addMark(name: string, markName: string): void {
    const profile = this.profiles.find(p => p.name === name && !p.endTime);
    if (profile) {
      const time = performance.now();
      profile.marks.push({
        name: markName,
        time,
      });
      
      performance.mark(`${name}-${markName}`);
    }
  }

  static addMeasure(name: string, measureName: string, startMark: string, endMark: string): void {
    const profile = this.profiles.find(p => p.name === name && !p.endTime);
    if (profile) {
      performance.measure(`${name}-${measureName}`, `${name}-${startMark}`, `${name}-${endMark}`);
      
      const measure = performance.getEntriesByName(`${name}-${measureName}`, 'measure')[0];
      if (measure) {
        profile.measures.push({
          name: measureName,
          startTime: measure.startTime,
          duration: measure.duration,
        });
      }
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
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Export all utilities
export default {
  BenchmarkRunner,
  BenchmarkComparator,
  CommonBenchmarks,
  PerformanceProfiler,
};