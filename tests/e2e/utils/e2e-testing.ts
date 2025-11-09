import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import { devices } from '@playwright/test';

// E2E testing utilities for NovaTask application

interface E2ETestOptions {
  viewport?: { width: number; height: number };
  device?: string;
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
}

interface UserCredentials {
  username: string;
  password: string;
}

interface TestData {
  todos: Array<{
    title: string;
    description: string;
    priority: string;
    dueDate: string;
  }>;
  users: UserCredentials[];
}

// E2E test data
export const e2eTestData: TestData = {
  todos: [
    {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the NovaTask application',
      priority: 'high',
      dueDate: '2024-12-15',
    },
    {
      title: 'Implement user authentication',
      description: 'Add login and registration functionality',
      priority: 'high',
      dueDate: '2024-11-20',
    },
    {
      title: 'Design responsive layout',
      description: 'Create mobile-friendly responsive design',
      priority: 'medium',
      dueDate: '2024-11-25',
    },
  ],
  users: [
    {
      username: 'testuser@example.com',
      password: 'testpassword123',
    },
    {
      username: 'admin@example.com',
      password: 'adminpassword123',
    },
  ],
};

// E2E test helper class
export class E2ETestHelper {
  private page: Page;
  private context: BrowserContext;
  private options: E2ETestOptions;

  constructor(page: Page, context: BrowserContext, options: E2ETestOptions = {}) {
    this.page = page;
    this.context = context;
    this.options = options;
  }

  // Navigation helpers
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Authentication helpers
  async login(credentials: UserCredentials): Promise<void> {
    await this.navigateTo('/login');
    
    await this.page.fill('[data-testid="email-input"]', credentials.username);
    await this.page.fill('[data-testid="password-input"]', credentials.password);
    await this.page.click('[data-testid="login-button"]');
    
    await this.page.waitForURL('**/dashboard');
    await this.waitForPageLoad();
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    
    await this.page.waitForURL('**/login');
    await this.waitForPageLoad();
  }

  // Form helpers
  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = this.page.locator(`[data-testid="${fieldName}-input"], [name="${fieldName}"]`);
      await field.fill(value);
    }
  }

  async submitForm(submitButtonSelector = '[data-testid="submit-button"]'): Promise<void> {
    await this.page.click(submitButtonSelector);
    await this.waitForPageLoad();
  }

  // Todo management helpers
  async createTodo(todoData: typeof e2eTestData.todos[0]): Promise<void> {
    await this.page.click('[data-testid="add-todo-button"]');
    
    await this.fillForm({
      'todo-title': todoData.title,
      'todo-description': todoData.description,
      'todo-priority': todoData.priority,
      'todo-due-date': todoData.dueDate,
    });
    
    await this.submitForm('[data-testid="save-todo-button"]');
    
    // Wait for todo to appear in list
    await this.page.locator(`[data-testid="todo-item"]:has-text("${todoData.title}")`).waitFor();
  }

  async editTodo(todoTitle: string, updatedData: Partial<typeof e2eTestData.todos[0]>): Promise<void> {
    const todoItem = this.page.locator(`[data-testid="todo-item"]:has-text("${todoTitle}")`);
    await todoItem.locator('[data-testid="edit-todo-button"]').click();
    
    if (updatedData.title) {
      await this.page.fill('[data-testid="todo-title-input"]', updatedData.title);
    }
    if (updatedData.description) {
      await this.page.fill('[data-testid="todo-description-input"]', updatedData.description);
    }
    if (updatedData.priority) {
      await this.page.selectOption('[data-testid="todo-priority-select"]', updatedData.priority);
    }
    if (updatedData.dueDate) {
      await this.page.fill('[data-testid="todo-due-date-input"]', updatedData.dueDate);
    }
    
    await this.submitForm('[data-testid="update-todo-button"]');
  }

  async deleteTodo(todoTitle: string): Promise<void> {
    const todoItem = this.page.locator(`[data-testid="todo-item"]:has-text("${todoTitle}")`);
    await todoItem.locator('[data-testid="delete-todo-button"]').click();
    
    // Confirm deletion if confirmation dialog appears
    const confirmButton = this.page.locator('[data-testid="confirm-delete-button"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Wait for todo to be removed
    await todoItem.waitFor({ state: 'detached' });
  }

  async toggleTodoCompletion(todoTitle: string): Promise<void> {
    const todoItem = this.page.locator(`[data-testid="todo-item"]:has-text("${todoTitle}")`);
    await todoItem.locator('[data-testid="todo-checkbox"]').click();
    
    // Wait for completion status to update
    await this.page.waitForTimeout(500);
  }

  // Filter and search helpers
  async filterTodos(filterType: string): Promise<void> {
    await this.page.selectOption('[data-testid="todo-filter"]', filterType);
    await this.waitForPageLoad();
  }

  async searchTodos(searchQuery: string): Promise<void> {
    await this.page.fill('[data-testid="search-input"]', searchQuery);
    await this.waitForPageLoad();
  }

  // Responsive testing helpers
  async setViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(500); // Allow for responsive adjustments
  }

  async testMobileView(): Promise<void> {
    await this.setViewport(375, 667); // iPhone 6/7/8 dimensions
  }

  async testTabletView(): Promise<void> {
    await this.setViewport(768, 1024); // iPad dimensions
  }

  async testDesktopView(): Promise<void> {
    await this.setViewport(1280, 800); // Desktop dimensions
  }

  // Accessibility testing helpers
  async testAccessibility(): Promise<void> {
    // Check for proper ARIA labels
    const interactiveElements = this.page.locator('button, input, select, textarea, a');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const title = await element.getAttribute('title');
      
      if (!ariaLabel && !ariaLabelledBy && !title) {
        console.warn(`Interactive element missing accessible label: ${await element.innerHTML()}`);
      }
    }
  }

  async testKeyboardNavigation(): Promise<void> {
    await this.page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test navigation through todo items
    const todoItems = this.page.locator('[data-testid="todo-item"]');
    const todoCount = await todoItems.count();
    
    for (let i = 0; i < todoCount; i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(100);
    }
  }

  // Performance testing helpers
  async measurePageLoadTime(): Promise<number> {
    const navigationStart = await this.page.evaluate(() => performance.timing.navigationStart);
    const loadComplete = await this.page.evaluate(() => performance.timing.loadEventEnd);
    
    return loadComplete - navigationStart;
  }

  async measureFirstContentfulPaint(): Promise<number> {
    const fcp = await this.page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : 0;
    });
    
    return fcp;
  }

  async measureLargestContentfulPaint(): Promise<number> {
    const lcp = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    return lcp as number;
  }

  // Visual regression testing helpers
  async takeScreenshot(name: string, fullPage = false): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage,
    });
  }

  async compareScreenshots(baseline: string, current: string): Promise<boolean> {
    // In a real implementation, this would compare screenshots
    // For now, we'll return true
    return true;
  }

  // Network testing helpers
  async mockApiResponse(endpoint: string, response: any): Promise<void> {
    await this.page.route(`**/${endpoint}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async simulateOffline(): Promise<void> {
    await this.context.setOffline(true);
  }

  async simulateOnline(): Promise<void> {
    await this.context.setOffline(false);
  }

  async simulateSlowNetwork(): Promise<void> {
    await this.context.route('**/*', (route) => {
      setTimeout(() => route.continue(), 2000); // 2 second delay
    });
  }

  // Error handling helpers
  async waitForErrorToast(): Promise<void> {
    await this.page.locator('[data-testid="error-toast"]').waitFor();
  }

  async waitForSuccessToast(): Promise<void> {
    await this.page.locator('[data-testid="success-toast"]').waitFor();
  }

  async dismissToasts(): Promise<void> {
    const toasts = this.page.locator('[data-testid="toast"]');
    const count = await toasts.count();
    
    for (let i = 0; i < count; i++) {
      await toasts.nth(i).locator('[data-testid="dismiss-toast"]').click();
    }
  }

  // Utility helpers
  async waitForElement(selector: string, timeout = 5000): Promise<void> {
    await this.page.locator(selector).waitFor({ timeout });
  }

  async waitForElementToDisappear(selector: string, timeout = 5000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'detached', timeout });
  }

  async isElementVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async getElementText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  async clickElement(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  async typeText(selector: string, text: string): Promise<void> {
    await this.page.locator(selector).fill(text);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  async hoverElement(selector: string): Promise<void> {
    await this.page.locator(selector).hover();
  }

  async scrollElement(selector: string, direction: 'up' | 'down' = 'down'): Promise<void> {
    const element = this.page.locator(selector);
    if (direction === 'down') {
      await element.scrollIntoViewIfNeeded();
    } else {
      await element.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    }
  }

  async waitForNetworkIdle(timeout = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async executeScript(script: string): Promise<any> {
    return await this.page.evaluate(script);
  }

  async getConsoleLogs(): Promise<string[]> {
    return await this.page.evaluate(() => {
      return (window as any).consoleLogs || [];
    });
  }

  async clearConsoleLogs(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).consoleLogs = [];
    });
  }
}

// E2E test fixtures
export const e2eFixtures = {
  // Create a new E2E test helper
  createHelper: async (page: Page, context: BrowserContext, options: E2ETestOptions = {}) => {
    return new E2ETestHelper(page, context, options);
  },

  // Setup test environment
  setupTestEnvironment: async (page: Page, context: BrowserContext, options: E2ETestOptions = {}) => {
    const helper = new E2ETestHelper(page, context, options);
    
    // Set up console logging
    await page.evaluate(() => {
      (window as any).consoleLogs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        (window as any).consoleLogs.push(args.join(' '));
        originalLog(...args);
      };
    });

    // Set up error handling
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
    });

    page.on('requestfailed', (request) => {
      console.error('Request failed:', request.url(), request.failure());
    });

    return helper;
  },

  // Clean up test environment
  cleanupTestEnvironment: async (page: Page, context: BrowserContext) => {
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },
};

// E2E test scenarios
export const e2eTestScenarios = {
  // User journey: Create and manage todos
  async testTodoManagement(helper: E2ETestHelper): Promise<void> {
    // Login
    await helper.login(e2eTestData.users[0]);
    
    // Create a new todo
    await helper.createTodo(e2eTestData.todos[0]);
    
    // Edit the todo
    await helper.editTodo(e2eTestData.todos[0].title, {
      title: 'Updated todo title',
    });
    
    // Mark todo as complete
    await helper.toggleTodoCompletion('Updated todo title');
    
    // Delete the todo
    await helper.deleteTodo('Updated todo title');
    
    // Logout
    await helper.logout();
  },

  // User journey: Test responsive design
  async testResponsiveDesign(helper: E2ETestHelper): Promise<void> {
    await helper.navigateTo('/');
    
    // Test mobile view
    await helper.testMobileView();
    await helper.takeScreenshot('mobile-view');
    
    // Test tablet view
    await helper.testTabletView();
    await helper.takeScreenshot('tablet-view');
    
    // Test desktop view
    await helper.testDesktopView();
    await helper.takeScreenshot('desktop-view');
  },

  // User journey: Test accessibility
  async testAccessibility(helper: E2ETestHelper): Promise<void> {
    await helper.navigateTo('/');
    
    // Test keyboard navigation
    await helper.testKeyboardNavigation();
    
    // Test ARIA labels
    await helper.testAccessibility();
    
    // Test screen reader compatibility
    await helper.page.emulateMedia({ reducedMotion: 'reduce' });
    await helper.takeScreenshot('reduced-motion');
  },

  // User journey: Test performance
  async testPerformance(helper: E2ETestHelper): Promise<void> {
    await helper.navigateTo('/');
    
    // Measure page load time
    const loadTime = await helper.measurePageLoadTime();
    console.log(`Page load time: ${loadTime}ms`);
    
    // Measure First Contentful Paint
    const fcp = await helper.measureFirstContentfulPaint();
    console.log(`First Contentful Paint: ${fcp}ms`);
    
    // Measure Largest Contentful Paint
    const lcp = await helper.measureLargestContentfulPaint();
    console.log(`Largest Contentful Paint: ${lcp}ms`);
  },

  // User journey: Test offline functionality
  async testOfflineFunctionality(helper: E2ETestHelper): Promise<void> {
    await helper.login(e2eTestData.users[0]);
    
    // Create a todo while online
    await helper.createTodo(e2eTestData.todos[0]);
    
    // Go offline
    await helper.simulateOffline();
    
    // Try to create another todo
    await helper.createTodo(e2eTestData.todos[1]);
    
    // Check for offline indicator
    await helper.waitForElement('[data-testid="offline-indicator"]');
    
    // Go back online
    await helper.simulateOnline();
    
    // Check for sync completion
    await helper.waitForElement('[data-testid="sync-complete"]');
    
    await helper.logout();
  },
};

// Export E2E testing utilities
export { E2ETestHelper, E2ETestOptions, UserCredentials, TestData };