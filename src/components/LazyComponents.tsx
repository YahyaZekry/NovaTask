import { lazy, Suspense, ReactNode } from 'react';

// Simple lazy loading wrapper with fallback
function createLazyWrapper(importFunc: () => Promise<{ default: React.ComponentType<unknown> }>, fallback?: ReactNode) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: Record<string, unknown>) {
    return (
      <Suspense fallback={fallback || <div className="animate-pulse bg-white/10 rounded h-20 loading-enhanced"></div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy load non-critical components with proper default exports
export const LazyKeyboardShortcutsHelp = lazy(() => 
  import('@/components/KeyboardShortcutsHelp').then(module => ({ 
    default: module.KeyboardShortcutsHelp 
  }))
);

export const LazyAccessibilityTester = lazy(() => 
  import('@/components/AccessibilityTester').then(module => ({ 
    default: module.AccessibilityTester 
  }))
);

export const LazyConnectionStatusIndicator = lazy(() => 
  import('@/components/ConnectionStatusIndicator').then(module => ({ 
    default: module.ConnectionStatusIndicator 
  }))
);

export const LazyNovaLogo = lazy(() => 
  import('@/components/NovaLogo').then(module => ({ 
    default: module.NovaLogo 
  }))
);

export const LazyMobileNavigation = lazy(() => 
  import('@/components/MobileNavigation').then(module => ({ 
    default: module.MobileNavigation 
  }))
);

export const LazySlidePanel = lazy(() => 
  import('@/components/SlidePanel').then(module => ({ 
    default: module.SlidePanel 
  }))
);

export const LazyToastProvider = lazy(() => 
  import('@/components/ToastNotification').then(module => ({ 
    default: module.ToastProvider 
  }))
);

export const LazyErrorBoundary = lazy(() => 
  import('@/components/ErrorBoundary').then(module => ({ 
    default: module.ErrorBoundary 
  }))
);

export const LazySkeletonLoader = lazy(() => 
  import('@/components/SkeletonLoader').then(module => ({ 
    default: module.SkeletonLoader 
  }))
);

// Fallback components for lazy loading
export const KeyboardShortcutsHelpFallback = () => (
  <div className="glass-desktop rounded-2xl p-6 animate-pulse loading-enhanced card-hover-enhanced micro-interaction">
    <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-white/10 rounded w-full"></div>
      <div className="h-3 bg-white/10 rounded w-3/4"></div>
      <div className="h-3 bg-white/10 rounded w-1/2"></div>
    </div>
  </div>
);

export const AccessibilityTesterFallback = () => (
  <div className="glass-desktop rounded-2xl p-6 animate-pulse loading-enhanced card-hover-enhanced micro-interaction">
    <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      <div className="h-3 bg-white/10 rounded w-full"></div>
      <div className="h-3 bg-white/10 rounded w-5/6"></div>
      <div className="h-3 bg-white/10 rounded w-2/3"></div>
    </div>
  </div>
);

export const ConnectionStatusIndicatorFallback = () => (
  <div className="fixed top-4 right-4 w-12 h-12 bg-white/10 rounded-full animate-pulse loading-enhanced button-hover-enhanced micro-interaction"></div>
);

export const NovaLogoFallback = () => (
  <div className="h-8 w-32 bg-white/20 rounded animate-pulse loading-enhanced hover-enhanced micro-interaction"></div>
);

export const MobileNavigationFallback = () => (
  <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/10 animate-pulse loading-enhanced mobile-enhanced micro-interaction"></div>
);

export const SlidePanelFallback = () => (
  <div className="fixed inset-0 bg-black/50 animate-pulse loading-enhanced backdrop-overlay"></div>
);

export const ToastProviderFallback = () => (
  <div className="fixed top-4 right-4 w-64 h-16 bg-white/20 rounded-lg animate-pulse loading-enhanced card-hover-enhanced micro-interaction"></div>
);

export const ErrorBoundaryFallback = () => (
  <div className="glass-desktop rounded-2xl p-6 animate-pulse loading-enhanced card-hover-enhanced micro-interaction">
    <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
    <div className="h-3 bg-white/10 rounded w-full"></div>
  </div>
);

export const SkeletonLoaderFallback = () => (
  <div className="space-y-3 animate-pulse loading-enhanced">
    <div className="h-4 bg-white/20 rounded w-full"></div>
    <div className="h-4 bg-white/20 rounded w-3/4"></div>
    <div className="h-4 bg-white/20 rounded w-1/2"></div>
  </div>
);

// Wrapper for components that need Suspense
export function withSuspense(
  Component: React.ComponentType<Record<string, unknown>>,
  fallback?: ReactNode
) {
  return function SuspenseWrapper(props: Record<string, unknown>) {
    return (
      <Suspense fallback={fallback || <div className="animate-pulse bg-white/10 rounded h-20 loading-enhanced"></div>}>
        <Component {...props} />
      </Suspense>
    );
  };
}