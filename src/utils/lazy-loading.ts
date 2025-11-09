import { lazy, ComponentType, Suspense, ReactNode } from 'react';
import { SkeletonLoader } from '@/components/SkeletonLoader';

// Lazy loading with custom fallback
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <SkeletonLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer for lazy loading
export class LazyLoader {
  private static observer: IntersectionObserver | null = null;
  private static elements = new Map<Element, () => void>();

  static init() {
    if (typeof window === 'undefined') return;

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const callback = this.elements.get(entry.target);
              if (callback) {
                callback();
                this.observer?.unobserve(entry.target);
                this.elements.delete(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before element comes into view
          threshold: 0.1,
        }
      );
    }
  }

  static observe(element: Element, callback: () => void) {
    if (!this.observer) {
      // Fallback for browsers without IntersectionObserver
      callback();
      return;
    }

    this.elements.set(element, callback);
    this.observer.observe(element);
  }

  static unobserve(element: Element) {
    this.observer?.unobserve(element);
    this.elements.delete(element);
  }
}

// Initialize lazy loader on client side
if (typeof window !== 'undefined') {
  LazyLoader.init();
}

// Progressive image loading
export function createProgressiveImage(src: string, placeholder?: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    if (placeholder) {
      // Load placeholder first
      const placeholderImg = new Image();
      placeholderImg.src = placeholder;
    }
    
    img.src = src;
  });
}

// Lazy load images with intersection observer
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  placeholder?: string
) {
  if (placeholder) {
    imgElement.src = placeholder;
    imgElement.classList.add('lazy-image-placeholder');
  }

  LazyLoader.observe(imgElement, () => {
    createProgressiveImage(src, placeholder)
      .then((loadedImg) => {
        imgElement.src = loadedImg.src;
        imgElement.classList.remove('lazy-image-placeholder');
        imgElement.classList.add('lazy-image-loaded');
      })
      .catch(() => {
        // Fallback to direct src loading
        imgElement.src = src;
      });
  });
}

// Preload critical resources
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

// Prefetch non-critical resources
export function prefetchResource(url: string, as: 'script' | 'style' | 'image' | 'font') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;
  
  document.head.appendChild(link);
}

// Dynamic import with retry mechanism
export async function dynamicImportWithRetry<T>(
  importFunc: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await importFunc();
  } catch (error) {
    if (retries <= 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return dynamicImportWithRetry(importFunc, retries - 1, delay * 2);
  }
}

// Chunk loading strategy
export class ChunkLoader {
  private static loadedChunks = new Set<string>();
  private static loadingPromises = new Map<string, Promise<void>>();

  static async loadChunk(chunkName: string, importFunc: () => Promise<any>) {
    if (this.loadedChunks.has(chunkName)) {
      return;
    }

    if (this.loadingPromises.has(chunkName)) {
      return this.loadingPromises.get(chunkName);
    }

    const loadingPromise = this.doLoadChunk(chunkName, importFunc);
    this.loadingPromises.set(chunkName, loadingPromise);
    
    try {
      await loadingPromise;
      this.loadedChunks.add(chunkName);
    } finally {
      this.loadingPromises.delete(chunkName);
    }
  }

  private static async doLoadChunk(chunkName: string, importFunc: () => Promise<any>) {
    try {
      await dynamicImportWithRetry(importFunc);
    } catch (error) {
      console.error(`Failed to load chunk: ${chunkName}`, error);
      throw error;
    }
  }

  static preloadChunk(chunkName: string, importFunc: () => Promise<any>) {
    // Preload chunks during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.loadChunk(chunkName, importFunc);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.loadChunk(chunkName, importFunc);
      }, 2000);
    }
  }
}

// Performance monitoring for lazy loading
export class LazyLoadingMetrics {
  private static metrics = {
    componentsLoaded: 0,
    imagesLoaded: 0,
    chunksLoaded: 0,
    totalLoadTime: 0,
  };

  static recordComponentLoad(loadTime: number) {
    this.metrics.componentsLoaded++;
    this.metrics.totalLoadTime += loadTime;
  }

  static recordImageLoad(loadTime: number) {
    this.metrics.imagesLoaded++;
    this.metrics.totalLoadTime += loadTime;
  }

  static recordChunkLoad(loadTime: number) {
    this.metrics.chunksLoaded++;
    this.metrics.totalLoadTime += loadTime;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static reset() {
    this.metrics = {
      componentsLoaded: 0,
      imagesLoaded: 0,
      chunksLoaded: 0,
      totalLoadTime: 0,
    };
  }
}