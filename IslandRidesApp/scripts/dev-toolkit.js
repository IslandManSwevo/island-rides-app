#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    const output = execSync(command, { 
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8'
    });
    log(`✅ ${description} completed successfully`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed:`, 'red');
    log(error.stdout || error.message, 'red');
    return { success: false, error };
  }
}

function main() {
  console.log(`${colors.magenta}🚀 KeyLo Development Toolkit${colors.reset}`);
  console.log(`${colors.magenta}====================================${colors.reset}`);
  
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
${colors.cyan}KeyLo Development Toolkit${colors.reset}

Usage: node scripts/dev-toolkit.js [command]

Commands:
  ${colors.green}check${colors.reset}    Run comprehensive code analysis (default)
  ${colors.green}fix${colors.reset}      Apply automated fixes for common issues
  ${colors.green}test${colors.reset}     Run TypeScript check and tests
  ${colors.green}dev${colors.reset}      Start development server (after checks)
  ${colors.green}help${colors.reset}     Show this help message

Examples:
  ${colors.gray}node scripts/dev-toolkit.js check${colors.reset}    # Analyze code issues
  ${colors.gray}node scripts/dev-toolkit.js fix${colors.reset}      # Fix issues automatically
  ${colors.gray}node scripts/dev-toolkit.js dev${colors.reset}      # Start development

NPM Scripts:
  ${colors.gray}npm run dev:check${colors.reset}     # Same as 'check'
  ${colors.gray}npm run dev:fix${colors.reset}       # Same as 'fix'
  ${colors.gray}npm run dev:test${colors.reset}      # Same as 'test'
  ${colors.gray}npm run dev:start${colors.reset}     # Same as 'dev'

Individual Tools:
  ${colors.gray}npm run fix-any:check${colors.reset}    # Check for 'any' issues only
  ${colors.gray}npm run fix-any:fix${colors.reset}      # Fix 'any' issues only
  ${colors.gray}npm run typecheck:strict${colors.reset} # Strict TypeScript check
      `);
      break;
  }
  
  log(`\n${colors.magenta}Done! 🎉${colors.reset}`);
}

main();
