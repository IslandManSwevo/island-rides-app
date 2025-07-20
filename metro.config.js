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
  'react-native-reanimated': 'react-native-web',
  'react-native-keyboard-controller': false,
  '@react-native-firebase/app': false,
  '@react-native-firebase/auth': false,
};

module.exports = config;