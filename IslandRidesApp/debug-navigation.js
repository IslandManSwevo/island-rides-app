/**
 * Navigation Debug Script
 * Uses the monitoring system to debug the "div div div" navigation issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Navigation Debug Session...');
console.log('📊 Using Island Rides Monitoring System');
console.log('🎯 Target Issue: Navigation "div div div" problem');
console.log('=' .repeat(60));

// Debug Information Collection
const debugInfo = {
  timestamp: new Date().toISOString(),
  issue: 'Navigation div div div problem',
  environment: {
    platform: process.platform,
    nodeVersion: process.version,
    cwd: process.cwd()
  },
  findings: [],
  recommendations: []
};

// 1. Check for common React Native navigation issues
console.log('\n1️⃣ Checking Navigation Configuration...');

const checkNavigationSetup = () => {
  const findings = [];
  
  // Check if navigation files exist
  const navFiles = [
    'src/navigation/AppNavigator.tsx',
    'src/navigation/routes.ts',
    'src/navigation/navigationRef.ts'
  ];
  
  navFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found: ${file}`);
      findings.push(`Navigation file exists: ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      findings.push(`Missing navigation file: ${file}`);
    }
  });
  
  return findings;
};

// 2. Check for Metro bundling issues
console.log('\n2️⃣ Checking Metro Bundle Status...');

const checkMetroBundle = () => {
  const findings = [];
  
  // Check for common Metro cache issues
  const cacheDirectories = [
    'node_modules/.cache',
    '.expo',
    'android/app/build',
    'ios/build'
  ];
  
  cacheDirectories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Cache directory exists: ${dir}`);
      findings.push(`Cache directory found: ${dir}`);
    }
  });
  
  // Check package.json for potential issues
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`📦 App name: ${packageJson.name}`);
      console.log(`📦 Version: ${packageJson.version}`);
      
      // Check for navigation dependencies
      const navDeps = [
        '@react-navigation/native',
        '@react-navigation/stack',
        '@react-navigation/bottom-tabs',
        'react-native-screens',
        'react-native-safe-area-context'
      ];
      
      navDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          console.log(`✅ Navigation dependency: ${dep}@${packageJson.dependencies[dep]}`);
          findings.push(`Navigation dependency OK: ${dep}`);
        } else {
          console.log(`⚠️ Missing navigation dependency: ${dep}`);
          findings.push(`Missing navigation dependency: ${dep}`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Error reading package.json: ${error.message}`);
      findings.push(`Package.json error: ${error.message}`);
    }
  }
  
  return findings;
};

// 3. Check for component rendering issues
console.log('\n3️⃣ Checking Component Structure...');

const checkComponentStructure = () => {
  const findings = [];
  
  // Check App.tsx for potential issues
  const appPath = path.join(process.cwd(), 'App.tsx');
  if (fs.existsSync(appPath)) {
    try {
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      // Check for monitoring imports
      if (appContent.includes('LoadingIssuesMonitor')) {
        console.log('✅ LoadingIssuesMonitor is imported');
        findings.push('Monitoring system is imported');
      } else {
        console.log('⚠️ LoadingIssuesMonitor not found in App.tsx');
        findings.push('Monitoring system not imported');
      }
      
      // Check for navigation container
      if (appContent.includes('NavigationContainer')) {
        console.log('✅ NavigationContainer found');
        findings.push('NavigationContainer is present');
      } else {
        console.log('❌ NavigationContainer not found');
        findings.push('NavigationContainer missing');
      }
      
      // Check for error boundaries
      if (appContent.includes('ErrorBoundary')) {
        console.log('✅ ErrorBoundary found');
        findings.push('ErrorBoundary is present');
      } else {
        console.log('⚠️ ErrorBoundary not found');
        findings.push('ErrorBoundary missing');
      }
      
    } catch (error) {
      console.log(`❌ Error reading App.tsx: ${error.message}`);
      findings.push(`App.tsx error: ${error.message}`);
    }
  }
  
  return findings;
};

// 4. Generate debugging recommendations
const generateRecommendations = (allFindings) => {
  const recommendations = [];
  
  console.log('\n4️⃣ Generating Debug Recommendations...');
  
  // Based on the "div div div" error and "Requiring unknown module '1016'" error
  recommendations.push('🧹 Clear Metro cache: npm run clean && npm start -- --reset-cache');
  recommendations.push('🗑️ Delete node_modules and reinstall: rm -rf node_modules && npm install');
  recommendations.push('📱 Clear Expo cache: expo r -c');
  recommendations.push('🔄 Restart Metro bundler completely');
  
  // Check if monitoring is properly set up
  if (!allFindings.some(f => f.includes('Monitoring system is imported'))) {
    recommendations.push('📊 Ensure LoadingIssuesMonitor is properly imported and started');
  }
  
  // Navigation specific recommendations
  recommendations.push('🧭 Check navigation stack configuration for circular references');
  recommendations.push('🔍 Verify all screen components are properly exported');
  recommendations.push('⚡ Check for lazy loading issues in navigation');
  
  return recommendations;
};

// Execute all checks
const runDebugSession = async () => {
  try {
    console.log('\n🚀 Running Debug Session...');
    
    const navFindings = checkNavigationSetup();
    const bundleFindings = checkMetroBundle();
    const componentFindings = checkComponentStructure();
    
    const allFindings = [...navFindings, ...bundleFindings, ...componentFindings];
    const recommendations = generateRecommendations(allFindings);
    
    debugInfo.findings = allFindings;
    debugInfo.recommendations = recommendations;
    
    // Save debug report
    const reportPath = path.join(process.cwd(), 'debug-navigation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(debugInfo, null, 2));
    
    console.log('\n📋 Debug Summary:');
    console.log('=' .repeat(40));
    console.log(`📊 Total findings: ${allFindings.length}`);
    console.log(`💡 Recommendations: ${recommendations.length}`);
    console.log(`📄 Report saved: ${reportPath}`);
    
    console.log('\n🎯 Immediate Actions to Try:');
    recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Try the immediate actions above');
    console.log('2. Check the monitoring dashboard for real-time data');
    console.log('3. Look for specific error patterns in Metro logs');
    console.log('4. Test navigation after each fix attempt');
    
  } catch (error) {
    console.error('❌ Debug session failed:', error);
  }
};

// Run the debug session
runDebugSession();