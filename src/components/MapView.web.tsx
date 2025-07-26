import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock for the main MapView component
const MapView = ({ children, ...props }) => (
  <View style={styles.container} {...props}>
    <Text style={styles.text}>Map functionality is not available on the web.</Text>
    {/* We can optionally render children if any are passed */}
    {children}
  </View>
);

// Mock for Marker
export const Marker = ({ children, ...props }) => <View {...props}>{children}</View>;

// Mock for Polyline
export const Polyline = (props) => <View {...props} />;

// Mock for Callout
export const Callout = ({ children, ...props }) => <View {...props}>{children}</View>;

// Mock for PROVIDER_GOOGLE constant
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

// Default export should be the MapView mock
export default MapView;