# PowerShell script to fix Theme import casing issues
$files = @(
    "src/navigation/AppNavigator.tsx",
    "src/components/NotificationItem.tsx",
    "src/screens/SearchResultsScreen.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace "from '../styles/Theme'", "from '../styles/theme'"
        $newContent = $newContent -replace "from '../../styles/Theme'", "from '../../styles/theme'"
        $newContent = $newContent -replace "from '../../../styles/Theme'", "from '../../../styles/theme'"
        Set-Content $file $newContent -NoNewline
        Write-Host "Fixed: $file"
    }
}

# Find and fix all remaining Theme imports
Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "from.*styles/Theme") {
        $newContent = $content -replace "from '(.*)styles/Theme'", "from '`$1styles/theme'"
        Set-Content $_.FullName $newContent -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}