# NovaTask Testing Troubleshooting Guide

This guide helps developers diagnose and resolve common testing issues in the NovaTask application.

## Table of Contents

1. [General Issues](#general-issues)
2. [Unit Testing Issues](#unit-testing-issues)
3. [Integration Testing Issues](#integration-testing-issues)
4. [E2E Testing Issues](#e2e-testing-issues)
5. [Performance Testing Issues](#performance-testing-issues)
6. [Accessibility Testing Issues](#accessibility-testing-issues)
7. [Mocking Issues](#mocking-issues)
8. [CI/CD Issues](#cicd-issues)
9. [Debugging Techniques](#debugging-techniques)
10. [Best Practices](#best-practices)

## General Issues

### Tests Not Running

**Problem**: Tests don't start or exit immediately

**Possible Causes**:
- Missing dependencies
- Incorrect test configuration
- Syntax errors in test files

**Solutions**:
1. Check if all dependencies are installed:
   ```bash
   npm install
   ```

2. Verify test configuration:
   ```bash
   npm run test -- --verbose
   ```

3. Check for syntax errors:
   ```bash
   npm run lint
   ```

### Slow Test Execution

**Problem**: Tests take too long to run

**Possible Causes**:
- Inefficient test setup
- Too many tests running sequentially
- Expensive operations in tests

**Solutions**:
1. Run tests in parallel:
   ```bash
   npm run test -- --runInBand=false
   ```

2. Optimize test setup:
   ```javascript
   // Move expensive setup to beforeAll instead of beforeEach
   beforeAll(async () => {
     await setupExpensiveResources();
   });
   ```

3. Use mocking for expensive operations:
   ```javascript
   jest.mock('./expensive-module', () => ({
     expensiveFunction: jest.fn(() => 'mocked-result'),
   }));
   ```

### Memory Leaks in Tests

**Problem**: Tests fail due to memory issues

**Possible Causes**:
- Uncleaned up timers
- Event listeners not removed
- References not cleared

**Solutions**:
1. Clean up timers:
   ```javascript
   afterEach(() => {
     jest.clearAllTimers();
     jest.useRealTimers();
   });
   ```

2. Remove event listeners:
   ```javascript
   afterEach(() => {
     document.removeEventListener('click', handler);
   });
   ```

3. Clear references:
   ```javascript
   afterEach(() => {
     component = null;
   });
   ```

## Unit Testing Issues

### Component Not Rendering

**Problem**: Component fails to render in tests

**Possible Causes**:
- Missing providers
- Required props not provided
- External dependencies not mocked

**Solutions**:
1. Use custom render with providers:
   ```javascript
   import { renderIntegration } from '../utils/integration-testing';
   
   const { container } = renderIntegration(<MyComponent />, {
     theme: 'light',
     queryClient: new QueryClient(),
   });
   ```

2. Provide required props:
   ```javascript
   const requiredProps = {
     id: 'test-id',
     title: 'Test Title',
   };
   
   render(<MyComponent {...requiredProps} />);
   ```

3. Mock external dependencies:
   ```javascript
   jest.mock('./external-module', () => ({
     ExternalComponent: ({ children }) => <div>{children}</div>,
   }));
   ```

### State Not Updating

**Problem**: Component state doesn't update as expected

**Possible Causes**:
- Asynchronous state updates
- Incorrect event handling
- State mutation instead of update

**Solutions**:
1. Wait for state updates:
   ```javascript
   import { waitFor } from '@testing-library/react';
   
   await waitFor(() => {
     expect(screen.getByText('Updated State')).toBeInTheDocument();
   });
   ```

2. Use userEvent for interactions:
   ```javascript
   import userEvent from '@testing-library/user-event';
   
   await userEvent.click(screen.getByRole('button'));
   ```

3. Use immutable state updates:
   ```javascript
   // Instead of: state.value = newValue;
   setState(prevState => ({ ...prevState, value: newValue }));
   ```

### Hook Testing Issues

**Problem**: Hook tests fail or don't work correctly

**Possible Causes**:
- Incorrect renderHook usage
- Missing providers
- Async operations not handled

**Solutions**:
1. Use renderHook correctly:
   ```javascript
   import { renderHook, waitFor } from '@testing-library/react';
   
   const { result, rerender } = renderHook(() => useMyHook(), {
     wrapper: ({ children }) => (
       <QueryClientProvider client={new QueryClient()}>
         {children}
       </QueryClientProvider>
     ),
   });
   ```

2. Wait for async operations:
   ```javascript
   await waitFor(() => {
     expect(result.current.isLoading).toBe(false);
   });
   ```

3. Test hook updates:
   ```javascript
   rerender({ newValue: 'updated' });
   expect(result.current.value).toBe('updated');
   ```

## Integration Testing Issues

### API Calls Not Working

**Problem**: API calls fail in integration tests

**Possible Causes**:
- MSW server not set up
- Incorrect mock handlers
- Network issues

**Solutions**:
1. Set up MSW server:
   ```javascript
   import { server } from '../mocks/server';
   
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

2. Verify mock handlers:
   ```javascript
   import { rest } from 'msw';
   
   server.use(
     rest.get('/api/todos', (req, res, ctx) => {
       return res(ctx.json(mockTodos));
     })
   );
   ```

3. Check network status:
   ```javascript
   await waitFor(() => {
     expect(screen.getByText('Data loaded')).toBeInTheDocument();
   });
   ```

### Component Interaction Issues

**Problem**: Components don't interact correctly

**Possible Causes**:
- Event propagation issues
- Timing issues
- Incorrect selectors

**Solutions**:
1. Use proper event simulation:
   ```javascript
   import userEvent from '@testing-library/user-event';
   
   await userEvent.click(screen.getByRole('button'));
   await userEvent.type(screen.getByLabelText('Name'), 'Test Name');
   ```

2. Add proper waits:
   ```javascript
   await waitFor(() => {
     expect(screen.getByText('Interaction Result')).toBeInTheDocument();
   });
   ```

3. Use accessible selectors:
   ```javascript
   // Good
   screen.getByRole('button', { name: 'Submit' });
   
   // Avoid
   screen.getByClassName('submit-button');
   ```

## E2E Testing Issues

### Element Not Found

**Problem**: Playwright can't find elements

**Possible Causes**:
- Element not loaded yet
- Incorrect selector
- Element in iframe

**Solutions**:
1. Wait for element:
   ```javascript
   await page.waitForSelector('[data-testid="my-element"]');
   ```

2. Use better selectors:
   ```javascript
   // Good
   page.locator('button:has-text("Submit")');
   
   // Better
   page.getByRole('button', { name: 'Submit' });
   ```

3. Handle iframes:
   ```javascript
   const frame = page.frameLocator('iframe');
   await frame.getByRole('button').click();
   ```

### Flaky Tests

**Problem**: Tests pass/fail inconsistently

**Possible Causes**:
- Race conditions
- Network delays
- Timing issues

**Solutions**:
1. Add proper waits:
   ```javascript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="ready"]');
   ```

2. Use retry logic:
   ```javascript
   test.configure({ retries: 3 });
   ```

3. Increase timeout:
   ```javascript
   await page.click('[data-testid="button"]', { timeout: 10000 });
   ```

### Cross-Browser Issues

**Problem**: Tests fail on specific browsers

**Possible Causes**:
- Browser-specific APIs
- CSS differences
- Timing differences

**Solutions**:
1. Use browser-agnostic APIs:
   ```javascript
   // Instead of: window.webkitURL
   window.URL || window.webkitURL
   ```

2. Add browser-specific waits:
   ```javascript
   if (browserName === 'webkit') {
     await page.waitForTimeout(1000);
   }
   ```

3. Use consistent selectors:
   ```javascript
   // Good
   page.getByRole('button');
   
   // Avoid
   page.locator('.chrome-specific-class');
   ```

## Performance Testing Issues

### Inconsistent Performance Metrics

**Problem**: Performance measurements vary significantly

**Possible Causes**:
- System load variations
- Browser caching
- Network conditions

**Solutions**:
1. Run multiple iterations:
   ```javascript
   const results = [];
   for (let i = 0; i < 10; i++) {
     const result = await measurePerformance();
     results.push(result);
   }
   const average = results.reduce((a, b) => a + b) / results.length;
   ```

2. Clear cache:
   ```javascript
   await page.context().clearCookies();
   await page.goto('about:blank');
   ```

3. Control network conditions:
   ```javascript
   await page.route('**/*', route => {
     // Simulate consistent network conditions
   });
   ```

### Memory Measurement Issues

**Problem**: Memory measurements are inaccurate

**Possible Causes**:
- Garbage collection timing
- Browser limitations
- Measurement errors

**Solutions**:
1. Force garbage collection:
   ```javascript
   if (global.gc) {
     global.gc();
   }
   ```

2. Use multiple measurements:
   ```javascript
   const measurements = [];
   for (let i = 0; i < 5; i++) {
     measurements.push(performance.memory.usedJSHeapSize);
     await new Promise(resolve => setTimeout(resolve, 100));
   }
   ```

3. Use browser-specific APIs:
   ```javascript
   const memoryInfo = await page.evaluate(() => performance.memory);
   ```

## Accessibility Testing Issues

### Axe Violations

**Problem**: Accessibility tests fail with violations

**Possible Causes**:
- Missing ARIA attributes
- Incorrect semantic HTML
- Color contrast issues

**Solutions**:
1. Fix common violations:
   ```javascript
   // Add proper labels
   <button aria-label="Close">×</button>
   
   // Use semantic HTML
   <nav role="navigation">
   ```

2. Check color contrast:
   ```javascript
   // Use tools like WebAIM Contrast Checker
   // Ensure contrast ratio of at least 4.5:1
   ```

3. Add ARIA attributes:
   ```javascript
   <div role="alert" aria-live="polite">
     Error message
   </div>
   ```

### Keyboard Navigation Issues

**Problem**: Keyboard navigation doesn't work

**Possible Causes**:
- Missing tabindex
- Focus management issues
- Event handling problems

**Solutions**:
1. Add proper tabindex:
   ```javascript
   <div tabIndex={0} role="button">
     Custom Button
   </div>
   ```

2. Manage focus:
   ```javascript
   useEffect(() => {
     if (isOpen) {
       focusRef.current?.focus();
     }
   }, [isOpen]);
   ```

3. Handle keyboard events:
   ```javascript
   const handleKeyDown = (event) => {
     if (event.key === 'Enter' || event.key === ' ') {
       handleClick();
     }
   };
   ```

## Mocking Issues

### Mock Not Working

**Problem**: Mocks are not being used

**Possible Causes**:
- Mock setup after import
- Incorrect mock path
- Mock not hoisted

**Solutions**:
1. Mock before imports:
   ```javascript
   jest.mock('./module', () => ({
     function: jest.fn(),
   }));
   
   import { function } from './module';
   ```

2. Use correct paths:
   ```javascript
   // Check jest.config.js for moduleNameMapping
   jest.mock('@/components/MyComponent');
   ```

3. Use dynamic imports:
   ```javascript
   const mockModule = await import('./module');
   mockModule.function = jest.fn();
   ```

### Mock Implementation Issues

**Problem**: Mock implementation doesn't work as expected

**Possible Causes**:
- Incorrect mock return values
- Missing mock implementations
- Async operations not handled

**Solutions**:
1. Provide proper return values:
   ```javascript
   mockFunction.mockReturnValue('expected-value');
   mockFunction.mockResolvedValue('async-value');
   ```

2. Implement mock functions:
   ```javascript
   mockFunction.mockImplementation((input) => {
     return `processed-${input}`;
   });
   ```

3. Handle async operations:
   ```javascript
   mockAsyncFunction.mockImplementation(async () => {
     await new Promise(resolve => setTimeout(resolve, 100));
     return 'async-result';
   });
   ```

## CI/CD Issues

### Tests Failing in CI

**Problem**: Tests pass locally but fail in CI

**Possible Causes**:
- Environment differences
- Resource limitations
- Timing issues

**Solutions**:
1. Match local environment:
   ```yaml
   # .github/workflows/test.yml
   - name: Setup Node
     uses: actions/setup-node@v2
     with:
       node-version: '18'
   ```

2. Increase resources:
   ```yaml
   jobs:
     test:
       runs-on: ubuntu-latest
       timeout-minutes: 30
   ```

3. Add retries:
   ```yaml
   - name: Run tests
     run: npm run test:ci
     continue-on-error: true
   ```

### Coverage Issues

**Problem**: Coverage reports are incorrect

**Possible Causes**:
- Incorrect configuration
- Files not included
- Coverage thresholds too high

**Solutions**:
1. Update configuration:
   ```javascript
   // jest.config.js
   collectCoverageFrom: [
     'src/**/*.{js,jsx,ts,tsx}',
     '!src/**/*.d.ts',
     '!src/**/*.stories.{js,jsx,ts,tsx}',
   ],
   ```

2. Adjust thresholds:
   ```javascript
   coverageThreshold: {
     global: {
       branches: 70,
       functions: 70,
       lines: 70,
       statements: 70,
     },
   },
   ```

3. Exclude test files:
   ```javascript
   coveragePathIgnorePatterns: [
     '/node_modules/',
     '/tests/',
   ],
   ```

## Debugging Techniques

### Console Logging

**Problem**: Need to debug test execution

**Solutions**:
1. Add console logs:
   ```javascript
   console.log('Debug info:', data);
   console.log('Element:', screen.debug());
   ```

2. Use debug mode:
   ```bash
   npm run test -- --debug
   ```

3. Pause execution:
   ```javascript
   screen.debug();
   await page.pause(); // Playwright
   ```

### Visual Debugging

**Problem**: Need to see what's happening

**Solutions**:
1. Take screenshots:
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```

2. Use browser dev tools:
   ```javascript
   await page.pause(); // Playwright
   // Open browser dev tools manually
   ```

3. Inspect DOM:
   ```javascript
   console.log(document.documentElement.outerHTML);
   ```

### Step-by-Step Debugging

**Problem**: Need to trace test execution

**Solutions**:
1. Use debugger:
   ```javascript
   debugger; // In test code
   ```

2. Use VS Code debugger:
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Jest Tests",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["--runInBand"],
     "console": "integratedTerminal",
     "internalConsoleOptions": "neverOpen"
   }
   ```

3. Use test runner debugger:
   ```bash
   npm run test -- --inspect-brk
   ```

## Best Practices

### Preventing Issues

1. **Write tests first** (TDD)
2. **Keep tests simple**
3. **Use descriptive test names**
4. **Test one thing at a time**
5. **Use proper assertions**
6. **Clean up after tests**
7. **Use consistent test data**
8. **Mock external dependencies**
9. **Test edge cases**
10. **Review test coverage**

### Maintaining Tests

1. **Update tests with code changes**
2. **Refactor tests for clarity**
3. **Remove obsolete tests**
4. **Optimize slow tests**
5. **Fix flaky tests**
6. **Document complex tests**
7. **Share test utilities**
8. **Regular code reviews**
9. **Monitor test metrics**
10. **Continuous improvement**

## Additional Resources

- [Jest Debugging Guide](https://jestjs.io/docs/troubleshooting)
- [React Testing Library FAQ](https://testing-library.com/docs/react-testing-library/faq)
- [Playwright Debugging](https://playwright.dev/docs/debug)
- [MSW Debugging](https://mswjs.io/docs/recipes/debugging)
- [Accessibility Testing Guide](https://www.deque.com/axe/)

## Conclusion

This troubleshooting guide should help resolve common testing issues. Remember that testing is an iterative process, and continuous improvement is key to maintaining a robust test suite.

For additional help, reach out to the development team or consult the official documentation for the testing frameworks being used.