# Project Structure Cleanup Plan

## Current Issues Identified

### Duplicate Folders
1. **`island-rides-app`** - Duplicate of main app
2. **`island-rides-app-1`** - Another duplicate of main app  
3. **`island-rides-vscode`** - VSCode-specific duplicate
4. **`server`** - Duplicate server implementation (backend already exists)
5. **`gemini-bridge`** - AI integration bridge (may be needed)
6. **`kimi-script`** - AI script (likely experimental)
7. **`mcp-server`** - MCP server (likely experimental)
8. **`now-digest-service`** - Digest service (likely experimental)

### Root-Level Dependencies Issue
- Root `package.json` contains frontend dependencies that should be in `IslandRidesApp/`
- Root `node_modules` contains packages that should be project-specific

### Inconsistent Naming
- Main app folder is `IslandRidesApp` but project is called `KeyLo`
- Mixed naming conventions throughout

## Cleanup Actions

### Phase 1: Remove Duplicate Folders
**Safe to Remove:**
- `island-rides-app` - Complete duplicate
- `island-rides-app-1` - Complete duplicate  
- `island-rides-vscode` - VSCode-specific duplicate
- `server` - Redundant with backend folder

**Evaluate Before Removing:**
- `gemini-bridge` - Check if actively used
- `kimi-script` - Check if actively used
- `mcp-server` - Check if actively used
- `now-digest-service` - Check if actively used

### Phase 2: Clean Root Dependencies
1. Move appropriate dependencies from root to `IslandRidesApp/package.json`
2. Remove root `node_modules` and `package-lock.json`
3. Update root `package.json` to be workspace-only

### Phase 3: Standardize Naming
1. Consider renaming `IslandRidesApp` to `frontend` or `app`
2. Ensure consistent naming in documentation
3. Update references in configuration files

### Phase 4: Organize Project Structure
```
keylo-app/
├── frontend/           # React Native app (currently IslandRidesApp)
├── backend/           # Node.js API server
├── docs/              # Documentation
├── infrastructure/    # Docker, Terraform
├── scripts/           # Build and utility scripts
├── .github/           # GitHub workflows
└── README.md          # Main project README
```

## Implementation Steps

### Step 1: Backup and Verify
1. Ensure all important code is in main folders
2. Check for any unique files in duplicate folders
3. Create backup if needed

### Step 2: Remove Duplicates
1. Remove confirmed duplicate folders
2. Clean up root dependencies
3. Update documentation references

### Step 3: Reorganize
1. Standardize folder names
2. Update configuration files
3. Update documentation

## Benefits After Cleanup

1. **Reduced Confusion** - Clear project structure
2. **Smaller Repository** - Remove duplicate code and dependencies
3. **Faster Operations** - Less files to process
4. **Better Maintenance** - Single source of truth for each component
5. **Clearer Development** - Obvious where to make changes

## Risk Mitigation

1. **Backup Important Files** - Before deletion
2. **Check Dependencies** - Ensure no critical references
3. **Test After Cleanup** - Verify app still works
4. **Document Changes** - Update setup instructions
