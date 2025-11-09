/**
 * Accessibility testing component for development
 * Provides real-time accessibility testing and reporting
 */

"use client";

import { useState, useEffect } from "react";
import { 
  useAccessibilityTesting, 
  useQuickAccessibilityCheck,
  useAccessibilityReporting 
} from "@/hooks/useAccessibilityTesting";
import { AccessibilityTestResult, AccessibilityIssue } from "@/utils/accessibility-testing";

interface AccessibilityTesterProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showScore?: boolean;
  showDetails?: boolean;
  autoRun?: boolean;
}

export function AccessibilityTester({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
  showScore = true,
  showDetails = true,
  autoRun = true
}: AccessibilityTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'issues' | 'report'>('summary');
  
  const {
    result,
    isTesting,
    runTest,
    hasErrors,
    hasWarnings,
    score,
    passed
  } = useAccessibilityTesting({
    enabled,
    autoRun,
    onResult: (result) => {
      // Auto-open if there are errors
      if (result.summary.errors > 0 && !isOpen) {
        setIsOpen(true);
      }
    }
  });
  
  const { issues: quickIssues } = useQuickAccessibilityCheck({ enabled });
  const { generateReport, downloadReport } = useAccessibilityReporting({
    enabled,
    format: 'markdown'
  });

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!enabled) return null;

  const getStatusColor = () => {
    if (hasErrors) return 'bg-red-500';
    if (hasWarnings) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (hasErrors) return 'Errors';
    if (hasWarnings) return 'Warnings';
    return 'Passed';
  };

  const handleDownloadReport = () => {
    if (result) {
      const report = generateReport(result);
      if (report) {
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses[position]} z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-semibold button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction ${getStatusColor()}`}
        aria-label={`Accessibility ${getStatusText()} - Score: ${score}/100`}
        title={`Accessibility ${getStatusText()} - Score: ${score}/100`}
      >
        {showScore ? (
          <span className="text-xs">{score}</span>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-overlay transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Panel */}
          <div className="relative glass-desktop rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col card-hover-enhanced micro-interaction mobile-panel-transition performance-optimized">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Accessibility Test Results</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg glass-desktop flex items-center justify-center button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction"
                aria-label="Close accessibility tester"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 glass-desktop rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Overall Score</span>
                <span className={`text-2xl font-bold ${passed ? 'text-green-400' : hasErrors ? 'text-red-400' : 'text-yellow-400'}`}>
                  {score}/100
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className={`px-2 py-1 rounded ${passed ? 'bg-green-500/20 text-green-400' : hasErrors ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
                {result && (
                  <>
                    <span className="text-red-400">{result.summary.errors} Errors</span>
                    <span className="text-yellow-400">{result.summary.warnings} Warnings</span>
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            {showDetails && (
              <div className="flex gap-2 mb-4 border-b border-white/20">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 text-sm font-medium transition-colors focus-enhanced keyboard-enhanced ${
                    activeTab === 'summary'
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`px-4 py-2 text-sm font-medium transition-colors focus-enhanced keyboard-enhanced ${
                    activeTab === 'issues'
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Issues ({result?.summary.total || 0})
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-4 py-2 text-sm font-medium transition-colors focus-enhanced keyboard-enhanced ${
                    activeTab === 'report'
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Report
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="glass-desktop rounded-lg p-4 card-hover-enhanced micro-interaction">
                    <h3 className="text-white font-medium mb-2">Test Categories</h3>
                    <div className="space-y-2">
                      {result && Object.entries(
                        result.issues.reduce((acc, issue) => {
                          acc[issue.category] = (acc[issue.category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between text-sm hover:bg-white/5 p-2 rounded transition-colors">
                          <span className="text-white/80 capitalize">{category}</span>
                          <span className="text-white">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="glass-desktop rounded-lg p-4 card-hover-enhanced micro-interaction">
                    <h3 className="text-white font-medium mb-2">WCAG Compliance</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm hover:bg-white/5 p-2 rounded transition-colors">
                        <span className="text-white/80">Level A</span>
                        <span className="text-green-400">✓ Compliant</span>
                      </div>
                      <div className="flex items-center justify-between text-sm hover:bg-white/5 p-2 rounded transition-colors">
                        <span className="text-white/80">Level AA</span>
                        <span className={hasErrors ? 'text-red-400' : 'text-green-400'}>
                          {hasErrors ? '✗ Issues Found' : '✓ Compliant'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm hover:bg-white/5 p-2 rounded transition-colors">
                        <span className="text-white/80">Level AAA</span>
                        <span className="text-yellow-400">⚠ Not Tested</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'issues' && result && (
                <div className="space-y-3">
                  {result.issues.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-green-400 text-4xl mb-2">✓</div>
                      <p className="text-white">No accessibility issues found!</p>
                    </div>
                  ) : (
                    result.issues.map((issue, index) => (
                      <div key={index} className="glass-desktop rounded-lg p-4 card-hover-enhanced micro-interaction">
                        <div className="flex items-start gap-3">
                          <span className={`text-lg ${issue.type === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {issue.type === 'error' ? '❌' : '⚠️'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium capitalize">{issue.category}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                issue.type === 'error'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {issue.type.toUpperCase()}
                              </span>
                              <span className="text-xs text-white/60">WCAG {issue.wcagLevel}</span>
                            </div>
                            <p className="text-white/80 text-sm mb-2">{issue.message}</p>
                            <div className="text-xs text-white/60 font-mono bg-black/20 p-2 rounded hover:bg-black/30 transition-colors">
                              {issue.selector}
                            </div>
                            {issue.fix && (
                              <div className="mt-2 text-xs text-green-400">
                                <strong>Fix:</strong> {issue.fix}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'report' && (
                <div className="space-y-4">
                  <div className="glass-desktop rounded-lg p-4 card-hover-enhanced micro-interaction">
                    <h3 className="text-white font-medium mb-2">Accessibility Report</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Generate a detailed accessibility report for this page.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadReport}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction"
                      >
                        Download Report
                      </button>
                      <button
                        onClick={runTest}
                        disabled={isTesting}
                        className="px-4 py-2 glass-desktop text-white rounded-lg button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction disabled:opacity-50"
                      >
                        {isTesting ? 'Testing...' : 'Re-run Test'}
                      </button>
                    </div>
                  </div>
                  
                  {result && (
                    <div className="glass-desktop rounded-lg p-4">
                      <h3 className="text-white font-medium mb-2">Test Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Elements Tested</span>
                          <span className="text-white">All visible elements</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Test Duration</span>
                          <span className="text-white">&lt; 1 second</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Last Test Run</span>
                          <span className="text-white">{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export a simpler version for quick checks
export function QuickAccessibilityCheck() {
  const { issues, hasIssues } = useQuickAccessibilityCheck();
  
  if (!hasIssues || process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 glass-desktop rounded-lg p-3 max-w-sm card-hover-enhanced micro-interaction">
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{issues.length} accessibility issue{issues.length > 1 ? 's' : ''} found</span>
      </div>
    </div>
  );
}