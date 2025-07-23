# Metro Bundler Troubleshooting Guide

## 🚨 "Unknown Module" Errors

### Error: "Requiring unknown module 1030" or similar numeric module errors

**Root Cause**: This error typically occurs when Metro's module resolution gets confused due to:
- Malformed import statements
- Missing semicolons between imports
- Circular dependencies
- Cache corruption

**Solution Steps**:

### Step 1: Check for Malformed Imports ✅ (FIXED)

**Problem Found**: In `App.tsx`, there was a missing semicolon causing two import statements to merge:
```typescript
// ❌ BROKEN:
import _loadingIssuesMonitor from './src/monitoring/LoadingIssuesMonitor';import { NavigationContainer } from '@react-navigation/native';

// ✅ FIXED:
import _loadingIssuesMonitor from './src/monitoring/LoadingIssuesMonitor';
import { NavigationContainer } from '@react-navigation/native';
```

### Step 2: Clear All Caches

```bash
# Clear Expo cache
npx expo start --clear

# Clear Metro cache specifically
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force

# Clear watchman cache (if on macOS/Linux)
watchman watch-del-all

# Nuclear option - clear everything
rm -rf node_modules
npm install
npx expo start --clear
```

### Step 3: Check for Circular Dependencies

Look for components that import each other:
```bash
# Search for potential circular dependencies
npx madge --circular src/
```

### Step 4: Verify All Import Paths

Common import issues:
```typescript
// ❌ Wrong relative paths
import Component from '../../../components/Component';

// ✅ Use absolute imports from src
import Component from 'src/components/Component';

// ❌ Missing file extensions for custom files
import utils from './utils';

// ✅ Include extensions for clarity
import utils from './utils.ts';
```

### Step 5: Check Metro Configuration

Ensure `metro.config.js` is properly configured:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reset cache on every start
config.resetCache = true;

// Ensure proper resolver configuration
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.js',
  'web.jsx', 
  'web.ts',
  'web.tsx'
];

module.exports = config;
```

## 🔧 Common Metro Bundler Issues

### 1. Module Resolution Errors

**Symptoms**:
- "Unable to resolve module"
- "Module does not exist in the Haste module map"
- Random numeric module errors

**Solutions**:
- Check import paths are correct
- Ensure files exist at specified locations
- Verify file extensions match imports
- Clear Metro cache

### 2. Transform Errors

**Symptoms**:
- "SyntaxError: Unexpected token"
- "Unable to transform file"

**Solutions**:
- Check Babel configuration in `babel.config.js`
- Ensure all plugins are properly configured
- Verify React Native Reanimated plugin is last
- Update TypeScript configuration

### 3. Dependency Resolution Issues

**Symptoms**:
- "Package not found"
- "Cannot resolve dependency"

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Fix Expo dependencies
npx expo install --fix

# Check for peer dependency warnings
npm ls
```

### 4. Cache-Related Issues

**Symptoms**:
- Inconsistent behavior between builds
- Old code still running after changes
- Random build failures

**Solutions**:
```bash
# Clear all caches
npx expo r -c
npx react-native start --reset-cache
npm cache clean --force

# Restart development server
npx expo start --clear
```

### 5. Platform-Specific Issues

**iOS Simulator**:
```bash
# Clean iOS build
npx expo run:ios --clear
# Or
cd ios && xcodebuild clean
```

**Android Emulator**:
```bash
# Clean Android build
npx expo run:android --clear
# Or
cd android && ./gradlew clean
```

**Web Browser**:
```bash
# Clear web build
rm -rf .expo/web-build
npx expo build:web
```

## 📊 Debug Metro Issues

### Enable Metro Logging

Add to `metro.config.js`:
```javascript
const config = getDefaultConfig(__dirname);

// Enable verbose logging
config.reporter = {
  update: (event) => {
    console.log('Metro Event:', event);
  }
};

module.exports = config;
```

### Check Bundle Analysis

```bash
# Analyze bundle contents
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output main.jsbundle --assets-dest ./assets --verbose

# Check for problematic modules
npx metro-bundler-analyzer main.jsbundle
```

### Monitor Memory Usage

```bash
# Check Metro memory usage
ps aux | grep metro

# Monitor bundle size
ls -la main.jsbundle
```

## 🚀 Performance Optimization

### 1. Reduce Bundle Size

```javascript
// Enable tree shaking
const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
```

### 2. Optimize Imports

```typescript
// ❌ Import entire library
import * as _ from 'lodash';

// ✅ Import only what you need  
import { debounce } from 'lodash';

// ✅ Or use specific imports
import debounce from 'lodash/debounce';
```

### 3. Use Lazy Loading

```typescript
// ✅ Lazy load screens
const LazyScreen = React.lazy(() => import('./screens/LazyScreen'));

// ✅ Use Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <LazyScreen />
</Suspense>
```

## ✅ Metro Health Checklist

- [ ] No malformed import statements
- [ ] All imported files exist
- [ ] No circular dependencies  
- [ ] Metro cache cleared
- [ ] Babel configuration valid
- [ ] TypeScript configuration valid
- [ ] All dependencies installed
- [ ] No conflicting package versions
- [ ] Platform-specific builds clean
- [ ] Bundle size reasonable

## 🔍 Troubleshooting Commands

```bash
# Check Metro server status
curl http://localhost:8081/status

# Test specific bundle endpoint
curl http://localhost:8081/index.bundle?platform=ios&dev=true

# Validate package.json
npm doctor

# Check for outdated packages
npm outdated

# Verify Metro configuration
npx metro config

# Test import resolution
node -e "console.log(require.resolve('react-native'))"
```

---

**Remember**: Metro bundler issues are often resolved by clearing caches and ensuring proper import syntax. The malformed import issue was the root cause of the "unknown module 1030" error! ✅