# Island Rides - Fix 'any' Issues and TypeScript Errors Script
# This script finds and fixes common TypeScript issues including 'any' types

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false,
    [string]$TargetDir = "src"
)

Write-Host "🔍 Island Rides TypeScript Issue Fixer" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $projectRoot $TargetDir

if (-not (Test-Path $srcPath)) {
    Write-Error "Source directory not found: $srcPath"
    exit 1
}

# Statistics
$stats = @{
    FilesScanned = 0
    IssuesFound = 0
    IssuesFixed = 0
    Errors = 0
}

# Common type mappings for fixing 'any' types
$typeMappings = @{
    'navigation: any' = 'navigation: NavigationProp<any>'
    'style?: any' = 'style?: ViewStyle | TextStyle'
    'error: any' = 'error: Error | unknown'
    'data: any' = 'data: Record<string, unknown>'
    'response: any' = 'response: ApiResponse<unknown>'
    'event: any' = 'event: NativeSyntheticEvent<any>'
    'filters?: any' = 'filters?: SearchFilters'
    'userPreferences?: any' = 'userPreferences?: UserPreferences'
    'payload: any' = 'payload: Record<string, unknown>'
    'details?: any' = 'details?: Record<string, unknown>'
}

# Import statements to add when fixing types
$requiredImports = @{
    'NavigationProp' = "import { NavigationProp } from '@react-navigation/native';"
    'ViewStyle' = "import { ViewStyle } from 'react-native';"
    'TextStyle' = "import { TextStyle } from 'react-native';"
    'NativeSyntheticEvent' = "import { NativeSyntheticEvent } from 'react-native';"
    'SearchFilters' = "import { SearchFilters } from '../types';"
    'UserPreferences' = "import { UserPreferences } from '../types';"
    'ApiResponse' = "import { ApiResponse } from '../types';"
}

function Write-Log {
    param($Message, $Color = "White")
    if ($Verbose -or $Color -ne "White") {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Get-TypeScriptFiles {
    param($Path)
    return Get-ChildItem -Path $Path -Recurse -Include "*.ts", "*.tsx" | Where-Object { 
        $_.FullName -notmatch "node_modules|\.d\.ts$|__tests__|\.test\.|\.spec\." 
    }
}

function Find-AnyUsages {
    param($FilePath)
    $content = Get-Content $FilePath -Raw
    $anyUsages = @()
    
    # Find different patterns of 'any' usage
    $patterns = @(
        ':\s*any\b',           # : any
        '<any>',               # <any>
        '\(.*:\s*any\)',       # function parameters
        'as\s+any\b',          # as any
        'any\[\]',             # any[]
        'Record<string,\s*any>' # Record<string, any>
    )
    
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
            $anyUsages += @{
                Pattern = $pattern
                Match = $match.Value
                LineNumber = $lineNumber
                Index = $match.Index
            }
        }
    }
    
    return $anyUsages
}

function Fix-CommonAnyIssues {
    param($FilePath)
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $fixesApplied = 0
    $importsToAdd = @()
    
    # Apply common type mappings
    foreach ($anyType in $typeMappings.Keys) {
        $replacement = $typeMappings[$anyType]
        if ($content -match [regex]::Escape($anyType)) {
            $content = $content -replace [regex]::Escape($anyType), $replacement
            $fixesApplied++
            Write-Log "  ✓ Fixed: $anyType → $replacement" -Color Green
            
            # Check if we need to add imports
            foreach ($importKey in $requiredImports.Keys) {
                if ($replacement -match $importKey -and $content -notmatch [regex]::Escape($importKey)) {
                    $importsToAdd += $requiredImports[$importKey]
                }
            }
        }
    }
    
    # Fix specific patterns
    
    # 1. Fix error catch blocks: catch (error: any) → catch (error: unknown)
    $content = $content -replace 'catch\s*\(\s*(\w+):\s*any\s*\)', 'catch ($1: unknown)'
    if ($content -ne $originalContent) { $fixesApplied++ }
    
    # 2. Fix function parameters with any
    $content = $content -replace '(\w+):\s*any\[\]', '$1: unknown[]'
    if ($content -ne $originalContent) { $fixesApplied++ }
    
    # 3. Fix Record<string, any> → Record<string, unknown>
    $content = $content -replace 'Record<string,\s*any>', 'Record<string, unknown>'
    if ($content -ne $originalContent) { $fixesApplied++ }
    
    # 4. Fix React component props
    $content = $content -replace 'props:\s*any', 'props: Record<string, unknown>'
    if ($content -ne $originalContent) { $fixesApplied++ }
    
    # Add required imports at the top of the file
    if ($importsToAdd.Count -gt 0) {
        $existingImports = ($content -split "`n" | Where-Object { $_ -match "^import" }) -join "`n"
        $newImports = ($importsToAdd | Sort-Object -Unique) -join "`n"
        
        if ($existingImports) {
            $content = $content -replace "($existingImports)", "$1`n$newImports"
        } else {
            $content = "$newImports`n`n$content"
        }
        $fixesApplied++
    }
    
    return @{
        Content = $content
        FixesApplied = $fixesApplied
        Changed = ($content -ne $originalContent)
    }
}

function Fix-OtherTypeScriptIssues {
    param($FilePath)
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $fixesApplied = 0
    
    # 1. Fix missing return types on functions
    $functionPattern = 'function\s+(\w+)\s*\([^)]*\)\s*\{'
    $matches = [regex]::Matches($content, $functionPattern)
    foreach ($match in $matches) {
        if ($match.Value -notmatch ':\s*\w+\s*\{') {
            # This is a basic fix - in practice, you'd want more sophisticated analysis
            Write-Log "  ⚠️  Function '$($match.Groups[1].Value)' missing return type" -Color Yellow
        }
    }
    
    # 2. Fix unused imports (basic detection)
    $importLines = $content -split "`n" | Where-Object { $_ -match "^import" }
    foreach ($importLine in $importLines) {
        if ($importLine -match "import\s+\{([^}]+)\}") {
            $imports = $matches.Groups[1].Value -split "," | ForEach-Object { $_.Trim() }
            foreach ($import in $imports) {
                if ($content -split "`n" | Where-Object { $_ -notmatch "^import" } | Where-Object { $_ -match "\b$import\b" } | Measure-Object | Select-Object -ExpandProperty Count -eq 0) {
                    Write-Log "  ⚠️  Unused import: $import" -Color Yellow
                }
            }
        }
    }
    
    # 3. Fix console.log statements (should use proper logging)
    $consolePattern = 'console\.(log|warn|error|info)'
    if ($content -match $consolePattern) {
        Write-Log "  ⚠️  Found console statements - consider using LoggingService" -Color Yellow
    }
    
    return @{
        Content = $content
        FixesApplied = $fixesApplied
        Changed = ($content -ne $originalContent)
    }
}

function Test-TypeScriptCompilation {
    Write-Log "🔨 Running TypeScript compilation check..." -Color Cyan
    
    Push-Location $projectRoot
    try {
        $result = & npx tsc --noEmit 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ TypeScript compilation successful!" -Color Green
            return $true
        } else {
            Write-Log "❌ TypeScript compilation failed:" -Color Red
            Write-Log $result -Color Red
            return $false
        }
    } finally {
        Pop-Location
    }
}

# Main execution
Write-Log "Scanning directory: $srcPath" -Color Yellow
Write-Log "Dry run mode: $DryRun" -Color Yellow

$files = Get-TypeScriptFiles -Path $srcPath
Write-Log "Found $($files.Count) TypeScript files" -Color Green

foreach ($file in $files) {
    $stats.FilesScanned++
    $relativePath = $file.FullName.Replace($projectRoot, "").TrimStart('\', '/')
    
    Write-Log "`n📁 Processing: $relativePath" -Color Cyan
    
    try {
        # Find 'any' usages
        $anyUsages = Find-AnyUsages -FilePath $file.FullName
        if ($anyUsages.Count -gt 0) {
            $stats.IssuesFound += $anyUsages.Count
            Write-Log "  Found $($anyUsages.Count) 'any' usage(s)" -Color Yellow
            
            foreach ($usage in $anyUsages) {
                Write-Log "    Line $($usage.LineNumber): $($usage.Match)" -Color Gray
            }
        }
        
        # Apply fixes
        if (-not $DryRun) {
            $anyFixes = Fix-CommonAnyIssues -FilePath $file.FullName
            $otherFixes = Fix-OtherTypeScriptIssues -FilePath $file.FullName
            
            if ($anyFixes.Changed) {
                Set-Content -Path $file.FullName -Value $anyFixes.Content -NoNewline
                $stats.IssuesFixed += $anyFixes.FixesApplied
                Write-Log "  ✅ Applied $($anyFixes.FixesApplied) fixes" -Color Green
            }
        } else {
            Write-Log "  (Dry run - no changes made)" -Color Gray
        }
        
    } catch {
        $stats.Errors++
        Write-Log "  ❌ Error processing file: $($_.Exception.Message)" -Color Red
    }
}

# Final compilation check
if (-not $DryRun) {
    Write-Log "`n🔍 Final TypeScript compilation check..." -Color Cyan
    $compilationSuccess = Test-TypeScriptCompilation
}

# Summary
Write-Log "`n📊 Summary:" -Color Cyan
Write-Log "============" -Color Cyan
Write-Log "Files scanned: $($stats.FilesScanned)" -Color White
Write-Log "Issues found: $($stats.IssuesFound)" -Color Yellow
Write-Log "Issues fixed: $($stats.IssuesFixed)" -Color Green
Write-Log "Errors: $($stats.Errors)" -Color Red

if ($DryRun) {
    Write-Log "`n💡 Run without -DryRun to apply fixes" -Color Cyan
} else {
    Write-Log "`n✨ Fix process completed!" -Color Green
    if ($compilationSuccess) {
        Write-Log "🎉 TypeScript compilation is now clean!" -Color Green
    } else {
        Write-Log "⚠️  Some TypeScript errors may remain - check the output above" -Color Yellow
    }
}

Write-Host "`nDone! 🚀" -ForegroundColor Cyan