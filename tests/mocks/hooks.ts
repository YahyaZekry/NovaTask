import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hook implementations
export const mockUseLocalStorage = <T>(initialValue: T) => {
  let storedValue = initialValue;
  
  return {
    value: storedValue,
    setValue: jest.fn((newValue: T | ((prev: T) => T)) => {
      storedValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(storedValue) : newValue;
      return storedValue;
    }),
    removeValue: jest.fn(() => {
      storedValue = initialValue;
    }),
  };
};

export const mockUseOnlineStatus = (isOnline = true) => ({
  isOnline,
  isOffline: !isOnline,
  onlineStatus: isOnline ? 'online' : 'offline',
});

export const mockUseKeyboardShortcuts = () => ({
  shortcuts: {
    'Ctrl+N': 'newTodo',
    'Ctrl+S': 'saveTodo',
    'Ctrl+D': 'deleteTodo',
    'Escape': 'cancel',
  },
  addShortcut: jest.fn(),
  removeShortcut: jest.fn(),
  clearShortcuts: jest.fn(),
});

export const mockUseAccessibility = () => ({
  announceToScreenReader: jest.fn(),
  focusElement: jest.fn(),
  trapFocus: jest.fn(),
  releaseFocus: jest.fn(),
  announceMessage: jest.fn(),
  setAriaLive: jest.fn(),
});

export const mockUseErrorHandling = () => ({
  error: null,
  setError: jest.fn(),
  clearError: jest.fn(),
  handleError: jest.fn(),
  hasError: false,
});

export const mockUsePerformanceOptimization = () => ({
  measurePerformance: jest.fn(),
  startMeasure: jest.fn(),
  endMeasure: jest.fn(),
  getMetrics: jest.fn(() => ({
    renderTime: 10,
    componentCount: 5,
    reRenderCount: 2,
  })),
  clearMetrics: jest.fn(),
});

export const mockUseSwipeGesture = () => ({
  onTouchStart: jest.fn(),
  onTouchMove: jest.fn(),
  onTouchEnd: jest.fn(),
  swipeDirection: null,
  isSwiping: false,
});

export const mockUsePullToRefresh = () => ({
  isRefreshing: false,
  pullDistance: 0,
  onPullStart: jest.fn(),
  onPullMove: jest.fn(),
  onPullEnd: jest.fn(),
  refresh: jest.fn(),
});

export const mockUseAccessibilityTesting = () => ({
  runAccessibilityTest: jest.fn(),
  testResults: null,
  isTesting: false,
  clearResults: jest.fn(),
});

// Custom render hook function with providers
interface CustomRenderHookOptions extends Omit<RenderHookOptions<any, any>, 'wrapper'> {
  queryClient?: QueryClient;
}

const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};

export const renderHookWithProviders = <T, P>(
  hook: (initialProps: P) => T,
  options: CustomRenderHookOptions = {}
): RenderHookResult<T, P> => {
  const { queryClient, ...renderOptions } = options;
  
  return renderHook(hook, {
    wrapper: createWrapper(queryClient),
    ...renderOptions,
  });
};

// Hook testing utilities
export const testHook = <T, P>(
  hook: (initialProps: P) => T,
  initialProps: P,
  options: CustomRenderHookOptions = {}
) => {
  return renderHookWithProviders(hook, {
    initialProps,
    ...options,
  });
};

// Hook state testing utilities
export const testHookState = <T, P>(
  hook: (initialProps: P) => T,
  scenarios: Array<{
    name: string;
    initialProps: P;
    actions: (result: RenderHookResult<T, P>) => void;
    expected: (result: RenderHookResult<T, P>) => void;
  }>
) => {
  scenarios.forEach(({ name, initialProps, actions, expected }) => {
    it(`handles ${name} scenario`, () => {
      const result = testHook(hook, initialProps);
      
      if (actions) {
        actions(result);
      }
      
      if (expected) {
        expected(result);
      }
    });
  });
};

// Hook effect testing utilities
export const testHookEffects = <T, P>(
  hook: (initialProps: P) => T,
  effectTests: Array<{
    name: string;
    initialProps: P;
    effectTrigger: () => void;
    expected: (result: RenderHookResult<T, P>) => void;
  }>
) => {
  effectTests.forEach(({ name, initialProps, effectTrigger, expected }) => {
    it(`triggers ${name} effect`, () => {
      const result = testHook(hook, initialProps);
      
      if (effectTrigger) {
        effectTrigger();
      }
      
      // Wait for effects to run
      setTimeout(() => {
        if (expected) {
          expected(result);
        }
      }, 0);
    });
  });
};

// Hook cleanup testing utilities
export const testHookCleanup = <T, P>(
  hook: (initialProps: P) => T,
  cleanupTests: Array<{
    name: string;
    initialProps: P;
    cleanupExpected: () => void;
  }>
) => {
  cleanupTests.forEach(({ name, initialProps, cleanupExpected }) => {
    it(`cleans up ${name} effect`, () => {
      const { unmount } = testHook(hook, initialProps);
      
      if (cleanupExpected) {
        cleanupExpected();
      }
      
      unmount();
    });
  });
};

// Hook performance testing utilities
export const testHookPerformance = <T, P>(
  hook: (initialProps: P) => T,
  performanceTests: Array<{
    name: string;
    initialProps: P;
    iterations: number;
    maxRenderTime: number;
  }>
) => {
  performanceTests.forEach(({ name, initialProps, iterations, maxRenderTime }) => {
    it(`performs well for ${name}`, () => {
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const { unmount } = testHook(hook, initialProps);
        unmount();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(maxRenderTime);
    });
  });
};

// Hook error handling testing utilities
export const testHookErrorHandling = <T, P>(
  hook: (initialProps: P) => T,
  errorTests: Array<{
    name: string;
    initialProps: P;
    errorTrigger: () => void;
    expectedError: Error;
  }>
) => {
  errorTests.forEach(({ name, initialProps, errorTrigger, expectedError }) => {
    it(`handles ${name} error`, () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        const result = testHook(hook, initialProps);
        
        if (errorTrigger) {
          errorTrigger();
        }
        
        // Check if error is handled properly
        expect(result.error).toEqual(expectedError);
      } catch (error) {
        expect(error).toEqual(expectedError);
      }
      
      consoleSpy.mockRestore();
    });
  });
};

// Hook async testing utilities
export const testHookAsync = <T, P>(
  hook: (initialProps: P) => T,
  asyncTests: Array<{
    name: string;
    initialProps: P;
    asyncAction: (result: RenderHookResult<T, P>) => Promise<void>;
    expected: (result: RenderHookResult<T, P>) => void;
  }>
) => {
  asyncTests.forEach(({ name, initialProps, asyncAction, expected }) => {
    it(`handles ${name} async operation`, async () => {
      const result = testHook(hook, initialProps);
      
      if (asyncAction) {
        await asyncAction(result);
      }
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (expected) {
        expected(result);
      }
    });
  });
};

// Hook dependency testing utilities
export const testHookDependencies = <T, P>(
  hook: (initialProps: P) => T,
  dependencyTests: Array<{
    name: string;
    initialProps: P;
    newProps: P;
    expectedBehavior: 'rerender' | 'no-rerender';
  }>
) => {
  dependencyTests.forEach(({ name, initialProps, newProps, expectedBehavior }) => {
    it(`${expectedBehavior === 'rerender' ? 'rerenders' : 'does not rerender'} when ${name} changes`, () => {
      const { rerender } = testHook(hook, initialProps);
      
      const renderSpy = jest.fn();
      const originalUseEffect = React.useEffect;
      
      React.useEffect = (...args) => {
        renderSpy();
        return originalUseEffect(...args);
      };
      
      rerender(newProps);
      
      if (expectedBehavior === 'rerender') {
        expect(renderSpy).toHaveBeenCalled();
      } else {
        expect(renderSpy).not.toHaveBeenCalled();
      }
      
      React.useEffect = originalUseEffect;
    });
  });
};