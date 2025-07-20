#!/usr/bin/env node

/**
 * Island Rides Development Toolkit
 * Provides enhanced console output with colors, logging utilities, and development helpers
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

// Enhanced Colors Configuration
const colors = (() => {
  'use strict';
  
  // ANSI color codes - single source of truth
  const codes = Object.freeze({
    reset: '\x1b[0m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m'
  });
  
  // Cache for color support detection
  let _colorSupport = null;
  
  // Detect color support
  const isColorSupported = () => {
    if (_colorSupport !== null) return _colorSupport;
    
    // Check environment
    if (process.env.NODE_ENV === 'test' || 
        process.env.CI || 
        process.env.TERM === 'dumb' ||
        !process.stdout?.isTTY) {
      _colorSupport = false;
      return false;
    }
    
    // Windows 10+ support
    if (process.platform === 'win32') {
      const os = require('os');
      const [major, , build] = os.release().split('.').map(Number);
      _colorSupport = major > 10 || (major === 10 && build >= 10586);
      return _colorSupport;
    }
    
    _colorSupport = true;
    return true;
  };
  
  // Safe color application
  const applyColor = (text, colorName) => {
    if (!isColorSupported()) return String(text);
    if (!text || typeof text !== 'string') return String(text);
    
    const colorCode = codes[colorName];
    if (!colorCode) {
      console.warn(`Invalid color: ${colorName}`);
      return text;
    }
    
    return `${colorCode}${text}${codes.reset}`;
  };
  
  // Create color functions
  const colorFunctions = {};
  Object.keys(codes).forEach(key => {
    colorFunctions[key] = (text) => applyColor(text, key);
  });
  
  return {
    ...codes,
    ...colorFunctions,
    isSupported: isColorSupported,
    apply: applyColor
  };
})();

// Enhanced logging with color validation
function log(message, colorName = 'white') {
  console.log(colors.apply(message, colorName));
}

// Improved command runner with better error handling
function runCommand(command, description, options = {}) {
  const { showOutput = false, timeout = 300000 } = options;
  
  log(`\n🔄 ${description}...`, 'cyan');
  
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: showOutput ? 'inherit' : 'pipe',
      encoding: 'utf8',
      timeout,
      env: { ...process.env, FORCE_COLOR: colors.isSupported() ? '1' : '0' }
    });
    
    log(`✅ ${description} completed successfully`, 'green');
    return { success: true, output: output?.trim() || '' };
  } catch (error) {
    const errorMessage = error.stdout || error.stderr || error.message;
    log(`❌ ${description} failed:`, 'red');
    
    if (errorMessage) {
      log(errorMessage, 'red');
    }
    
    return { 
      success: false, 
      error,
      message: errorMessage 
    };
  }
}

function main() {
  console.log(colors.magenta('🚀 KeyLo Development Toolkit'));
  console.log(colors.magenta('===================================='));
  
  const mode = process.argv[2] || 'check';
  
  switch (mode) {
    case 'check':
      log('🔍 Running comprehensive code analysis...', 'blue');
      
      // 1. Check for 'any' issues
      log('\n📋 Step 1: Analyzing TypeScript \'any\' usage', 'yellow');
      runCommand('node scripts/fix-any-issues.js --dry-run', 'TypeScript any analysis');
      
      // 2. Run strict TypeScript check
      log('\n📋 Step 2: Running strict TypeScript compilation', 'yellow');
      runCommand('npx tsc --noEmit --project tsconfig.strict.json', 'Strict TypeScript check');
      
      // 3. Run regular TypeScript check
      log('\n📋 Step 3: Running standard TypeScript compilation', 'yellow');
      runCommand('npx tsc --noEmit', 'Standard TypeScript check');
      
      log('\n💡 To fix issues, run: npm run dev:fix', 'cyan');
      break;
      
    case 'fix':
      log('🔧 Running automated fixes...', 'blue');
      
      // 1. Fix 'any' issues
      log('\n📋 Step 1: Fixing TypeScript \'any\' issues', 'yellow');
      const fixResult = runCommand('node scripts/fix-any-issues.js --fix --verbose', 'TypeScript any fixes');
      
      if (fixResult.success) {
        // 2. Run TypeScript check after fixes
        log('\n📋 Step 2: Verifying fixes with TypeScript compilation', 'yellow');
        runCommand('npx tsc --noEmit', 'Post-fix TypeScript check');
        
        log('\n✨ Fix process completed! Consider running tests next.', 'green');
        log('💡 Run: npm test', 'cyan');
      }
      break;
      
    case 'test':
      log('🧪 Running test suite...', 'blue');
      
      // 1. TypeScript check
      runCommand('npx tsc --noEmit', 'TypeScript compilation');
      
      // 2. Run tests (if available)
      try {
        runCommand('npm test', 'Unit tests');
      } catch (error) {
        log('ℹ️  No test script found or tests failed', 'yellow');
      }
      break;
      
    case 'dev':
      log('🏃‍♂️ Starting development environment...', 'blue');
      
      // 1. Quick TypeScript check
      const tsCheck = runCommand('npx tsc --noEmit', 'TypeScript compilation check');
      
      if (tsCheck.success) {
        // 2. Start development server
        log('\n🚀 Starting development server...', 'cyan');
        try {
          execSync('npm start', { stdio: 'inherit' });
        } catch (error) {
          log('Development server stopped', 'yellow');
        }
      } else {
        log('\n❌ TypeScript errors found. Fix them first with: npm run dev:fix', 'red');
      }
      break;
      
    case 'help':
    default:
      console.log(`
${colors.cyan('KeyLo Development Toolkit')}
${colors.cyan('========================')}
Usage: node dev-toolkit.js [command]

Commands:
  check  - Run comprehensive code analysis
  fix    - Run automated fixes
  test   - Run test suite
  dev    - Start development environment
  help   - Show this help message

Examples:
  node dev-toolkit.js check
  node dev-toolkit.js fix
  node dev-toolkit.js dev
      `);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { colors, log, runCommand };
