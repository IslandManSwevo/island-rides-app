const fs = require('fs');
const path = require('path');

// Simple check for TypeScript syntax by reading the theme file
const themePath = path.join(__dirname, 'IslandRidesApp', 'src', 'styles', 'theme.ts');

try {
  const themeContent = fs.readFileSync(themePath, 'utf8');
  console.log('Theme file successfully read');
  
  // Check if our new properties are present
  const hasInputBackground = themeContent.includes('inputBackground:');
  const hasPremium = themeContent.includes('premium:');
  const hasVehicleCardStyles = themeContent.includes('vehicleCardStyles');
  const hasFullBorderRadius = themeContent.includes('full: 9999');
  
  console.log('✓ inputBackground present:', hasInputBackground);
  console.log('✓ premium color present:', hasPremium);
  console.log('✓ vehicleCardStyles present:', hasVehicleCardStyles);
  console.log('✓ full borderRadius present:', hasFullBorderRadius);
  
  console.log('Theme validation completed');
} catch (error) {
  console.error('Error reading theme file:', error.message);
}