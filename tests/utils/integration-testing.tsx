import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorContext } from '@/contexts/ErrorContext';

// Integration test wrapper with all providers
interface IntegrationTestOptions extends RenderOptions {
  theme?: 'light' | 'dark';
  queryClient?: QueryClient;
  errorBoundary?: boolean;
  initialRoute?: string;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
}

const IntegrationTestWrapper: React.FC<{
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  queryClient?: QueryClient;
  errorBoundary?: boolean;
}> = ({ children, theme = 'light', queryClient, errorBoundary = true }) => {
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

// Custom render function for integration tests
export const renderIntegration = (
  ui: ReactElement,
  options: IntegrationTestOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const {
    theme = 'light',
    queryClient,
    errorBoundary = true,
    userEventOptions,
    ...renderOptions
  } = options;

  const user = userEvent.setup(userEventOptions);

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <IntegrationTestWrapper theme={theme} queryClient={queryClient} errorBoundary={errorBoundary}>
      {children}
    </IntegrationTestWrapper>
  );

  return {
    ...render(ui, { wrapper, ...renderOptions }),
    user,
  };
};

// Integration test helpers for common scenarios
export const integrationTestHelpers = {
  // Helper for testing form submissions
  async testFormSubmission(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    formSelector: string,
    formData: Record<string, string | boolean>,
    submitButtonSelector: string
  ) {
    const { container, user } = renderResult;
    const form = container.querySelector(formSelector) as HTMLFormElement;
    
    // Fill form fields
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      if (field) {
        if (field.type === 'checkbox') {
          if (value) await user.click(field);
        } else {
          await user.clear(field);
          await user.type(field, value.toString());
        }
      }
    }

    // Submit form
    const submitButton = container.querySelector(submitButtonSelector) as HTMLButtonElement;
    await user.click(submitButton);

    return { form, submitButton };
  },

  // Helper for testing API interactions
  async testApiInteraction(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    triggerSelector: string,
    expectedApiCall: string,
    mockApiCall: jest.Mock
  ) {
    const { container, user } = renderResult;
    const trigger = container.querySelector(triggerSelector);
    
    await user.click(trigger!);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(expectedApiCall);
    });
  },

  // Helper for testing navigation
  async testNavigation(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    linkSelector: string,
    expectedRoute: string
  ) {
    const { container, user } = renderResult;
    const link = container.querySelector(linkSelector) as HTMLAnchorElement;
    
    await user.click(link);
    
    await waitFor(() => {
      expect(window.location.pathname).toBe(expectedRoute);
    });
  },

  // Helper for testing modal interactions
  async testModalInteraction(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    triggerSelector: string,
    modalSelector: string,
    closeSelector: string
  ) {
    const { container, user } = renderResult;
    
    // Open modal
    const trigger = container.querySelector(triggerSelector);
    await user.click(trigger!);
    
    // Check modal is visible
    await waitFor(() => {
      expect(container.querySelector(modalSelector)).toBeInTheDocument();
    });
    
    // Close modal
    const closeButton = container.querySelector(closeSelector);
    await user.click(closeButton!);
    
    // Check modal is hidden
    await waitFor(() => {
      expect(container.querySelector(modalSelector)).not.toBeInTheDocument();
    });
  },

  // Helper for testing dropdown interactions
  async testDropdownInteraction(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    triggerSelector: string,
    dropdownSelector: string,
    optionSelector: string
  ) {
    const { container, user } = renderResult;
    
    // Open dropdown
    const trigger = container.querySelector(triggerSelector);
    await user.click(trigger!);
    
    // Check dropdown is visible
    await waitFor(() => {
      expect(container.querySelector(dropdownSelector)).toBeInTheDocument();
    });
    
    // Select option
    const option = container.querySelector(optionSelector);
    await user.click(option!);
    
    // Check dropdown is closed
    await waitFor(() => {
      expect(container.querySelector(dropdownSelector)).not.toBeInTheDocument();
    });
  },

  // Helper for testing search functionality
  async testSearchFunctionality(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    searchInputSelector: string,
    searchQuery: string,
    expectedResultsSelector: string
  ) {
    const { container, user } = renderResult;
    const searchInput = container.querySelector(searchInputSelector) as HTMLInputElement;
    
    await user.clear(searchInput);
    await user.type(searchInput, searchQuery);
    
    await waitFor(() => {
      expect(container.querySelector(expectedResultsSelector)).toBeInTheDocument();
    });
  },

  // Helper for testing filter functionality
  async testFilterFunctionality(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    filterSelector: string,
    filterValue: string,
    expectedResultsSelector: string
  ) {
    const { container, user } = renderResult;
    const filter = container.querySelector(filterSelector) as HTMLSelectElement;
    
    await user.selectOptions(filter, filterValue);
    
    await waitFor(() => {
      expect(container.querySelector(expectedResultsSelector)).toBeInTheDocument();
    });
  },

  // Helper for testing pagination
  async testPagination(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    nextPageSelector: string,
    prevPageSelector: string,
    currentPageSelector: string,
    expectedPageNumbers: number[]
  ) {
    const { container, user } = renderResult;
    
    // Test next page navigation
    for (const expectedPage of expectedPageNumbers) {
      const nextPageButton = container.querySelector(nextPageSelector) as HTMLButtonElement;
      if (nextPageButton && !nextPageButton.disabled) {
        await user.click(nextPageButton);
        
        await waitFor(() => {
          const currentPageElement = container.querySelector(currentPageSelector);
          expect(currentPageElement).toHaveTextContent(expectedPage.toString());
        });
      }
    }
    
    // Test previous page navigation
    for (const expectedPage of expectedPageNumbers.reverse()) {
      const prevPageButton = container.querySelector(prevPageSelector) as HTMLButtonElement;
      if (prevPageButton && !prevPageButton.disabled) {
        await user.click(prevPageButton);
        
        await waitFor(() => {
          const currentPageElement = container.querySelector(currentPageSelector);
          expect(currentPageElement).toHaveTextContent(expectedPage.toString());
        });
      }
    }
  },

  // Helper for testing drag and drop
  async testDragAndDrop(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    draggableSelector: string,
    droppableSelector: string
  ) {
    const { container } = renderResult;
    const draggable = container.querySelector(draggableSelector) as HTMLElement;
    const droppable = container.querySelector(droppableSelector) as HTMLElement;
    
    // Start drag
    fireEvent.dragStart(draggable);
    
    // Drag over droppable
    fireEvent.dragOver(droppable);
    
    // Drop
    fireEvent.drop(droppable);
    fireEvent.dragEnd(draggable);
    
    await waitFor(() => {
      expect(droppable).toContainElement(draggable);
    });
  },

  // Helper for testing keyboard navigation
  async testKeyboardNavigation(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    startSelector: string,
    keySequence: Array<{ key: string; expectedFocus: string }>
  ) {
    const { container, user } = renderResult;
    const startElement = container.querySelector(startSelector) as HTMLElement;
    
    startElement.focus();
    
    for (const { key, expectedFocus } of keySequence) {
      await user.keyboard(key);
      
      await waitFor(() => {
        const focusedElement = container.querySelector(expectedFocus) as HTMLElement;
        expect(focusedElement).toHaveFocus();
      });
    }
  },

  // Helper for testing responsive behavior
  async testResponsiveBehavior(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    viewports: Array<{ width: number; height: number; expectedBehavior: string }>
  ) {
    const { container } = renderResult;
    
    for (const { width, height, expectedBehavior } of viewports) {
      // Mock viewport size
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
      
      await waitFor(() => {
        expect(container).toHaveClass(expectedBehavior);
      });
    }
  },

  // Helper for testing error handling
  async testErrorHandling(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    errorTrigger: () => void,
    errorBoundarySelector: string,
    expectedErrorMessage: string
  ) {
    const { container } = renderResult;
    
    // Trigger error
    errorTrigger();
    
    await waitFor(() => {
      const errorBoundary = container.querySelector(errorBoundarySelector);
      expect(errorBoundary).toBeInTheDocument();
      expect(errorBoundary).toHaveTextContent(expectedErrorMessage);
    });
  },

  // Helper for testing loading states
  async testLoadingStates(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    loadingTrigger: () => void,
    loadingSelector: string,
    contentSelector: string
  ) {
    const { container } = renderResult;
    
    // Trigger loading
    loadingTrigger();
    
    // Check loading state
    await waitFor(() => {
      expect(container.querySelector(loadingSelector)).toBeInTheDocument();
      expect(container.querySelector(contentSelector)).not.toBeInTheDocument();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(container.querySelector(loadingSelector)).not.toBeInTheDocument();
      expect(container.querySelector(contentSelector)).toBeInTheDocument();
    }, { timeout: 5000 });
  },

  // Helper for testing accessibility
  async testAccessibility(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    axe: any,
    expectedViolations: number = 0
  ) {
    const { container } = renderResult;
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
    if (expectedViolations > 0) {
      expect(results.violations).toHaveLength(expectedViolations);
    }
  },

  // Helper for testing animations
  async testAnimations(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    animationTrigger: () => void,
    animatedElementSelector: string,
    expectedAnimationClass: string
  ) {
    const { container } = renderResult;
    
    // Mock requestAnimationFrame
    const mockRAF = jest.fn(cb => setTimeout(cb, 16));
    global.requestAnimationFrame = mockRAF;
    
    // Trigger animation
    animationTrigger();
    
    // Check animation class is applied
    await waitFor(() => {
      const animatedElement = container.querySelector(animatedElementSelector);
      expect(animatedElement).toHaveClass(expectedAnimationClass);
    });
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restore original requestAnimationFrame
    global.requestAnimationFrame = jest.fn();
  },

  // Helper for testing performance
  async testPerformance(
    renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> },
    performanceAction: () => void,
    maxRenderTime: number
  ) {
    const startTime = performance.now();
    
    performanceAction();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(maxRenderTime);
  },
};

// Integration test scenario builder
export class IntegrationTestScenario {
  private name: string;
  private description: string;
  private setup: () => void;
  private teardown: () => void;
  private steps: Array<{
    name: string;
    action: (renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> }) => Promise<void>;
    assertion: (renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> }) => Promise<void>;
  }> = [];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.setup = () => {};
    this.teardown = () => {};
  }

  withSetup(setup: () => void): this {
    this.setup = setup;
    return this;
  }

  withTeardown(teardown: () => void): this {
    this.teardown = teardown;
    return this;
  }

  addStep(
    name: string,
    action: (renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> }) => Promise<void>,
    assertion: (renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> }) => Promise<void>
  ): this {
    this.steps.push({ name, action, assertion });
    return this;
  }

  async run(component: ReactElement, options: IntegrationTestOptions = {}) {
    describe(this.name, () => {
      it(this.description, async () => {
        // Setup
        this.setup();
        
        try {
          // Render component
          const renderResult = renderIntegration(component, options);
          
          // Execute steps
          for (const step of this.steps) {
            await step.action(renderResult);
            await step.assertion(renderResult);
          }
        } finally {
          // Teardown
          this.teardown();
        }
      });
    });
  }
}

// Helper function to create integration test scenarios
export const createIntegrationTest = (name: string, description: string) => {
  return new IntegrationTestScenario(name, description);
};

// Re-export testing utilities
export { fireEvent, waitFor, screen, userEvent };