// Bundle optimization utilities for NovaTask
import { useState, useEffect } from 'react';

// Dynamic import utilities for code splitting
export function createDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  chunkName?: string
) {
  return async (): Promise<T> => {
    try {
      if (chunkName) {
        console.log(`Loading chunk: ${chunkName}`);
      }
      
      const moduleResult = await importFn();
      return moduleResult.default;
    } catch (error) {
      console.error(`Failed to load chunk${chunkName ? ` ${chunkName}` : ''}:`, error);
      throw error;
    }
  };
}

// Preload chunks during idle time
export function preloadChunk(importFn: () => Promise<{ default: unknown }>, chunkName?: string) {
  if ('requestIdleCallback' in window) {
    (window as { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => {
      importFn().catch(error => {
        console.warn(`Failed to preload chunk ${chunkName}:`, error);
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFn().catch(error => {
        console.warn(`Failed to preload chunk ${chunkName}:`, error);
      });
    }, 2000);
  }
}

// Chunk loading manager
export class ChunkManager {
  private static loadedChunks = new Set<string>();
  private static loadingChunks = new Set<string>();
  private static failedChunks = new Set<string>();

  static async loadChunk<T>(
    chunkName: string,
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    if (this.loadedChunks.has(chunkName)) {
      return importFn().then(module => module.default);
    }

    if (this.loadingChunks.has(chunkName)) {
      // Wait for existing load to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.loadedChunks.has(chunkName)) {
            clearInterval(checkInterval);
            importFn().then(module => resolve(module.default))
              .catch(reject);
          } else if (this.failedChunks.has(chunkName)) {
            clearInterval(checkInterval);
            reject(new Error(`Chunk ${chunkName} failed to load`));
          }
        }, 100);
      });
    }

    this.loadingChunks.add(chunkName);

    try {
      const moduleResult = await importFn();
      this.loadedChunks.add(chunkName);
      this.loadingChunks.delete(chunkName);
      return moduleResult.default;
    } catch (error) {
      this.failedChunks.add(chunkName);
      this.loadingChunks.delete(chunkName);
      throw error;
    }
  }

  static preloadChunk<T>(
    chunkName: string,
    importFn: () => Promise<{ default: T }>
  ) {
    if (!this.loadedChunks.has(chunkName) && !this.loadingChunks.has(chunkName)) {
      preloadChunk(importFn, chunkName);
    }
  }

  static getChunkStatus(chunkName: string): 'loaded' | 'loading' | 'failed' | 'not-loaded' {
    if (this.loadedChunks.has(chunkName)) return 'loaded';
    if (this.loadingChunks.has(chunkName)) return 'loading';
    if (this.failedChunks.has(chunkName)) return 'failed';
    return 'not-loaded';
  }

  static getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks);
  }

  static reset() {
    this.loadedChunks.clear();
    this.loadingChunks.clear();
    this.failedChunks.clear();
  }
}

// Tree shaking utilities
export function createTreeShakableExports<T extends Record<string, unknown>>(
  exports: T,
  options: {
    sideEffects?: boolean;
    pure?: boolean;
  } = {}
) {
  const { sideEffects = false, pure = true } = options;
  
  return new Proxy(exports, {
    get(target, prop) {
      const value = target[prop as keyof T];
      
      if (pure && typeof value === 'function') {
        // Mark function as pure for better tree shaking
        return Object.defineProperty(value, '__pure', {
          value: true,
          configurable: false,
        });
      }
      
      return value;
    },
    
    has(target, prop) {
      return prop in target;
    },
    
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
  });
}

// Bundle analysis utilities
export class BundleAnalyzer {
  private static metrics = {
    totalSize: 0,
    chunkCount: 0,
    loadedChunks: 0,
    loadTime: 0,
    compressionRatio: 0,
  };

  static analyzeBundle() {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return this.metrics;
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));

    this.metrics.totalSize = jsResources.reduce((total, r) => total + (r.transferSize || 0), 0) +
                              cssResources.reduce((total, r) => total + (r.transferSize || 0), 0);
    this.metrics.chunkCount = jsResources.length + cssResources.length;
    this.metrics.loadedChunks = jsResources.filter(r => r.decodedBodySize && r.decodedBodySize > 0).length;

    // Calculate compression ratio
    const totalEncodedSize = jsResources.reduce((total, r) => total + (r.encodedBodySize || 0), 0);
    const totalDecodedSize = jsResources.reduce((total, r) => total + (r.decodedBodySize || 0), 0);
    this.metrics.compressionRatio = totalEncodedSize > 0 ? (totalEncodedSize - totalDecodedSize) / totalEncodedSize : 0;

    return this.metrics;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static reset() {
    this.metrics = {
      totalSize: 0,
      chunkCount: 0,
      loadedChunks: 0,
      loadTime: 0,
      compressionRatio: 0,
    };
  }
}

// Import optimization for third-party libraries
export function optimizeImports() {
  // Example of how to optimize imports for better tree shaking
  return {
    // Instead of: import * as lodash from 'lodash';
    // Use: import { debounce } from 'lodash-es/debounce';
    
    // Instead of: import moment from 'moment';
    // Use: import { format } from 'date-fns/format';
    
    // Instead of: import 'antd/dist/antd.css';
    // Use: import 'antd/es/button/style/css';
    
    recommendations: [
      'Use ES modules versions of libraries',
      'Import specific functions instead of entire libraries',
      'Use CSS modules for component styles',
      'Avoid importing large libraries in main bundle',
      'Use dynamic imports for rarely used components',
    ],
  };
}

// Critical resource preloading
export function preloadCriticalResources() {
  if (typeof document === 'undefined') return;

  // Preload critical CSS
  const criticalCSS = [
    '/styles/critical.css',
    '/styles/components.css',
  ];

  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });

  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-var.woff2',
    '/fonts/inter-bold.woff2',
  ];

  criticalFonts.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical JavaScript
  const criticalJS = [
    '/chunks/vendor.js',
    '/chunks/main.js',
  ];

  criticalJS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = href;
    document.head.appendChild(link);
  });
}

// Resource hints for better loading
export function addResourceHints() {
  if (typeof document === 'undefined') return;

  // DNS prefetch for external resources
  const dnsPrefetch = [
    '//fonts.googleapis.com',
    '//cdn.jsdelivr.net',
  ];

  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `https:${domain}`;
    document.head.appendChild(link);
  });

  // Preconnect for critical origins
  const preconnect = [
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ];

  preconnect.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Bundle size monitoring
export function useBundleSizeMonitor() {
  const [bundleSize, setBundleSize] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const updateMetrics = () => {
      const metrics = BundleAnalyzer.analyzeBundle();
      setBundleSize(metrics.totalSize);
      setChunkCount(metrics.chunkCount);
    };

    // Update metrics immediately
    updateMetrics();

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    bundleSize,
    chunkCount,
    getSizeInKB: () => (bundleSize / 1024).toFixed(2),
    getSizeInMB: () => (bundleSize / (1024 * 1024)).toFixed(2),
  };
}

// Code splitting strategy
export function createCodeSplittingStrategy() {
  return {
    // Split by route
    routes: {
      '/': 'home',
      '/settings': 'settings',
      '/about': 'about',
    },

    // Split by feature
    features: {
      'todo-list': 'TodoList',
      'todo-form': 'TodoForm',
      'todo-stats': 'TodoStats',
      'filters': 'TodoFilters',
    },

    // Split by library size
    libraries: {
      'large-lib': 'vendor-large',
      'medium-lib': 'vendor-medium',
      'small-lib': 'vendor-small',
    },

    // Split by device capability
    device: {
      'mobile': 'mobile-features',
      'desktop': 'desktop-features',
      'touch': 'touch-features',
    },

    // Recommendations
    recommendations: [
      'Split routes that are rarely accessed',
      'Separate large third-party libraries',
      'Create device-specific bundles',
      'Use dynamic imports for conditional features',
      'Implement progressive loading for non-critical features',
    ],
  };
}

// Export all utilities
export default {
  createDynamicImport,
  preloadChunk,
  ChunkManager,
  createTreeShakableExports,
  BundleAnalyzer,
  optimizeImports,
  preloadCriticalResources,
  addResourceHints,
  useBundleSizeMonitor,
  createCodeSplittingStrategy,
};