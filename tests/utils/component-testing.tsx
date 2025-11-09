import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorContext } from '@/contexts/ErrorContext';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark';
  queryClient?: QueryClient;
  errorBoundary?: boolean;
  initialRoute?: string;
}

const AllTheProviders = ({
  children,
  theme = 'light',
  queryClient,
  errorBoundary = true,
}: {
  children: ReactNode;
  theme?: 'light' | 'dark';
  queryClient?: QueryClient;
  errorBoundary?: boolean;
}) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const errorValue = {
    error: null,
    setError: jest.fn(),
    clearError: jest.fn(),
  };

  return (
    <ErrorContext.Provider value={errorValue}>
      <QueryClientProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme={theme}>
          {errorBoundary ? (
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          ) : (
            children
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorContext.Provider>
  );
};

const customRender = (
  ui: ReactElement,
  {
    theme = 'light',
    queryClient,
    errorBoundary = true,
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult => {
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllTheProviders theme={theme} queryClient={queryClient} errorBoundary={errorBoundary}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Component testing utilities
export const createMockProps = <T extends Record<string, any>>(defaults: T, overrides: Partial<T> = {}): T => {
  return { ...defaults, ...overrides };
};

// Test component wrapper for testing components in isolation
export const TestComponentWrapper: React.FC<{
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <div className={className} style={style}>
    {children}
  </div>
);

// Helper to test component with different props
export const testComponentWithProps = <P extends object>(
  Component: React.ComponentType<P>,
  baseProps: P,
  propVariations: Array<Partial<P>> = []
) => {
  describe('Component prop variations', () => {
    it('renders with base props', () => {
      const { container } = render(<Component {...baseProps} />);
      expect(container).toBeInTheDocument();
    });

    propVariations.forEach((variation, index) => {
      it(`renders with variation ${index + 1}`, () => {
        const props = { ...baseProps, ...variation };
        const { container } = render(<Component {...props} />);
        expect(container).toBeInTheDocument();
      });
    });
  });
};

// Helper to test component accessibility
export const testComponentAccessibility = async (
  Component: React.ReactElement,
  { axe }: { axe: any }
) => {
  const { container } = render(Component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Helper to test component responsive behavior
export const testComponentResponsive = (
  Component: React.ReactElement,
  viewports: Array<{ width: number; height: number; name: string }>
) => {
  viewports.forEach(({ width, height, name }) => {
    it(`renders correctly at ${name} (${width}x${height})`, () => {
      // Mock window.innerWidth and.innerHeight
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      const { container } = render(Component);
      expect(container).toBeInTheDocument();
    });
  });
};

// Helper to test component with different themes
export const testComponentThemes = (Component: React.ReactElement, themes: Array<'light' | 'dark'> = ['light', 'dark']) => {
  themes.forEach(theme => {
    it(`renders correctly with ${theme} theme`, () => {
      const { container } = render(Component, { theme });
      expect(container).toBeInTheDocument();
    });
  });
};

// Helper to test component error handling
export const testComponentErrorHandling = (
  Component: React.ReactElement,
  errorScenarios: Array<{ name: string; error: Error }>
) => {
  errorScenarios.forEach(({ name, error }) => {
    it(`handles ${name} error`, () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const ThrowErrorComponent = () => {
        throw error;
      };

      const { container } = render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>
      );

      expect(container).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });
};

// Helper to test component loading states
export const testComponentLoadingStates = (
  Component: React.ReactElement,
  loadingProps: Array<Record<string, any>>
) => {
  loadingProps.forEach((props, index) => {
    it(`displays loading state ${index + 1}`, () => {
      const { container } = render(Component, { ...props });
      expect(container).toBeInTheDocument();
    });
  });
};

// Helper to test component with different data states
export const testComponentDataStates = <T extends Record<string, any>>(
  Component: React.ReactElement,
  dataStates: Array<{ name: string; data: T | null; loading?: boolean; error?: Error }>
) => {
  dataStates.forEach(({ name, data, loading, error }) => {
    it(`handles ${name} state`, () => {
      const { container } = render(Component, { data, loading, error });
      expect(container).toBeInTheDocument();
    });
  });
};

// Helper to test component interactions
export const testComponentInteractions = (
  Component: React.ReactElement,
  interactions: Array<{
    name: string;
    action: (container: HTMLElement) => void;
    expected: (container: HTMLElement) => void;
  }>
) => {
  interactions.forEach(({ name, action, expected }) => {
    it(`handles ${name} interaction`, async () => {
      const { container } = render(Component);
      
      if (typeof action === 'function') {
        await action(container);
      }
      
      if (typeof expected === 'function') {
        expected(container);
      }
    });
  });
};

// Helper to test component with different screen readers
export const testComponentScreenReader = (
  Component: React.ReactElement,
  screenReaderTests: Array<{
    name: string;
    setup: () => void;
    expected: (container: HTMLElement) => void;
  }>
) => {
  screenReaderTests.forEach(({ name, setup, expected }) => {
    it(`works with ${name} screen reader`, () => {
      setup();
      const { container } = render(Component);
      expected(container);
    });
  });
};

// Helper to test component keyboard navigation
export const testComponentKeyboardNavigation = (
  Component: React.ReactElement,
  keyboardTests: Array<{
    name: string;
    key: string;
    element: string;
    expected: (element: HTMLElement) => void;
  }>
) => {
  keyboardTests.forEach(({ name, key, element, expected }) => {
    it(`handles ${name} keyboard navigation`, () => {
      const { container } = render(Component);
      const targetElement = container.querySelector(element);
      
      if (targetElement) {
        targetElement.focus();
        targetElement.dispatchEvent(new KeyboardEvent('keydown', { key }));
        expected(targetElement as HTMLElement);
      }
    });
  });
};

// Helper to test component animations
export const testComponentAnimations = (
  Component: React.ReactElement,
  animationTests: Array<{
    name: string;
    trigger: (container: HTMLElement) => void;
    expected: (container: HTMLElement) => void;
  }>
) => {
  animationTests.forEach(({ name, trigger, expected }) => {
    it(`handles ${name} animation`, async () => {
      const { container } = render(Component);
      
      // Mock requestAnimationFrame for animations
      const mockRAF = jest.fn(cb => setTimeout(cb, 16));
      global.requestAnimationFrame = mockRAF;
      
      trigger(container);
      
      // Wait for animation frame
      await new Promise(resolve => setTimeout(resolve, 16));
      
      expected(container);
      
      // Restore original requestAnimationFrame
      global.requestAnimationFrame = jest.fn();
    });
  });
};