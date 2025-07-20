import { AccessibilityInfo, Dimensions, PixelRatio, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { accessibilityConfig } from './accessibilityConfig';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'contrast' | 'touch-target' | 'label' | 'role' | 'state' | 'focus';
  message: string;
  element?: string;
  wcagCriteria?: string;
}

interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number;
  recommendations: string[];
}

interface ElementAccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: object;
  style?: ViewStyle | TextStyle;
  testID?: string;
}

export const accessibilityTesting = {
  /**
   * Test element accessibility compliance
   */
  testElementAccessibility: (
    element: ElementAccessibilityProps,
    context?: string
  ): AccessibilityTestResult => {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

    // Test accessibility label
    if (!element.accessibilityLabel) {
      issues.push({
        type: 'error',
        category: 'label',
        message: 'Missing accessibilityLabel',
        element: context || 'Unknown element',
        wcagCriteria: 'WCAG 2.1 - 1.3.1 Info and Relationships',
      });
      recommendations.push('Add descriptive accessibilityLabel');
    } else if (element.accessibilityLabel.length > accessibilityConfig.screenReader.maxLabelLength) {
      issues.push({
        type: 'warning',
        category: 'label',
        message: `accessibilityLabel is too long (${element.accessibilityLabel.length} chars, max ${accessibilityConfig.screenReader.maxLabelLength})`,
        element: context || 'Unknown element',
      });
      recommendations.push('Shorten accessibilityLabel to be more concise');
    }

    // Test accessibility hint
    if (element.accessibilityHint && element.accessibilityHint.length > accessibilityConfig.screenReader.maxHintLength) {
      issues.push({
        type: 'warning',
        category: 'label',
        message: `accessibilityHint is too long (${element.accessibilityHint.length} chars, max ${accessibilityConfig.screenReader.maxHintLength})`,
        element: context || 'Unknown element',
      });
      recommendations.push('Shorten accessibilityHint');
    }

    // Test accessibility role
    if (!element.accessibilityRole) {
      issues.push({
        type: 'warning',
        category: 'role',
        message: 'Missing accessibilityRole',
        element: context || 'Unknown element',
        wcagCriteria: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
      });
      recommendations.push('Add appropriate accessibilityRole');
    }

    // Test touch target size
    if (element.style) {
      const touchTargetIssues = accessibilityTesting.testTouchTargetSize(element.style);
      issues.push(...touchTargetIssues);
      if (touchTargetIssues.length > 0) {
        recommendations.push('Increase touch target size to meet minimum requirements');
      }
    }

    // Calculate score
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 10));

    return {
      passed: errorCount === 0,
      issues,
      score,
      recommendations,
    };
  },

  /**
   * Test touch target size compliance
   */
  testTouchTargetSize: (style: ViewStyle | TextStyle | ImageStyle): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const minSize = accessibilityConfig.touchTargets.minimum;
    const pixelRatio = PixelRatio.get();

    // Convert dimensions to pixels - ensure they are numbers
    const width = typeof style.width === 'number' ? style.width * pixelRatio : null;
    const height = typeof style.height === 'number' ? style.height * pixelRatio : null;

    if (width && width < minSize) {
      issues.push({
        type: 'error',
        category: 'touch-target',
        message: `Touch target width (${width}px) is below minimum (${minSize}px)`,
        wcagCriteria: 'WCAG 2.1 - 2.5.5 Target Size',
      });
    }

    if (height && height < minSize) {
      issues.push({
        type: 'error',
        category: 'touch-target',
        message: `Touch target height (${height}px) is below minimum (${minSize}px)`,
        wcagCriteria: 'WCAG 2.1 - 2.5.5 Target Size',
      });
    }

    return issues;
  },

  /**
   * Test color contrast ratio
   */
  testColorContrast: (
    foregroundColor: string,
    backgroundColor: string,
    isLargeText: boolean = false
  ): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const contrastRatio = accessibilityTesting.calculateContrastRatio(foregroundColor, backgroundColor);
    const minRatio = accessibilityConfig.helpers.getMinimumContrastRatio(isLargeText);

    if (contrastRatio < minRatio) {
      issues.push({
        type: 'error',
        category: 'contrast',
        message: `Color contrast ratio (${contrastRatio.toFixed(2)}:1) is below minimum (${minRatio}:1)`,
        wcagCriteria: 'WCAG 2.1 - 1.4.3 Contrast (Minimum)',
      });
    }

    return issues;
  },

  /**
   * Calculate color contrast ratio
   */
  calculateContrastRatio: (color1: string, color2: string): number => {
    const luminance1 = accessibilityTesting.calculateLuminance(color1);
    const luminance2 = accessibilityTesting.calculateLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Calculate relative luminance of a color
   */
  calculateLuminance: (color: string): number => {
    const rgb = accessibilityTesting.parseColor(color);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Parse color string to RGB values
   */
  parseColor: (color: string): [number, number, number] => {
    // Simple hex color parsing (supports #RGB and #RRGGBB)
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16),
        ];
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    }
    
    // Default to black if parsing fails
    return [0, 0, 0];
  },

  /**
   * Test form accessibility
   */
  testFormAccessibility: (fields: ElementAccessibilityProps[]): AccessibilityTestResult => {
    const allIssues: AccessibilityIssue[] = [];
    const allRecommendations: string[] = [];

    fields.forEach((field, index) => {
      const result = accessibilityTesting.testElementAccessibility(field, `Form field ${index + 1}`);
      allIssues.push(...result.issues);
      allRecommendations.push(...result.recommendations);
    });

    // Check for form-specific issues
    const hasSubmitButton = fields.some(field => 
      field.accessibilityRole === 'button' && 
      field.accessibilityLabel?.toLowerCase().includes('submit')
    );

    if (!hasSubmitButton) {
      allIssues.push({
        type: 'warning',
        category: 'role',
        message: 'Form may be missing a submit button',
        wcagCriteria: 'WCAG 2.1 - 3.2.2 On Input',
      });
      allRecommendations.push('Add a clear submit button');
    }

    const errorCount = allIssues.filter(i => i.type === 'error').length;
    const warningCount = allIssues.filter(i => i.type === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 10));

    return {
      passed: errorCount === 0,
      issues: allIssues,
      score,
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
    };
  },

  /**
   * Test screen reader compatibility
   */
  testScreenReaderCompatibility: async (): Promise<{
    isEnabled: boolean;
    isReduceMotionEnabled: boolean;
    isReduceTransparencyEnabled: boolean;
    recommendations: string[];
  }> => {
    const recommendations: string[] = [];
    
    const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    const isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();

    if (isEnabled) {
      recommendations.push('Screen reader is active - ensure all interactive elements have proper labels');
    }

    if (isReduceMotionEnabled) {
      recommendations.push('Reduce motion is enabled - minimize or disable animations');
    }

    if (isReduceTransparencyEnabled) {
      recommendations.push('Reduce transparency is enabled - use solid colors instead of transparent overlays');
    }

    return {
      isEnabled,
      isReduceMotionEnabled,
      isReduceTransparencyEnabled,
      recommendations,
    };
  },

  /**
   * Generate accessibility report
   */
  generateReport: (testResults: AccessibilityTestResult[]): string => {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.passed).length;
    const averageScore = testResults.reduce((sum, r) => sum + r.score, 0) / totalTests;
    
    const allIssues = testResults.flatMap(r => r.issues);
    const errorCount = allIssues.filter(i => i.type === 'error').length;
    const warningCount = allIssues.filter(i => i.type === 'warning').length;
    
    const allRecommendations = testResults.flatMap(r => r.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return `
Accessibility Test Report
========================

Summary:
- Tests passed: ${passedTests}/${totalTests}
- Average score: ${averageScore.toFixed(1)}/100
- Errors: ${errorCount}
- Warnings: ${warningCount}

Issues by Category:
${accessibilityTesting.groupIssuesByCategory(allIssues)}

Recommendations:
${uniqueRecommendations.map(r => `- ${r}`).join('\n')}

WCAG 2.1 Compliance: ${errorCount === 0 ? 'PASSED' : 'FAILED'}
    `.trim();
  },

  /**
   * Group issues by category for reporting
   */
  groupIssuesByCategory: (issues: AccessibilityIssue[]): string => {
    const categories = ['contrast', 'touch-target', 'label', 'role', 'state', 'focus'] as const;
    
    return categories.map(category => {
      const categoryIssues = issues.filter(i => i.category === category);
      if (categoryIssues.length === 0) return '';
      
      return `
${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}:
${categoryIssues.map(i => `  - ${i.message}`).join('\n')}
      `.trim();
    }).filter(Boolean).join('\n\n');
  },
};