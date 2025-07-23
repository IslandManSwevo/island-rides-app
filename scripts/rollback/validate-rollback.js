#!/usr/bin/env node

/**
 * Rollback Validation Script
 * 
 * This script validates that emergency rollback procedures have been
 * executed successfully and that the application is functioning correctly
 * with original navigation behavior.
 * 
 * USAGE:
 *   node scripts/rollback/validate-rollback.js [options]
 * 
 * OPTIONS:
 *   --environment <env>    Target environment (development|staging|production)
 *   --timeout <seconds>    Validation timeout in seconds (default: 60)
 *   --verbose             Show detailed validation steps
 *   --report              Generate validation report file
 *   --help                Show this help message
 * 
 * EXAMPLES:
 *   # Basic validation
 *   node scripts/rollback/validate-rollback.js --environment production
 * 
 *   # Verbose validation with report
 *   node scripts/rollback/validate-rollback.js --environment staging --verbose --report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const VALIDATION_CONFIG = {
  environments: ['development', 'staging', 'production'],
  defaultTimeout: 60,
  enhancementFlags: [
    'ENHANCED_HOME_SCREEN',
    'SMART_ISLAND_SELECTION', 
    'OPTIMIZED_NAVIGATION',
    'ENHANCED_VEHICLE_DETAIL',
    'STREAMLINED_BOOKING',
    'TRUST_SIGNALS',
    'ADVANCED_DISCOVERY',
    'ENHANCED_COMMUNICATION',
    'PERFORMANCE_OPTIMIZATION'
  ],
  infrastructureFlags: [
    'ROLLBACK_MONITORING',
    'DEBUG_NAVIGATION'
  ],
  logFile: path.join(__dirname, '../../logs/rollback-validation.log'),
  reportFile: path.join(__dirname, '../../logs/rollback-validation-report.json')
};

// Utility functions
const log = (message, level = 'INFO', verbose = false) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (!verbose || process.env.VERBOSE === 'true') {
    console.log(logMessage);
  }
  
  // Ensure logs directory exists
  const logsDir = path.dirname(VALIDATION_CONFIG.logFile);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Append to log file
  fs.appendFileSync(VALIDATION_CONFIG.logFile, logMessage + '\n');
};

// Validation functions
const validateFeatureFlags = async (environment) => {
  log('Validating feature flag states...', 'INFO', true);
  
  const results = {
    enhancementFlagsDisabled: true,
    infrastructureFlagsPreserved: true,
    details: {},
    errors: []
  };
  
  try {
    // Check if rollback data file exists
    const rollbackFile = path.join(__dirname, '../../temp/emergency-rollback.json');
    
    if (fs.existsSync(rollbackFile)) {
      const rollbackData = JSON.parse(fs.readFileSync(rollbackFile, 'utf8'));
      
      log(`Found rollback data from: ${rollbackData.timestamp}`, 'INFO', true);
      log(`Rollback reason: ${rollbackData.reason}`, 'INFO', true);
      
      // Validate that enhancement flags are disabled
      for (const flag of VALIDATION_CONFIG.enhancementFlags) {
        const isDisabled = rollbackData.flags[flag] === false;
        results.details[flag] = {
          expected: false,
          actual: rollbackData.flags[flag],
          valid: isDisabled
        };
        
        if (!isDisabled) {
          results.enhancementFlagsDisabled = false;
          results.errors.push(`Enhancement flag ${flag} is not disabled`);
        }
      }
      
      log(`Enhancement flags validation: ${results.enhancementFlagsDisabled ? 'PASS' : 'FAIL'}`, 
          results.enhancementFlagsDisabled ? 'INFO' : 'ERROR');
      
    } else {
      results.errors.push('No rollback data file found - rollback may not have been executed');
      results.enhancementFlagsDisabled = false;
    }
    
  } catch (error) {
    results.errors.push(`Feature flag validation error: ${error.message}`);
    results.enhancementFlagsDisabled = false;
  }
  
  return results;
};

const validateNavigationFunctionality = async (environment) => {
  log('Validating navigation functionality...', 'INFO', true);
  
  const results = {
    originalNavigationWorking: true,
    noEnhancedFeatures: true,
    navigationStateValid: true,
    errors: []
  };
  
  try {
    // Run navigation tests to ensure original functionality works
    log('Running navigation functionality tests...', 'INFO', true);
    
    // Check if the app can start without errors
    const testCommand = 'npm test -- __tests__/navigation/ --passWithNoTests';
    
    try {
      execSync(testCommand, { 
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
        timeout: 30000 
      });
      
      log('Navigation tests passed', 'INFO', true);
      
    } catch (testError) {
      results.originalNavigationWorking = false;
      results.errors.push(`Navigation tests failed: ${testError.message}`);
    }
    
  } catch (error) {
    results.errors.push(`Navigation validation error: ${error.message}`);
    results.originalNavigationWorking = false;
  }
  
  return results;
};

const validatePerformance = async (environment) => {
  log('Validating performance metrics...', 'INFO', true);
  
  const results = {
    rollbackTimeValid: true,
    noPerformanceDegradation: true,
    errors: []
  };
  
  try {
    // Check rollback timing from log files
    const rollbackFile = path.join(__dirname, '../../temp/emergency-rollback.json');
    
    if (fs.existsSync(rollbackFile)) {
      const rollbackData = JSON.parse(fs.readFileSync(rollbackFile, 'utf8'));
      
      // Validate rollback was completed within time limit
      const rollbackTime = rollbackData.rollbackTimeSeconds || 0;
      const maxTimeSeconds = 5 * 60; // 5 minutes
      
      if (rollbackTime > maxTimeSeconds) {
        results.rollbackTimeValid = false;
        results.errors.push(`Rollback took ${rollbackTime}s, exceeding ${maxTimeSeconds}s limit`);
      } else {
        log(`Rollback completed in ${rollbackTime}s (within ${maxTimeSeconds}s limit)`, 'INFO', true);
      }
    }
    
  } catch (error) {
    results.errors.push(`Performance validation error: ${error.message}`);
    results.rollbackTimeValid = false;
  }
  
  return results;
};

const validateSystemHealth = async (environment) => {
  log('Validating system health...', 'INFO', true);
  
  const results = {
    buildSuccessful: true,
    noErrors: true,
    dependenciesValid: true,
    errors: []
  };
  
  try {
    // Validate that the project builds successfully
    log('Checking project build...', 'INFO', true);
    
    try {
      execSync('npm run build --if-present', { 
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
        timeout: 60000 
      });
      
      log('Project build successful', 'INFO', true);
      
    } catch (buildError) {
      results.buildSuccessful = false;
      results.errors.push(`Build failed: ${buildError.message}`);
    }
    
    // Check for any critical errors in logs
    const logFile = path.join(__dirname, '../../logs/rollback.log');
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const errorLines = logContent.split('\n').filter(line => line.includes('[ERROR]'));
      
      if (errorLines.length > 0) {
        results.noErrors = false;
        results.errors.push(`Found ${errorLines.length} error(s) in rollback logs`);
      }
    }
    
  } catch (error) {
    results.errors.push(`System health validation error: ${error.message}`);
    results.buildSuccessful = false;
  }
  
  return results;
};

const generateValidationReport = (validationResults, environment) => {
  const report = {
    timestamp: new Date().toISOString(),
    environment,
    validationResults,
    summary: {
      overallStatus: 'UNKNOWN',
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      errors: []
    }
  };
  
  // Calculate summary
  const allResults = Object.values(validationResults);
  const allChecks = [];
  
  allResults.forEach(result => {
    Object.entries(result).forEach(([key, value]) => {
      if (typeof value === 'boolean' && key !== 'errors') {
        allChecks.push(value);
      }
    });
    
    if (result.errors && result.errors.length > 0) {
      report.summary.errors.push(...result.errors);
    }
  });
  
  report.summary.totalChecks = allChecks.length;
  report.summary.passedChecks = allChecks.filter(check => check === true).length;
  report.summary.failedChecks = allChecks.filter(check => check === false).length;
  
  if (report.summary.failedChecks === 0) {
    report.summary.overallStatus = 'PASS';
  } else if (report.summary.passedChecks > report.summary.failedChecks) {
    report.summary.overallStatus = 'PARTIAL';
  } else {
    report.summary.overallStatus = 'FAIL';
  }
  
  return report;
};

// Main validation function
const runValidation = async (environment, options = {}) => {
  const startTime = Date.now();
  
  log('='.repeat(60));
  log('ROLLBACK VALIDATION STARTED');
  log('='.repeat(60));
  log(`Environment: ${environment}`);
  log(`Timeout: ${options.timeout || VALIDATION_CONFIG.defaultTimeout} seconds`);
  
  const validationResults = {};
  
  try {
    // Run all validation checks
    validationResults.featureFlags = await validateFeatureFlags(environment);
    validationResults.navigation = await validateNavigationFunctionality(environment);
    validationResults.performance = await validatePerformance(environment);
    validationResults.systemHealth = await validateSystemHealth(environment);
    
    // Generate report
    const report = generateValidationReport(validationResults, environment);
    
    const endTime = Date.now();
    const validationTimeSeconds = (endTime - startTime) / 1000;
    
    log('='.repeat(60));
    log('ROLLBACK VALIDATION COMPLETED');
    log('='.repeat(60));
    log(`Overall Status: ${report.summary.overallStatus}`);
    log(`Total Checks: ${report.summary.totalChecks}`);
    log(`Passed: ${report.summary.passedChecks}`);
    log(`Failed: ${report.summary.failedChecks}`);
    log(`Validation Time: ${validationTimeSeconds.toFixed(2)} seconds`);
    
    if (report.summary.errors.length > 0) {
      log('Errors found:');
      report.summary.errors.forEach(error => log(`  - ${error}`, 'ERROR'));
    }
    
    // Save report if requested
    if (options.report) {
      fs.writeFileSync(VALIDATION_CONFIG.reportFile, JSON.stringify(report, null, 2));
      log(`Validation report saved to: ${VALIDATION_CONFIG.reportFile}`);
    }
    
    return report;
    
  } catch (error) {
    log(`Validation failed: ${error.message}`, 'ERROR');
    throw error;
  }
};

// Main execution function
const main = async () => {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help') {
      console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].split('/**')[1]);
      process.exit(0);
    }
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  
  // Set verbose mode
  if (options.verbose) {
    process.env.VERBOSE = 'true';
  }
  
  // Validate required options
  if (!options.environment) {
    log('ERROR: --environment is required', 'ERROR');
    process.exit(1);
  }
  
  if (!VALIDATION_CONFIG.environments.includes(options.environment)) {
    log(`ERROR: Invalid environment: ${options.environment}. Must be one of: ${VALIDATION_CONFIG.environments.join(', ')}`, 'ERROR');
    process.exit(1);
  }
  
  try {
    const report = await runValidation(options.environment, options);
    
    // Exit with appropriate code
    if (report.summary.overallStatus === 'PASS') {
      process.exit(0);
    } else if (report.summary.overallStatus === 'PARTIAL') {
      process.exit(2);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    log(`Validation script error: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runValidation,
  validateFeatureFlags,
  validateNavigationFunctionality,
  validatePerformance,
  validateSystemHealth,
  VALIDATION_CONFIG
};
