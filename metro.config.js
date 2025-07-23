const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reset the Metro cache on every start
config.resetCache = true;

// Add support for SVG files
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Add web support for React Native components
config.resolver.platforms = ['web', 'ios', 'android'];

// Platform-specific extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.js',
  'web.jsx',
  'web.ts',
  'web.tsx'
];

// Configure web fallbacks for React Native modules that don't work on web
config.resolver.alias = {
  'react-native-maps': require.resolve('./src/components/MapView.web.tsx'),
  'react-native-pdf': false,
  'react-native-gesture-handler': 'react-native-web',
  // Note: react-native-reanimated should work on web, removing alias
  'react-native-keyboard-controller': false,
  '@react-native-firebase/app': false,
  '@react-native-firebase/auth': false,
};

// Add resolver configuration for web platform
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle React Native internal modules that don't work on web
  if (platform === 'web') {
    if (moduleName.includes('Libraries/Utilities/Platform')) {
      return {
        filePath: require.resolve('react-native-web/dist/exports/Platform'),
        type: 'sourceFile',
      };
    }
    if (moduleName.includes('Libraries/ReactNative/BridgelessUIManager')) {
      return {
        filePath: require.resolve('react-native-web/dist/exports/View'),
        type: 'sourceFile',
      };
    }
    if (moduleName.includes('Libraries/Utilities/codegenNativeComponent')) {
      return {
        filePath: require.resolve('react-native-web/dist/exports/View'),
        type: 'sourceFile',
      };
    }
  }
  
  // Fallback to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;