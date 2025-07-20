#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  targetDir: process.argv.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'src',
  fix: process.argv.includes('--fix')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  if (config.verbose || color !== 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

// Statistics
const stats = {
  filesScanned: 0,
  issuesFound: 0,
  issuesFixed: 0,
  errors: 0
};

// Type mappings for fixing 'any' types
const typeMappings = {
  'navigation: any': 'navigation: NavigationProp<any>',
  'style?: any': 'style?: ViewStyle | TextStyle',
  'error: any': 'error: Error | unknown',
  'data: any': 'data: Record<string, unknown>',
  'response: any': 'response: ApiResponse<unknown>',
  'event: any': 'event: NativeSyntheticEvent<any>',
  'filters?: any': 'filters?: SearchFilters',
  'userPreferences?: any': 'userPreferences?: UserPreferences',
  'payload: any': 'payload: Record<string, unknown>',
  'details?: any': 'details?: Record<string, unknown>'
};

// Required imports for type fixes
const requiredImports = {
  'NavigationProp': "import { NavigationProp } from '@react-navigation/native';",
  'ViewStyle': "import { ViewStyle } from 'react-native';",
  'TextStyle': "import { TextStyle } from 'react-native';",
  'NativeSyntheticEvent': "import { NativeSyntheticEvent } from 'react-native';",
  'SearchFilters': "import { SearchFilters } from '../types';",
  'UserPreferences': "import { UserPreferences } from '../types';",
  'ApiResponse': "import { ApiResponse } from '../types';"
};

function getTypeScriptFiles(dirPath) {
  const files = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!item.includes('node_modules') && !item.includes('__tests__')) {
          walkDir(fullPath);
        }
      } else if (stat.isFile()) {
        if ((item.endsWith('.ts') || item.endsWith('.tsx')) && 
            !item.endsWith('.d.ts') && 
            !item.includes('.test.') && 
            !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dirPath);
  return files;
}

function findAnyUsages(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const anyUsages = [];
  
  // Patterns to find 'any' usage
  const patterns = [
    /:\s*any\b/g,           // : any
    /<any>/g,               // <any>
    /\(.*:\s*any\)/g,       // function parameters
    /as\s+any\b/g,          // as any
    /any\[\]/g,             // any[]
    /Record<string,\s*any>/g // Record<string, any>
  ];
  
  patterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      anyUsages.push({
        pattern: patterns[patternIndex].source,
        match: match[0],
        lineNumber,
        index: match.index
      });
    }
  });
  
  return anyUsages;
}

function fixCommonAnyIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixesApplied = 0;
  const importsToAdd = [];
  
  // Apply common type mappings
  Object.entries(typeMappings).forEach(([anyType, replacement]) => {
    const regex = new RegExp(anyType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      fixesApplied++;
      log(`  ✓ Fixed: ${anyType} → ${replacement}`, 'green');
      
      // Check if we need to add imports
      Object.entries(requiredImports).forEach(([importKey, importStatement]) => {
        if (replacement.includes(importKey) && !content.includes(importKey)) {
          importsToAdd.push(importStatement);
        }
      });
    }
  });
  
  // Fix specific patterns
  
  // 1. Fix error catch blocks: catch (error: any) → catch (error: unknown)
  const catchPattern = /catch\s*\(\s*(\w+):\s*any\s*\)/g;
  content = content.replace(catchPattern, 'catch ($1: unknown)');
  if (content !== originalContent) fixesApplied++;
  
  // 2. Fix function parameters with any
  const paramPattern = /(\w+):\s*any\[\]/g;
  content = content.replace(paramPattern, '$1: unknown[]');
  if (content !== originalContent) fixesApplied++;
  
  // 3. Fix Record<string, any> → Record<string, unknown>
  const recordPattern = /Record<string,\s*any>/g;
  content = content.replace(recordPattern, 'Record<string, unknown>');
  if (content !== originalContent) fixesApplied++;
  
  // 4. Fix React component props
  const propsPattern = /props:\s*any/g;
  content = content.replace(propsPattern, 'props: Record<string, unknown>');
  if (content !== originalContent) fixesApplied++;
  
  // Add required imports at the top of the file
  if (importsToAdd.length > 0) {
    const uniqueImports = [...new Set(importsToAdd)];
    const importLines = content.split('\n').filter(line => line.match(/^import/));
    const newImports = uniqueImports.join('\n');
    
    if (importLines.length > 0) {
      const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
      const afterLastImport = lastImportIndex + importLines[importLines.length - 1].length;
      content = content.slice(0, afterLastImport) + '\n' + newImports + content.slice(afterLastImport);
    } else {
      content = newImports + '\n\n' + content;
    }
    fixesApplied++;
  }
  
  return {
    content,
    fixesApplied,
    changed: content !== originalContent
  };
}

function analyzeOtherIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 1. Check for missing return types on functions
  const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    if (!match[0].includes(':')) {
      issues.push(`Function '${match[1]}' missing return type`);
    }
  }
  
  // 2. Check for console statements
  const consolePattern = /console\.(log|warn|error|info)/g;
  if (consolePattern.test(content)) {
    issues.push('Found console statements - consider using LoggingService');
  }
  
  // 3. Check for TODO/FIXME comments
  const todoPattern = /(TODO|FIXME|XXX):/gi;
  const todoMatches = content.match(todoPattern);
  if (todoMatches) {
    issues.push(`Found ${todoMatches.length} TODO/FIXME comment(s)`);
  }
  
  return issues;
}

function testTypeScriptCompilation() {
  log('🔨 Running TypeScript compilation check...', 'cyan');
  
  try {
    execSync('npx tsc --noEmit', { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    log('✅ TypeScript compilation successful!', 'green');
    return true;
  } catch (error) {
    log('❌ TypeScript compilation failed:', 'red');
    log(error.stdout?.toString() || error.message, 'red');
    return false;
  }
}

// Main execution
function main() {
  console.log(`${colors.cyan}🔍 KeyLo TypeScript Issue Fixer${colors.reset}`);
  console.log(`${colors.cyan}=======================================${colors.reset}`);
  
  const projectRoot = process.cwd();
  const srcPath = path.join(projectRoot, config.targetDir);
  
  if (!fs.existsSync(srcPath)) {
    console.error(`Source directory not found: ${srcPath}`);
    process.exit(1);
  }
  
  log(`Scanning directory: ${srcPath}`, 'yellow');
  log(`Dry run mode: ${config.dryRun}`, 'yellow');
  log(`Fix mode: ${config.fix}`, 'yellow');
  
  const files = getTypeScriptFiles(srcPath);
  log(`Found ${files.length} TypeScript files`, 'green');
  
  files.forEach(file => {
    stats.filesScanned++;
    const relativePath = path.relative(projectRoot, file);
    
    log(`\n📁 Processing: ${relativePath}`, 'cyan');
    
    try {
      // Find 'any' usages
      const anyUsages = findAnyUsages(file);
      if (anyUsages.length > 0) {
        stats.issuesFound += anyUsages.length;
        log(`  Found ${anyUsages.length} 'any' usage(s)`, 'yellow');
        
        anyUsages.forEach(usage => {
          log(`    Line ${usage.lineNumber}: ${usage.match}`, 'gray');
        });
      }
      
      // Analyze other issues
      const otherIssues = analyzeOtherIssues(file);
      if (otherIssues.length > 0) {
        otherIssues.forEach(issue => {
          log(`  ⚠️  ${issue}`, 'yellow');
        });
      }
      
      // Apply fixes
      if (config.fix && !config.dryRun) {
        const fixes = fixCommonAnyIssues(file);
        
        if (fixes.changed) {
          fs.writeFileSync(file, fixes.content);
          stats.issuesFixed += fixes.fixesApplied;
          log(`  ✅ Applied ${fixes.fixesApplied} fixes`, 'green');
        }
      } else if (config.dryRun) {
        log('  (Dry run - no changes made)', 'gray');
      }
      
    } catch (error) {
      stats.errors++;
      log(`  ❌ Error processing file: ${error.message}`, 'red');
    }
  });
  
  // Final compilation check
  if (config.fix && !config.dryRun) {
    log('\n🔍 Final TypeScript compilation check...', 'cyan');
    const compilationSuccess = testTypeScriptCompilation();
  }
  
  // Summary
  log('\n📊 Summary:', 'cyan');
  log('============', 'cyan');
  log(`Files scanned: ${stats.filesScanned}`, 'white');
  log(`Issues found: ${stats.issuesFound}`, 'yellow');
  log(`Issues fixed: ${stats.issuesFixed}`, 'green');
  log(`Errors: ${stats.errors}`, 'red');
  
  if (config.dryRun) {
    log('\n💡 Run with --fix to apply fixes', 'cyan');
  } else if (config.fix) {
    log('\n✨ Fix process completed!', 'green');
  }
  
  console.log(`\n${colors.cyan}Done! 🚀${colors.reset}`);
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
KeyLo TypeScript Issue Fixer

Usage: node fix-any-issues.js [options]

Options:
  --dry-run     Show what would be fixed without making changes
  --fix         Apply fixes to files
  --verbose     Show detailed output
  --target=DIR  Target directory (default: src)
  --help, -h    Show this help

Examples:
  node fix-any-issues.js --dry-run          # Preview fixes
  node fix-any-issues.js --fix              # Apply fixes
  node fix-any-issues.js --fix --verbose    # Apply fixes with detailed output
  `);
  process.exit(0);
}

main();
