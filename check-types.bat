@echo off
cd IslandRidesApp
npx tsc --noEmit > typecheck-result.txt 2>&1
echo "TypeScript check completed. Results saved to typecheck-result.txt"