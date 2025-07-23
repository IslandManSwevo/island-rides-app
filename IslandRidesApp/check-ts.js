const { execSync } = require('child_process');

try {
  console.log('Running TypeScript check...');
  const result = execSync('npx tsc --noEmit', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });
  console.log('TypeScript check passed!');
} catch (error) {
  console.log('TypeScript errors found:');
  console.log(error.stdout);
  
  // Count errors
  const errorLines = error.stdout.split('\n').filter(line => line.includes('error TS'));
  console.log(`\nTotal errors: ${errorLines.length}`);
  
  // Show first 20 errors
  console.log('\nFirst 20 errors:');
  errorLines.slice(0, 20).forEach((line, index) => {
    console.log(`${index + 1}. ${line}`);
  });
}