# Island Rides App - Troubleshooting Guide

## 🚨 Common Loading Issues & Solutions

### 1. **Metro Configuration Issues**
**Problem**: App won't start due to Metro bundler errors
**Solution**: 
```bash
# Clear Metro cache
npx expo start --clear

# Or manually clear cache
npx react-native start --reset-cache
```

### 2. **React Native Reanimated Issues**
**Problem**: Animation-related crashes or "Cannot read property 'createAnimatedComponent'"
**Solutions**:
- Ensure Reanimated is properly configured in `metro.config.js` ✅ (Fixed)
- Check if babel plugin is configured in `babel.config.js`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // Must be last
  };
};
```

### 3. **Gluestack UI Issues**
**Problem**: "@gluestack-ui/themed" components not rendering
**Solutions**:
- Verify Gluestack is properly installed
- Check if GluestackUIProvider is wrapping your app
- Ensure theme configuration is correct

### 4. **TypeScript Compilation Errors**
**Problem**: TSC errors preventing app start
**Solutions**:
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Fix common issues:
# - Missing imports
# - Type mismatches
# - Unused variables
```

### 5. **Dependencies Issues**
**Problem**: Module resolution errors
**Solutions**:
```bash
# Reinstall dependencies
npm run clean
npm install

# For Expo projects
npx expo install --fix
```

### 6. **New Architecture Issues** 
**Problem**: `newArchEnabled: true` causing compatibility issues
**Solution**: Temporarily disable in `app.json`:
```json
{
  "expo": {
    "newArchEnabled": false
  }
}
```

## 🔧 Quick Start Commands

### Development
```bash
# Start with cache clear
npx expo start --clear

# Start on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

### Production Testing
```bash
# Build for testing
npx expo build:ios
npx expo build:android
```

## 🐛 Debugging Steps

### Step 1: Check File Structure
Ensure these critical files exist:
- ✅ `App.tsx`
- ✅ `package.json`
- ✅ `src/styles/theme.ts`
- ✅ `src/context/ThemeContext.tsx`
- ✅ `src/navigation/AppNavigator.tsx`

### Step 2: Verify Imports
Common import issues fixed:
- ✅ React Native core imports in SearchScreen
- ✅ Reanimated configuration in metro.config.js
- ✅ Theme context proper exports

### Step 3: Check Console Errors
Look for specific error messages:
- `Cannot resolve module` → Dependency issue
- `Element type is invalid` → Component import issue  
- `undefined is not an object` → Missing export/import
- `Cannot read property of undefined` → Context/provider issue

### Step 4: Platform-Specific Issues
**iOS Simulator**:
```bash
npx expo run:ios
```

**Android Emulator**:
```bash
npx expo run:android
```

**Web Browser**:
```bash
npx expo start --web
```

## 🎯 Recent Fixes Applied

1. ✅ **Fixed SearchScreen imports** - Proper React Native import order
2. ✅ **Fixed Metro config** - Removed conflicting Reanimated alias
3. ✅ **Theme system verified** - All color references exist
4. ✅ **Component exports verified** - All skeleton components properly exported

## 📞 Next Steps

If issues persist:

1. **Check exact error message** in Metro console
2. **Try different platforms** (iOS/Android/Web)
3. **Clear all caches**:
   ```bash
   # Clear Expo cache
   npx expo start --clear
   
   # Clear npm cache  
   npm cache clean --force
   
   # Clear Metro cache
   npx react-native start --reset-cache
   ```

4. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

## 💡 Pro Tips

- **Always check the Metro console** for detailed error messages
- **Test on web first** - Usually gives clearer error messages
- **Use Expo Dev Tools** - `npx expo start` opens helpful debugging interface
- **Check React Native version compatibility** with all packages

---

Your app has a **solid design foundation** - these are likely just configuration issues that can be resolved quickly!