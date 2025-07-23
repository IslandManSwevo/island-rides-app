#!/usr/bin/env node

console.log('🔍 Island Rides App Debug Script');
console.log('================================');

// Check Node.js version
console.log(`Node.js version: ${process.version}`);

// Check if key files exist
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'package.json',
  'App.tsx',
  'app.json',
  'src/styles/theme.ts',
  'src/context/ThemeContext.tsx',
  'src/navigation/AppNavigator.tsx',
  'src/components/templates/GluestackCard.tsx',
  'src/components/AnimatedButton.tsx',
];

console.log('\n📁 Checking critical files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json dependencies
console.log('\n📦 Checking key dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const keyDeps = [
    'react',
    'react-native',
    'expo',
    '@gluestack-ui/themed',
    'react-native-reanimated',
    '@expo/vector-icons',
  ];
  
  keyDeps.forEach(dep => {
    const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    console.log(`${version ? '✅' : '❌'} ${dep}: ${version || 'MISSING'}`);
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Try to import critical modules
console.log('\n🔧 Testing critical imports:');
const testImports = [
  './src/styles/theme',
  './src/context/ThemeContext', 
  './src/components/AnimatedButton',
];

testImports.forEach(modulePath => {
  try {
    require(modulePath);
    console.log(`✅ ${modulePath}`);
  } catch (error) {
    console.log(`❌ ${modulePath}: ${error.message}`);
  }
});

console.log('\n🏁 Debug complete!');
console.log('\nTo run the app:');
console.log('npm start');
console.log('or');
console.log('npx expo start');