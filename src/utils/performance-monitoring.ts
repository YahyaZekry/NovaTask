// Performance monitoring utilities for NovaTask
import { useRef, useEffect, useLayoutEffect } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
  memoryUsage: number;
  bundleSize: number;
  loadTime: number;
  interactionTime: number;
}

export interface ComponentMetrics {
  name: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  mountTime: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private componentMetrics: Map<string, ComponentMetrics>;
  private observers: PerformanceObserver[];
  private isMonitoring: boolean;

  private constructor() {
    this.metrics = {
      renderTime: 0,
      componentCount: 0,
      reRenderCount: 0,
      memoryUsage: 0,
      bundleSize: 0,
      loadTime: 0,
      interactionTime: 0,
    };
    this.componentMetrics = new Map();
    this.observers = [];
    this.isMonitoring = false;
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.measureInitialLoadTime();
    this.measureMemoryUsage();
    this.measureBundleSize();
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  private setupPerformanceObservers() {
    // Measure render performance
    if ('PerformanceObserver' in window) {
      const renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.metrics.renderTime += entry.duration;
            this.metrics.reRenderCount++;
          }
        }
      });

      renderObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(renderObserver);

      // Measure interaction time
      const interactionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event') {
            this.metrics.interactionTime += entry.duration;
          }
        }
      });

      interactionObserver.observe({ entryTypes: ['event'] });
      this.observers.push(interactionObserver);
    }
  }

  private measureInitialLoadTime() {
    if ('performance' in window && 'navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
    }
  }

  private measureMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }
  }

  private measureBundleSize() {
    // Estimate bundle size from loaded resources
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const bundleResources = resources.filter(resource => 
        resource.name.includes('.js') || resource.name.includes('.css')
      );
      
      this.metrics.bundleSize = bundleResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
    }
  }

  recordComponentRender(componentName: string, renderTime: number) {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentMetrics.set(componentName, {
        name: componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        mountTime: renderTime,
      });
    }

    this.metrics.componentCount = this.componentMetrics.size;
  }

  getMetrics(): PerformanceMetrics {
    this.measureMemoryUsage();
    return { ...this.metrics };
  }

  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  getComponentMetricsByName(componentName: string): ComponentMetrics | undefined {
    return this.componentMetrics.get(componentName);
  }

  resetMetrics() {
    this.metrics = {
      renderTime: 0,
      componentCount: 0,
      reRenderCount: 0,
      memoryUsage: 0,
      bundleSize: 0,
      loadTime: 0,
      interactionTime: 0,
    };
    this.componentMetrics.clear();
  }

  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      overall: this.metrics,
      components: this.getComponentMetrics(),
      recommendations: this.generateRecommendations(),
    };

    return JSON.stringify(report, null, 2);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    if (metrics.renderTime > 100) {
      recommendations.push('Consider optimizing render performance - render time is high');
    }

    if (metrics.reRenderCount > 100) {
      recommendations.push('High re-render count detected - consider using React.memo or useMemo');
    }

    if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected - consider memory optimization');
    }

    if (metrics.loadTime > 3000) { // 3 seconds
      recommendations.push('Slow load time detected - consider code splitting and lazy loading');
    }

    // Component-specific recommendations
    for (const [name, component] of this.componentMetrics) {
      if (component.averageRenderTime > 16) { // 60fps threshold
        recommendations.push(`Component "${name}" has slow renders (${component.averageRenderTime.toFixed(2)}ms)`);
      }

      if (component.renderCount > 50) {
        recommendations.push(`Component "${name}" re-renders frequently (${component.renderCount} times)`);
      }
    }

    return recommendations;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    if (!monitor['isMonitoring']) {
      monitor.startMonitoring();
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  useLayoutEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      monitor.recordComponentRender(componentName, renderTime);
    };
  });

  return {
    getMetrics: () => monitor.getMetrics(),
    getComponentMetrics: () => monitor.getComponentMetricsByName(componentName),
    generateReport: () => monitor.generateReport(),
  };
}

// Performance measurement utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  if ('performance' in window && 'mark' in performance) {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
  
  console.log(`[Performance] ${name}: ${(endTime - startTime).toFixed(2)}ms`);
  return result;
}

export function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return fn().then(result => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    
    return result;
  });
}

// Performance debugging utilities
export class PerformanceDebugger {
  private static logs: Array<{
    timestamp: number;
    component: string;
    action: string;
    duration: number;
    details?: Record<string, unknown>;
  }> = [];

  static log(component: string, action: string, duration: number, details?: Record<string, unknown>) {
    this.logs.push({
      timestamp: Date.now(),
      component,
      action,
      duration,
      details,
    });

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  static getLogs() {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();