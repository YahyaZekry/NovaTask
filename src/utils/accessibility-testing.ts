/**
 * Accessibility testing utilities for NovaTask
 * Provides helper functions for testing accessibility features
 */

// Types for accessibility testing
export interface AccessibilityIssue {
  type: 'error' | 'warning';
  category: 'aria' | 'keyboard' | 'focus' | 'contrast' | 'semantic' | 'other';
  message: string;
  element: Element;
  selector: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  fix?: string;
}

export interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number;
  summary: {
    errors: number;
    warnings: number;
    total: number;
  };
}

export interface TestOptions {
  includeWarnings?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  element?: Element;
  selector?: string;
}

// Color contrast utilities
export const colorContrast = {
  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Convert RGB to relative luminance
   */
  rgbToLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1) || { r: 0, g: 0, b: 0 };
    const rgb2 = this.hexToRgb(color2) || { r: 255, g: 255, b: 255 };
    
    const lum1 = this.rgbToLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.rgbToLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG requirements
   */
  meetsWCAG(contrastRatio: number, isLargeText: boolean, level: 'A' | 'AA' | 'AAA' = 'AA'): boolean {
    switch (level) {
      case 'A':
        return contrastRatio >= 3.0;
      case 'AA':
        return isLargeText ? contrastRatio >= 3.0 : contrastRatio >= 4.5;
      case 'AAA':
        return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7.0;
      default:
        return false;
    }
  }
};

// ARIA testing utilities
export const ariaTests = {
  /**
   * Check if element has required ARIA attributes
   */
  hasRequiredAria(element: Element, requiredAttributes: string[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    requiredAttributes.forEach(attr => {
      if (!element.hasAttribute(attr)) {
        issues.push({
          type: 'error',
          category: 'aria',
          message: `Missing required ARIA attribute: ${attr}`,
          element,
          selector: this.getElementSelector(element),
          wcagLevel: 'A',
          fix: `Add ${attr} attribute to the element`
        });
      }
    });
    
    return issues;
  },

  /**
   * Check if ARIA attributes have valid values
   */
  hasValidAriaValues(element: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const ariaAttributes = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'));
    
    ariaAttributes.forEach(attr => {
      const value = attr.value;
      
      // Check for empty values that shouldn't be empty
      if (!value && !['aria-hidden', 'aria-disabled'].includes(attr.name)) {
        issues.push({
          type: 'warning',
          category: 'aria',
          message: `ARIA attribute ${attr.name} has empty value`,
          element,
          selector: this.getElementSelector(element),
          wcagLevel: 'AA',
          fix: `Provide a meaningful value for ${attr.name} or remove the attribute`
        });
      }
      
      // Check for invalid role values
      if (attr.name === 'role') {
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
          'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
          'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
          'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
          'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
          'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
          'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
          'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
          'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
          'tree', 'treegrid', 'treeitem'
        ];
        
        if (!validRoles.includes(value)) {
          issues.push({
            type: 'error',
            category: 'aria',
            message: `Invalid role value: ${value}`,
            element,
            selector: this.getElementSelector(element),
            wcagLevel: 'A',
            fix: `Use a valid role value from the ARIA specification`
          });
        }
      }
    });
    
    return issues;
  },

  /**
   * Get CSS selector for element
   */
  getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    let current = element;
    
    while (current.parentElement) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        selector += '.' + current.className.split(' ').join('.');
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
};

// Keyboard navigation testing
export const keyboardTests = {
  /**
   * Check if interactive elements are keyboard accessible
   */
  isKeyboardAccessible(element: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const tagName = element.tagName.toLowerCase();
    
    // Check if element is interactive but not keyboard accessible
    const interactiveElements = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
    const hasTabIndex = element.hasAttribute('tabindex');
    const isInteractive = interactiveElements.includes(tagName) || 
                         element.hasAttribute('onclick') || 
                         element.hasAttribute('onkeydown') ||
                         element.getAttribute('role') === 'button' ||
                         element.getAttribute('role') === 'link';
    
    if (isInteractive && !hasTabIndex && !interactiveElements.includes(tagName)) {
      issues.push({
        type: 'error',
        category: 'keyboard',
        message: 'Interactive element is not keyboard accessible',
        element,
        selector: ariaTests.getElementSelector(element),
        wcagLevel: 'A',
        fix: 'Add tabindex="0" to make the element keyboard focusable'
      });
    }
    
    // Check for positive tabindex (should be avoided)
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push({
        type: 'warning',
        category: 'keyboard',
        message: 'Positive tabindex value can disrupt keyboard navigation order',
        element,
        selector: ariaTests.getElementSelector(element),
        wcagLevel: 'A',
        fix: 'Use tabindex="0" or remove tabindex attribute to maintain natural tab order'
      });
    }
    
    return issues;
  },

  /**
   * Check if element has keyboard event handlers
   */
  hasKeyboardHandlers(element: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    if (element.hasAttribute('onclick') && !element.hasAttribute('onkeydown') && !element.hasAttribute('onkeyup')) {
      issues.push({
        type: 'warning',
        category: 'keyboard',
        message: 'Element has click handler but no keyboard event handlers',
        element,
        selector: ariaTests.getElementSelector(element),
        wcagLevel: 'A',
        fix: 'Add keyboard event handlers (onkeydown/onkeyup) to support keyboard interaction'
      });
    }
    
    return issues;
  }
};

// Focus management testing
export const focusTests = {
  /**
   * Check if element has visible focus indicator
   */
  hasFocusIndicator(element: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // This is a simplified check - in real testing, you'd need to compute styles
    const style = window.getComputedStyle(element);
    const hasOutline = style.outline !== 'none' && style.outline !== '';
    const hasBoxShadow = style.boxShadow !== 'none' && style.boxShadow !== '';
    
    if (!hasOutline && !hasBoxShadow) {
      issues.push({
        type: 'warning',
        category: 'focus',
        message: 'Element may not have visible focus indicator',
        element,
        selector: ariaTests.getElementSelector(element),
        wcagLevel: 'AA',
        fix: 'Add :focus-visible styles with outline or box-shadow'
      });
    }
    
    return issues;
  },

  /**
   * Check if focus trap is working in modals
   */
  checkFocusTrap(container: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) {
      issues.push({
        type: 'error',
        category: 'focus',
        message: 'Modal or dialog has no focusable elements',
        element: container,
        selector: ariaTests.getElementSelector(container),
        wcagLevel: 'A',
        fix: 'Add at least one focusable element (like a close button) to the modal'
      });
    }
    
    return issues;
  }
};

// Semantic HTML testing
export const semanticTests = {
  /**
   * Check if heading hierarchy is logical
   */
  checkHeadingHierarchy(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));
      
      if (index === 0 && currentLevel !== 1) {
        issues.push({
          type: 'warning',
          category: 'semantic',
          message: 'Page should start with h1 heading',
          element: heading,
          selector: ariaTests.getElementSelector(heading),
          wcagLevel: 'AA',
          fix: 'Use h1 for the main page heading'
        });
      }
      
      if (currentLevel > previousLevel + 1) {
        issues.push({
          type: 'warning',
          category: 'semantic',
          message: `Heading level skipped: h${previousLevel} to h${currentLevel}`,
          element: heading,
          selector: ariaTests.getElementSelector(heading),
          wcagLevel: 'AA',
          fix: `Use h${previousLevel + 1} instead of h${currentLevel} to maintain proper hierarchy`
        });
      }
      
      previousLevel = currentLevel;
    });
    
    return issues;
  },

  /**
   * Check if images have alt text
   */
  checkImageAltText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      
      if (alt === null) {
        issues.push({
          type: 'error',
          category: 'semantic',
          message: 'Image missing alt attribute',
          element: img,
          selector: ariaTests.getElementSelector(img),
          wcagLevel: 'A',
          fix: 'Add alt attribute to describe the image content or use alt="" for decorative images'
        });
      }
    });
    
    return issues;
  },

  /**
   * Check if form inputs have labels
   */
  checkFormLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                      input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby') ||
                      input.getAttribute('title');
      
      if (!hasLabel) {
        issues.push({
          type: 'error',
          category: 'semantic',
          message: 'Form input missing label',
          element: input,
          selector: ariaTests.getElementSelector(input),
          wcagLevel: 'A',
          fix: 'Add a label element with for attribute, or use aria-label/aria-labelledby'
        });
      }
    });
    
    return issues;
  }
};

// Main accessibility testing function
export function testAccessibility(options: TestOptions = {}): AccessibilityTestResult {
  const {
    includeWarnings = true,
    wcagLevel = 'AA',
    element = document.body,
    selector = 'body'
  } = options;
  
  const allIssues: AccessibilityIssue[] = [];
  
  // Get elements to test
  const elements = selector ? document.querySelectorAll(selector) : [element];
  
  elements.forEach(el => {
    // Run all tests
    allIssues.push(...ariaTests.hasValidAriaValues(el));
    allIssues.push(...keyboardTests.isKeyboardAccessible(el));
    allIssues.push(...keyboardTests.hasKeyboardHandlers(el));
    allIssues.push(...focusTests.hasFocusIndicator(el));
  });
  
  // Run document-wide tests
  if (element === document.body) {
    allIssues.push(...semanticTests.checkHeadingHierarchy());
    allIssues.push(...semanticTests.checkImageAltText());
    allIssues.push(...semanticTests.checkFormLabels());
  }
  
  // Filter issues by WCAG level and warning preference
  const filteredIssues = allIssues.filter(issue => {
    const levelMatch = issue.wcagLevel === wcagLevel || 
                     (wcagLevel === 'AAA' && ['A', 'AA', 'AAA'].includes(issue.wcagLevel)) ||
                     (wcagLevel === 'AA' && ['A', 'AA'].includes(issue.wcagLevel)) ||
                     (wcagLevel === 'A' && issue.wcagLevel === 'A');
    
    const typeMatch = includeWarnings || issue.type === 'error';
    
    return levelMatch && typeMatch;
  });
  
  // Calculate score
  const maxScore = 100;
  const errorPenalty = 10;
  const warningPenalty = 3;
  
  const errors = filteredIssues.filter(i => i.type === 'error').length;
  const warnings = filteredIssues.filter(i => i.type === 'warning').length;
  
  const score = Math.max(0, maxScore - (errors * errorPenalty) - (warnings * warningPenalty));
  
  return {
    passed: errors === 0,
    issues: filteredIssues,
    score,
    summary: {
      errors,
      warnings,
      total: filteredIssues.length
    }
  };
}

// Quick accessibility check for common issues
export function quickAccessibilityCheck(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Check for missing alt text
  issues.push(...semanticTests.checkImageAltText());
  
  // Check for missing form labels
  issues.push(...semanticTests.checkFormLabels());
  
  // Check for positive tabindex values
  document.querySelectorAll('[tabindex]').forEach(el => {
    const tabIndex = el.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push({
        type: 'warning',
        category: 'keyboard',
        message: 'Positive tabindex value can disrupt keyboard navigation order',
        element: el,
        selector: ariaTests.getElementSelector(el),
        wcagLevel: 'A',
        fix: 'Use tabindex="0" or remove tabindex attribute to maintain natural tab order'
      });
    }
  });
  
  return issues;
}

// Generate accessibility report
export function generateAccessibilityReport(result: AccessibilityTestResult): string {
  const { passed, issues, score, summary } = result;
  
  let report = `# Accessibility Test Report\n\n`;
  report += `**Overall Score:** ${score}/100\n`;
  report += `**Status:** ${passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  report += `## Summary\n`;
  report += `- Errors: ${summary.errors}\n`;
  report += `- Warnings: ${summary.warnings}\n`;
  report += `- Total Issues: ${summary.total}\n\n`;
  
  if (issues.length > 0) {
    report += `## Issues\n\n`;
    
    // Group issues by category
    const issuesByCategory = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = [];
      }
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, AccessibilityIssue[]>);
    
    Object.entries(issuesByCategory).forEach(([category, categoryIssues]) => {
      report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Issues\n\n`;
      
      categoryIssues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : '⚠️';
        report += `${icon} **${issue.type.toUpperCase()}** (WCAG ${issue.wcagLevel})\n`;
        report += `   - **Message:** ${issue.message}\n`;
        report += `   - **Element:** \`${issue.selector}\`\n`;
        if (issue.fix) {
          report += `   - **Fix:** ${issue.fix}\n`;
        }
        report += `\n`;
      });
    });
  }
  
  return report;
}

// Console logging utility
export function logAccessibilityResult(result: AccessibilityTestResult): void {
  console.group('🔍 Accessibility Test Results');
  console.log(`Score: ${result.score}/100`);
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Errors: ${result.summary.errors}, Warnings: ${result.summary.warnings}`);
  
  if (result.issues.length > 0) {
    console.group('Issues');
    result.issues.forEach((issue, index) => {
      const icon = issue.type === 'error' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${icon} [${issue.category.toUpperCase()}] ${issue.message}`);
      console.log(`   Element: ${issue.selector}`);
      if (issue.fix) {
        console.log(`   Fix: ${issue.fix}`);
      }
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}