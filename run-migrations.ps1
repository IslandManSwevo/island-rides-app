Write-Host "🚀 Starting database migrations..." -ForegroundColor Green

# Change to the backend directory
Set-Location "backend"

# Run the migration script
try {
    Write-Host "📄 Executing migration script..." -ForegroundColor Yellow
    node run-migrations.js
    Write-Host "✅ Migration script completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error executing migration script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Return to the parent directory
Set-Location ".."

Write-Host "🎉 All migrations completed!" -ForegroundColor Green