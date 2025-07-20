# TypeScript Issue Fixer Scripts

This directory contains scripts to help identify and fix TypeScript 'any' type issues and other common problems in the KeyLo app.

## Scripts Available

### 1. fix-any-issues.ps1 (PowerShell)
Windows PowerShell script for finding and fixing TypeScript issues.

### 2. fix-any-issues.js (Node.js)
Cross-platform Node.js script with the same functionality.

## Features

- 🔍 **Scan TypeScript files** for 'any' type usage
- 🔧 **Auto-fix common patterns** like:
  - `navigation: any` → `navigation: NavigationProp<any>`
  - `error: any` → `error: Error | unknown`
  - `catch (error: any)` → `catch (error: unknown)`
  - `Record<string, any>` → `Record<string, unknown>`
- 📦 **Add missing imports** automatically
- ⚠️ **Detect other issues** like:
  - Missing function return types
  - Console statements
  - TODO/FIXME comments
- ✅ **TypeScript compilation check** after fixes

## Usage

### PowerShell (Windows)
```powershell
# Preview what would be fixed (dry run)
.\scripts\fix-any-issues.ps1 -DryRun

# Apply fixes
.\scripts\fix-any-issues.ps1 -Fix

# Verbose output with fixes
.\scripts\fix-any-issues.ps1 -Fix -Verbose

# Target specific directory
.\scripts\fix-any-issues.ps1 -Fix -TargetDir "src/components"
```

### Node.js (Cross-platform)
```bash
# Preview what would be fixed (dry run)
node scripts/fix-any-issues.js --dry-run

# Apply fixes
node scripts/fix-any-issues.js --fix

# Verbose output with fixes
node scripts/fix-any-issues.js --fix --verbose

# Target specific directory
node scripts/fix-any-issues.js --fix --target=src/components

# Show help
node scripts/fix-any-issues.js --help
```

## Configuration Files

### tsconfig.strict.json
A strict TypeScript configuration file that helps identify type issues:

```bash
# Use strict config for type checking
npx tsc --noEmit --project tsconfig.strict.json
```

## Common Type Mappings

The scripts automatically apply these common type fixes:

| Before | After |
|--------|-------|
| `navigation: any` | `navigation: NavigationProp<any>` |
| `style?: any` | `style?: ViewStyle \| TextStyle` |
| `error: any` | `error: Error \| unknown` |
| `data: any` | `data: Record<string, unknown>` |
| `response: any` | `response: ApiResponse<unknown>` |
| `event: any` | `event: NativeSyntheticEvent<any>` |
| `catch (error: any)` | `catch (error: unknown)` |
| `Record<string, any>` | `Record<string, unknown>` |

## Best Practices

1. **Always run dry-run first** to see what changes will be made
2. **Commit your changes** before running the fix script
3. **Review the changes** after applying fixes
4. **Run tests** to ensure functionality isn't broken
5. **Use strict TypeScript config** for ongoing development

## Example Workflow

```bash
# 1. Check current state
node scripts/fix-any-issues.js --dry-run

# 2. Apply fixes
node scripts/fix-any-issues.js --fix

# 3. Verify TypeScript compilation
npx tsc --noEmit

# 4. Run tests
npm test

# 5. Start development server
npm start
```

## Output Example

```
🔍 KeyLo TypeScript Issue Fixer
=======================================
Scanning directory: /path/to/src
Found 45 TypeScript files

📁 Processing: src/components/VehicleCard.tsx
  Found 3 'any' usage(s)
    Line 15: navigation: any
    Line 28: style?: any
    Line 42: error: any
  ✓ Fixed: navigation: any → navigation: NavigationProp<any>
  ✓ Fixed: style?: any → style?: ViewStyle | TextStyle
  ✓ Fixed: error: any → error: Error | unknown
  ✅ Applied 3 fixes

🔨 Running TypeScript compilation check...
✅ TypeScript compilation successful!

📊 Summary:
============
Files scanned: 45
Issues found: 23
Issues fixed: 23
Errors: 0

✨ Fix process completed! 🚀
```

## Troubleshooting

### Permission Issues (PowerShell)
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### TypeScript Compilation Errors
If compilation fails after fixes:
1. Check the error messages carefully
2. Some fixes might need manual adjustment
3. Review import statements
4. Ensure all required dependencies are installed

### Missing Dependencies
If you see import errors, install missing packages:
```bash
npm install @react-navigation/native react-native
```

## Contributing

When adding new type mappings:
1. Add the pattern to `typeMappings` object
2. Add required imports to `requiredImports` object
3. Test with dry-run first
4. Update this README with the new mapping

## Related Files

- `tsconfig.json` - Main TypeScript configuration
- `tsconfig.strict.json` - Strict TypeScript configuration
- `package.json` - Project dependencies
- `.eslintrc.js` - ESLint configuration for additional type checking
