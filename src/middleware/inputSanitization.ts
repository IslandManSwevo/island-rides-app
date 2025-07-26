/**
 * Input Sanitization Middleware
 * Provides XSS prevention and input sanitization for API requests and form data
 */

import { sanitizeInput } from '../utils/validation';

// HTML entities for encoding
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

// SQL injection patterns to detect and prevent
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|\/\*|\*\/|;|'|"|`)/g,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
  /(\bOR\b|\bAND\b)\s+['"].*['"].*=/gi,
];

// XSS patterns to detect and prevent
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
];

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowSql?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  removeNullBytes?: boolean;
  preventPathTraversal?: boolean;
}

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  threats: string[];
}

/**
 * Encodes HTML entities to prevent XSS
 */
export const encodeHtmlEntities = (input: string): string => {
  return input.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match);
};

/**
 * Detects potential SQL injection attempts
 */
export const detectSqlInjection = (input: string): boolean => {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Detects potential XSS attempts
 */
export const detectXss = (input: string): boolean => {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Detects path traversal attempts
 */
export const detectPathTraversal = (input: string): boolean => {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Comprehensive input sanitization
 */
export const sanitizeUserInput = (
  input: string,
  options: SanitizationOptions = {}
): SanitizationResult => {
  const {
    allowHtml = false,
    allowSql = false,
    maxLength = 10000,
    trimWhitespace = true,
    removeNullBytes = true,
    preventPathTraversal = true,
  } = options;

  let sanitized = input;
  let wasModified = false;
  const threats: string[] = [];

  // Handle null or undefined input
  if (!sanitized) {
    return { sanitized: '', wasModified: false, threats: [] };
  }

  // Convert to string if not already
  if (typeof sanitized !== 'string') {
    sanitized = String(sanitized);
    wasModified = true;
  }

  // Remove null bytes
  if (removeNullBytes && sanitized.includes('\0')) {
    sanitized = sanitized.replace(/\0/g, '');
    wasModified = true;
    threats.push('null_bytes');
  }

  // Trim whitespace
  if (trimWhitespace) {
    const trimmed = sanitized.trim();
    if (trimmed !== sanitized) {
      sanitized = trimmed;
      wasModified = true;
    }
  }

  // Check for SQL injection
  if (!allowSql && detectSqlInjection(sanitized)) {
    threats.push('sql_injection');
    // Remove SQL injection patterns
    SQL_INJECTION_PATTERNS.forEach(pattern => {
      const cleaned = sanitized.replace(pattern, '');
      if (cleaned !== sanitized) {
        sanitized = cleaned;
        wasModified = true;
      }
    });
  }

  // Check for XSS
  if (!allowHtml && detectXss(sanitized)) {
    threats.push('xss');
    // Remove XSS patterns
    XSS_PATTERNS.forEach(pattern => {
      const cleaned = sanitized.replace(pattern, '');
      if (cleaned !== sanitized) {
        sanitized = cleaned;
        wasModified = true;
      }
    });
  }

  // Check for path traversal
  if (preventPathTraversal && detectPathTraversal(sanitized)) {
    threats.push('path_traversal');
    // Remove path traversal patterns
    PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
      const cleaned = sanitized.replace(pattern, '');
      if (cleaned !== sanitized) {
        sanitized = cleaned;
        wasModified = true;
      }
    });
  }

  // Encode HTML entities if HTML is not allowed
  if (!allowHtml) {
    const encoded = encodeHtmlEntities(sanitized);
    if (encoded !== sanitized) {
      sanitized = encoded;
      wasModified = true;
    }
  }

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    wasModified = true;
    threats.push('length_exceeded');
  }

  // Additional cleanup - remove excessive whitespace
  const cleanedWhitespace = sanitized.replace(/\s+/g, ' ');
  if (cleanedWhitespace !== sanitized) {
    sanitized = cleanedWhitespace;
    wasModified = true;
  }

  return { sanitized, wasModified, threats };
};

/**
 * Sanitizes an object recursively
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  options: SanitizationOptions = {}
): { sanitized: T; threats: Record<string, string[]> } => {
  const sanitized = {} as T;
  const threats: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const result = sanitizeUserInput(value, options);
      sanitized[key as keyof T] = result.sanitized as T[keyof T];
      if (result.threats.length > 0) {
        threats[key] = result.threats;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const result = sanitizeObject(value, options);
      sanitized[key as keyof T] = result.sanitized as T[keyof T];
      if (Object.keys(result.threats).length > 0) {
        threats[key] = Object.values(result.threats).flat();
      }
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return { sanitized, threats };
};

/**
 * Middleware for API requests
 */
export const createSanitizationMiddleware = (options: SanitizationOptions = {}) => {
  return (data: any) => {
    if (typeof data === 'string') {
      const result = sanitizeUserInput(data, options);
      if (result.threats.length > 0) {
        console.warn('Security threats detected and sanitized:', result.threats);
      }
      return result.sanitized;
    }

    if (typeof data === 'object' && data !== null) {
      const result = sanitizeObject(data, options);
      const allThreats = Object.values(result.threats).flat();
      if (allThreats.length > 0) {
        console.warn('Security threats detected and sanitized:', result.threats);
      }
      return result.sanitized;
    }

    return data;
  };
};

/**
 * Express-like middleware for request sanitization
 */
export const sanitizeRequestData = (
  requestData: any,
  options: SanitizationOptions = {}
): any => {
  const middleware = createSanitizationMiddleware(options);
  return middleware(requestData);
};

// Default sanitization options for different contexts
export const SANITIZATION_PRESETS = {
  // For user input forms
  userInput: {
    allowHtml: false,
    allowSql: false,
    maxLength: 1000,
    trimWhitespace: true,
    removeNullBytes: true,
    preventPathTraversal: true,
  },
  
  // For search queries
  searchQuery: {
    allowHtml: false,
    allowSql: false,
    maxLength: 500,
    trimWhitespace: true,
    removeNullBytes: true,
    preventPathTraversal: true,
  },
  
  // For file paths
  filePath: {
    allowHtml: false,
    allowSql: false,
    maxLength: 255,
    trimWhitespace: true,
    removeNullBytes: true,
    preventPathTraversal: true,
  },
  
  // For rich text content (more permissive)
  richText: {
    allowHtml: true,
    allowSql: false,
    maxLength: 50000,
    trimWhitespace: false,
    removeNullBytes: true,
    preventPathTraversal: true,
  },
} as const;
