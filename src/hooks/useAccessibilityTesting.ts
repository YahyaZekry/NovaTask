/**
 * React hooks for accessibility testing
 * Provides hooks for testing accessibility in React components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  testAccessibility, 
  AccessibilityTestResult, 
  AccessibilityIssue,
  quickAccessibilityCheck,
  logAccessibilityResult,
  generateAccessibilityReport
} from '@/utils/accessibility-testing';

// Hook for testing accessibility of a component
export function useAccessibilityTesting(options: {
  enabled?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  includeWarnings?: boolean;
  onResult?: (result: AccessibilityTestResult) => void;
  autoRun?: boolean;
} = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    wcagLevel = 'AA',
    includeWarnings = true,
    onResult,
    autoRun = true
  } = options;
  
  const [result, setResult] = useState<AccessibilityTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  
  const runTest = useCallback(() => {
    if (!enabled || !elementRef.current) return;
    
    setIsTesting(true);
    
    try {
      const testResult = testAccessibility({
        includeWarnings,
        wcagLevel,
        element: elementRef.current
      });
      
      setResult(testResult);
      onResult?.(testResult);
      
      // Log results in development
      if (process.env.NODE_ENV === 'development') {
        logAccessibilityResult(testResult);
      }
    } catch (error) {
      console.error('Accessibility test failed:', error);
    } finally {
      setIsTesting(false);
    }
  }, [enabled, includeWarnings, wcagLevel, onResult]);
  
  // Auto-run test when component mounts or dependencies change
  useEffect(() => {
    if (autoRun && enabled) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(runTest, 100);
      return () => clearTimeout(timer);
    }
  }, [autoRun, enabled, runTest]);
  
  return {
    elementRef,
    result,
    isTesting,
    runTest,
    hasErrors: result?.summary.errors ? result.summary.errors > 0 : false,
    hasWarnings: result?.summary.warnings ? result.summary.warnings > 0 : false,
    score: result?.score || 0,
    passed: result?.passed || false
  };
}

// Hook for quick accessibility checks
export function useQuickAccessibilityCheck(options: {
  enabled?: boolean;
  onIssuesFound?: (issues: AccessibilityIssue[]) => void;
} = {}) {
  const { enabled = process.env.NODE_ENV === 'development', onIssuesFound } = options;
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [hasIssues, setHasIssues] = useState(false);
  
  const runQuickCheck = useCallback(() => {
    if (!enabled) return;
    
    try {
      const foundIssues = quickAccessibilityCheck();
      setIssues(foundIssues);
      setHasIssues(foundIssues.length > 0);
      onIssuesFound?.(foundIssues);
      
      // Log issues in development
      if (process.env.NODE_ENV === 'development' && foundIssues.length > 0) {
        console.group('⚠️ Quick Accessibility Check');
        console.log(`Found ${foundIssues.length} accessibility issues:`);
        foundIssues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.category}] ${issue.message}`);
        });
        console.groupEnd();
      }
    } catch (error) {
      console.error('Quick accessibility check failed:', error);
    }
  }, [enabled, onIssuesFound]);
  
  // Run check on mount
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(runQuickCheck, 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, runQuickCheck]);
  
  return {
    issues,
    hasIssues,
    runQuickCheck,
    errorCount: issues.filter(i => i.type === 'error').length,
    warningCount: issues.filter(i => i.type === 'warning').length
  };
}

// Hook for monitoring accessibility changes
export function useAccessibilityMonitor(options: {
  enabled?: boolean;
  interval?: number;
  onViolation?: (issue: AccessibilityIssue) => void;
} = {}) {
  const { 
    enabled = process.env.NODE_ENV === 'development', 
    interval = 5000,
    onViolation 
  } = options;
  
  const [violations, setViolations] = useState<AccessibilityIssue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const startMonitoring = useCallback(() => {
    if (!enabled || isMonitoring) return;
    
    setIsMonitoring(true);
    
    intervalRef.current = setInterval(() => {
      const issues = quickAccessibilityCheck();
      const newViolations = issues.filter(issue => 
        !violations.some(v => 
          v.element === issue.element && 
          v.message === issue.message
        )
      );
      
      if (newViolations.length > 0) {
        setViolations(prev => [...prev, ...newViolations]);
        newViolations.forEach(issue => onViolation?.(issue));
      }
    }, interval);
  }, [enabled, isMonitoring, violations, interval, onViolation]);
  
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);
  
  const clearViolations = useCallback(() => {
    setViolations([]);
  }, []);
  
  // Auto-start monitoring when enabled
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, startMonitoring]);
  
  return {
    violations,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearViolations,
    violationCount: violations.length
  };
}

// Hook for accessibility reporting
export function useAccessibilityReporting(options: {
  enabled?: boolean;
  format?: 'json' | 'markdown' | 'console';
  autoGenerate?: boolean;
} = {}) {
  const { 
    enabled = process.env.NODE_ENV === 'development',
    format = 'console',
    autoGenerate = true
  } = options;
  
  const [report, setReport] = useState<string>('');
  const [lastResult, setLastResult] = useState<AccessibilityTestResult | null>(null);
  
  const generateReport = useCallback((result: AccessibilityTestResult) => {
    if (!enabled) return;
    
    setLastResult(result);
    
    let generatedReport = '';
    
    switch (format) {
      case 'json':
        generatedReport = JSON.stringify(result, null, 2);
        break;
      case 'markdown':
        generatedReport = generateAccessibilityReport(result);
        break;
      case 'console':
      default:
        logAccessibilityResult(result);
        generatedReport = `Accessibility test completed. Score: ${result.score}/100, Status: ${result.passed ? 'PASSED' : 'FAILED'}`;
        break;
    }
    
    setReport(generatedReport);
    return generatedReport;
  }, [enabled, format]);
  
  const downloadReport = useCallback((filename?: string) => {
    if (!report) return;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `accessibility-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);
  
  return {
    report,
    lastResult,
    generateReport,
    downloadReport,
    hasReport: report.length > 0
  };
}

// Hook for testing specific accessibility rules
export function useAccessibilityRuleTest(options: {
  rule: 'aria' | 'keyboard' | 'focus' | 'semantic' | 'contrast';
  selector?: string;
  enabled?: boolean;
}) {
  const { rule, selector, enabled = process.env.NODE_ENV === 'development' } = options;
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  
  const runRuleTest = useCallback(() => {
    if (!enabled) return;
    
    setIsTesting(true);
    
    try {
      const elements = selector 
        ? document.querySelectorAll(selector)
        : document.querySelectorAll('*');
      
      const ruleIssues: AccessibilityIssue[] = [];
      
      elements.forEach(element => {
        // Test specific rule based on type
        switch (rule) {
          case 'aria':
            // Test ARIA attributes
            const ariaAttributes = Array.from(element.attributes)
              .filter(attr => attr.name.startsWith('aria-'));
            
            ariaAttributes.forEach(attr => {
              if (!attr.value && !['aria-hidden', 'aria-disabled'].includes(attr.name)) {
                ruleIssues.push({
                  type: 'warning',
                  category: 'aria',
                  message: `ARIA attribute ${attr.name} has empty value`,
                  element,
                  selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                  wcagLevel: 'AA',
                  fix: `Provide a meaningful value for ${attr.name} or remove the attribute`
                });
              }
            });
            break;
            
          case 'keyboard':
            // Test keyboard accessibility
            const hasTabIndex = element.hasAttribute('tabindex');
            const isInteractive = element.hasAttribute('onclick') || 
                                element.hasAttribute('role');
            
            if (isInteractive && !hasTabIndex) {
              ruleIssues.push({
                type: 'error',
                category: 'keyboard',
                message: 'Interactive element is not keyboard accessible',
                element,
                selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                wcagLevel: 'A',
                fix: 'Add tabindex="0" to make the element keyboard focusable'
              });
            }
            break;
            
          case 'focus':
            // Test focus indicators
            const focusStyle = window.getComputedStyle(element);
            const hasOutline = focusStyle.outline !== 'none' && focusStyle.outline !== '';
            const tabIndex = (element as HTMLElement).tabIndex;
            
            if (!hasOutline && tabIndex >= 0) {
              ruleIssues.push({
                type: 'warning',
                category: 'focus',
                message: 'Focusable element may not have visible focus indicator',
                element,
                selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                wcagLevel: 'AA',
                fix: 'Add :focus-visible styles with outline or box-shadow'
              });
            }
            break;
            
          case 'semantic':
            // Test semantic HTML
            if (element.tagName.toLowerCase() === 'img' && !element.hasAttribute('alt')) {
              ruleIssues.push({
                type: 'error',
                category: 'semantic',
                message: 'Image missing alt attribute',
                element,
                selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                wcagLevel: 'A',
                fix: 'Add alt attribute to describe the image content'
              });
            }
            break;
            
          case 'contrast':
            // This would require more complex color calculation
            // For now, just check if text elements have explicit color
            const textElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
            if (textElements.includes(element.tagName.toLowerCase())) {
              const contrastStyle = window.getComputedStyle(element);
              const color = contrastStyle.color;
              if (color === 'rgb(0, 0, 0)' || color === '#000000') {
                ruleIssues.push({
                  type: 'warning',
                  category: 'contrast',
                  message: 'Text may have insufficient contrast with background',
                  element,
                  selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                  wcagLevel: 'AA',
                  fix: 'Ensure text color has sufficient contrast with background (4.5:1 for normal text)'
                });
              }
            }
            break;
        }
      });
      
      setIssues(ruleIssues);
      
      // Log results in development
      if (process.env.NODE_ENV === 'development' && ruleIssues.length > 0) {
        console.group(`🔍 ${rule.toUpperCase()} Rule Test`);
        console.log(`Found ${ruleIssues.length} issues:`);
        ruleIssues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.message}`);
        });
        console.groupEnd();
      }
    } catch (error) {
      console.error(`${rule} rule test failed:`, error);
    } finally {
      setIsTesting(false);
    }
  }, [enabled, rule, selector]);
  
  // Auto-run test when hook mounts or dependencies change
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(runRuleTest, 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, runRuleTest]);
  
  return {
    issues,
    isTesting,
    runRuleTest,
    issueCount: issues.length,
    errorCount: issues.filter(i => i.type === 'error').length,
    warningCount: issues.filter(i => i.type === 'warning').length
  };
}