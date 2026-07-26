module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Binary assets aren't JS — @expo/vector-icons imports .ttf files directly.
  moduleNameMapper: {
    '\\.(ttf|otf|woff2?|eot|png|jpe?g|gif|webp|svg|mp4|mp3|wav)$': '<rootDir>/jest.assetMock.js',
  },
  // These packages ship untranspiled ESM and must go through Babel. The list
  // grew when React Navigation moved to 7: its `core` package now pulls in
  // react-native-css-interop and nativewind, neither of which was matched here.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(react-native|@react-native|react-native-.*|expo|expo-.*|@expo|@react-navigation|nativewind|react-native-css-interop|react-redux|@reduxjs)/)',
  ],
};