const { execSync } = require('child_process');
const path = require('path');

try {
  process.chdir(path.join(__dirname, 'IslandRidesApp'));
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  console.log('No TypeScript errors found!');
} catch (error) {
  console.log(error.stdout || error.stderr || error.message);
}