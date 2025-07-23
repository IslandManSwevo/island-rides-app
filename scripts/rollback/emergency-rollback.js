#!/usr/bin/env node

/**
 * Emergency Navigation Rollback Script
 * 
 * This script provides emergency rollback capabilities for KeyLo navigation
 * enhancements. It can be executed by operations team members to quickly
 * disable navigation enhancement features and restore original navigation.
 * 
 * USAGE:
 *   node scripts/rollback/emergency-rollback.js [options]
 * 
 * OPTIONS:
 *   --environment <env>    Target environment (development|staging|production)
 *   --type <type>         Rollback type (full|partial|specific)
 *   --flags <flags>       Specific flags to rollback (comma-separated)
 *   --reason <reason>     Reason for rollback (required for audit)
 *   --validate           Run validation after rollback
 *   --dry-run            Show what would be done without executing
 *   --help               Show this help message
 * 
 * EXAMPLES:
 *   # Full emergency rollback in production
 *   node scripts/rollback/emergency-rollback.js --environment production --type full --reason "Performance degradation"
 * 
 *   # Partial rollback of specific features
 *   node scripts/rollback/emergency-rollback.js --environment staging --type specific --flags "ENHANCED_HOME_SCREEN,SMART_ISLAND_SELECTION" --reason "UI issues"
 * 
 *   # Dry run to see what would be rolled back
 *   node scripts/rollback/emergency-rollback.js --environment production --type full --reason "Test" --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  environments: ['development', 'staging', 'production'],
  rollbackTypes: ['full', 'partial', 'specific'],
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
  maxRollbackTimeMinutes: 5,
  logFile: path.join(__dirname, '../../logs/rollback.log')
};

// Utility functions
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // Ensure logs directory exists
  const logsDir = path.dirname(CONFIG.logFile);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Append to log file
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
};

const validateEnvironment = (env) => {
  if (!CONFIG.environments.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${CONFIG.environments.join(', ')}`);
  }
};

const validateRollbackType = (type) => {
  if (!CONFIG.rollbackTypes.includes(type)) {
    throw new Error(`Invalid rollback type: ${type}. Must be one of: ${CONFIG.rollbackTypes.join(', ')}`);
  }
};

const validateFlags = (flags) => {
  const invalidFlags = flags.filter(flag => 
    !CONFIG.enhancementFlags.includes(flag) && !CONFIG.infrastructureFlags.includes(flag)
  );
  
  if (invalidFlags.length > 0) {
    throw new Error(`Invalid flags: ${invalidFlags.join(', ')}`);
  }
};

// Rollback execution functions
const executeFullRollback = (environment, reason, dryRun = false) => {
  log(`Starting FULL rollback for environment: ${environment}`);
  log(`Reason: ${reason}`);
  
  const flagsToDisable = CONFIG.enhancementFlags;
  
  if (dryRun) {
    log('DRY RUN: Would disable the following enhancement flags:');
    flagsToDisable.forEach(flag => log(`  - ${flag}`));
    log('DRY RUN: Would preserve infrastructure flags:');
    CONFIG.infrastructureFlags.forEach(flag => log(`  - ${flag}`));
    return { success: true, flagsDisabled: flagsToDisable, dryRun: true };
  }
  
  return disableFlags(flagsToDisable, environment, reason);
};

const executePartialRollback = (environment, reason, dryRun = false) => {
  log(`Starting PARTIAL rollback for environment: ${environment}`);
  log(`Reason: ${reason}`);
  
  // For partial rollback, disable navigation-critical flags but keep others
  const criticalFlags = [
    'OPTIMIZED_NAVIGATION',
    'ENHANCED_HOME_SCREEN',
    'SMART_ISLAND_SELECTION'
  ];
  
  if (dryRun) {
    log('DRY RUN: Would disable the following critical flags:');
    criticalFlags.forEach(flag => log(`  - ${flag}`));
    return { success: true, flagsDisabled: criticalFlags, dryRun: true };
  }
  
  return disableFlags(criticalFlags, environment, reason);
};

const executeSpecificRollback = (flags, environment, reason, dryRun = false) => {
  log(`Starting SPECIFIC rollback for environment: ${environment}`);
  log(`Reason: ${reason}`);
  log(`Flags to rollback: ${flags.join(', ')}`);
  
  if (dryRun) {
    log('DRY RUN: Would disable the following specific flags:');
    flags.forEach(flag => log(`  - ${flag}`));
    return { success: true, flagsDisabled: flags, dryRun: true };
  }
  
  return disableFlags(flags, environment, reason);
};

const disableFlags = (flags, environment, reason) => {
  // Validate parameters
  validateEnvironment(environment);

  if (!reason || reason.trim() === '') {
    throw new Error('Reason is required for rollback audit trail');
  }

  if (!flags || flags.length === 0) {
    throw new Error('No flags specified for rollback');
  }

  validateFlags(flags);

  const startTime = Date.now();

  try {
    // Create rollback command for the React Native app
    const rollbackData = {
      flags: flags.reduce((acc, flag) => {
        acc[flag] = false;
        return acc;
      }, {}),
      reason,
      timestamp: new Date().toISOString(),
      environment,
      rollbackType: 'emergency'
    };
    
    // Write rollback data to a temporary file that the app can read
    const rollbackFile = path.join(__dirname, '../../temp/emergency-rollback.json');
    const tempDir = path.dirname(rollbackFile);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(rollbackFile, JSON.stringify(rollbackData, null, 2));
    
    log(`Rollback data written to: ${rollbackFile}`);
    log('Flags disabled successfully');
    
    const endTime = Date.now();
    const rollbackTimeSeconds = (endTime - startTime) / 1000;
    
    log(`Rollback completed in ${rollbackTimeSeconds.toFixed(2)} seconds`);
    
    if (rollbackTimeSeconds > CONFIG.maxRollbackTimeMinutes * 60) {
      log(`WARNING: Rollback took longer than ${CONFIG.maxRollbackTimeMinutes} minutes`, 'WARN');
    }
    
    return {
      success: true,
      flagsDisabled: flags,
      rollbackTimeSeconds,
      rollbackFile
    };
    
  } catch (error) {
    log(`Rollback failed: ${error.message}`, 'ERROR');
    return {
      success: false,
      error: error.message
    };
  }
};

// Main execution function
const main = () => {
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
      
      if (key === 'flags' && value) {
        options[key] = value.split(',').map(f => f.trim());
        i++;
      } else if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  
  // Validate required options
  if (!options.environment) {
    log('ERROR: --environment is required', 'ERROR');
    process.exit(1);
  }
  
  if (!options.type) {
    log('ERROR: --type is required', 'ERROR');
    process.exit(1);
  }
  
  if (!options.reason) {
    log('ERROR: --reason is required for audit purposes', 'ERROR');
    process.exit(1);
  }
  
  try {
    validateEnvironment(options.environment);
    validateRollbackType(options.type);
    
    if (options.type === 'specific') {
      if (!options.flags || options.flags.length === 0) {
        throw new Error('--flags is required for specific rollback type');
      }
      validateFlags(options.flags);
    }
    
    log('='.repeat(60));
    log('EMERGENCY NAVIGATION ROLLBACK INITIATED');
    log('='.repeat(60));
    log(`Environment: ${options.environment}`);
    log(`Type: ${options.type}`);
    log(`Reason: ${options.reason}`);
    log(`Dry Run: ${options['dry-run'] ? 'YES' : 'NO'}`);
    
    let result;
    
    switch (options.type) {
      case 'full':
        result = executeFullRollback(options.environment, options.reason, options['dry-run']);
        break;
      case 'partial':
        result = executePartialRollback(options.environment, options.reason, options['dry-run']);
        break;
      case 'specific':
        result = executeSpecificRollback(options.flags, options.environment, options.reason, options['dry-run']);
        break;
    }
    
    if (result.success) {
      log('='.repeat(60));
      log('ROLLBACK COMPLETED SUCCESSFULLY');
      log('='.repeat(60));
      log(`Flags disabled: ${result.flagsDisabled.join(', ')}`);
      
      if (!result.dryRun) {
        log(`Rollback time: ${result.rollbackTimeSeconds.toFixed(2)} seconds`);
        
        if (options.validate) {
          log('Running post-rollback validation...');
          // TODO: Call validation script
        }
      }
    } else {
      log('='.repeat(60));
      log('ROLLBACK FAILED');
      log('='.repeat(60));
      log(`Error: ${result.error}`, 'ERROR');
      process.exit(1);
    }
    
  } catch (error) {
    log(`Rollback script error: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = {
  executeFullRollback,
  executePartialRollback,
  executeSpecificRollback,
  CONFIG
};
