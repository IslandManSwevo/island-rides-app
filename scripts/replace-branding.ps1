# PowerShell script to replace 'Island Rides' with 'KeyLo' in all text files
$projectRoot = "c:\Users\green\Desktop\island-rides-app-main"
$oldBrand = "Island Rides"
$newBrand = "KeyLo"

# File patterns to include
$includePatterns = @('*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md', '*.html', '*.css', '*.scss')

# Directories to exclude
$excludeDirs = @('node_modules', '.git', 'build', 'dist')

# Get all files recursively, excluding certain directories
$files = Get-ChildItem -Path $projectRoot -Recurse -Include $includePatterns | Where-Object { $_.DirectoryName -notmatch ($excludeDirs -join '|') }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match $oldBrand) {
        $newContent = $content -replace $oldBrand, $newBrand
        Set-Content $file.FullName $newContent
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Branding replacement completed."