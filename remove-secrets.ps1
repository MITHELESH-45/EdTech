# Script to remove secrets from git history
# This will help clean up the commits with API keys

Write-Host "Removing secrets from git history..." -ForegroundColor Yellow

# Check if we're on the right branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Find the commit before the first problematic commit (50c84da)
$baseCommit = git rev-parse 50c84da^
Write-Host "Base commit (before secrets): $baseCommit" -ForegroundColor Cyan

Write-Host "`nTo fix this, you have two options:" -ForegroundColor Yellow
Write-Host "`nOption 1 (Recommended): Interactive Rebase" -ForegroundColor Green
Write-Host "1. Run: git rebase -i $baseCommit" -ForegroundColor White
Write-Host "2. Change 'pick' to 'edit' for commits: 50c84da and a0af7e8" -ForegroundColor White
Write-Host "3. For each commit being edited:" -ForegroundColor White
Write-Host "   - Remove .env file if it exists: git rm --cached .env" -ForegroundColor White
Write-Host "   - Fix .replit file (already done in working directory)" -ForegroundColor White
Write-Host "   - Run: git add .replit" -ForegroundColor White
Write-Host "   - Run: git commit --amend --no-edit" -ForegroundColor White
Write-Host "   - Run: git rebase --continue" -ForegroundColor White
Write-Host "4. Force push: git push origin mithul --force" -ForegroundColor White

Write-Host "`nOption 2: Create new branch without secrets" -ForegroundColor Green
Write-Host "1. Create new branch from before secrets: git checkout -b mithul-clean $baseCommit" -ForegroundColor White
Write-Host "2. Cherry-pick commits after fixing secrets manually" -ForegroundColor White
Write-Host "3. Push new branch: git push origin mithul-clean" -ForegroundColor White

Write-Host "`nNote: The .replit file has already been fixed in your working directory." -ForegroundColor Cyan
Write-Host "Make sure to commit this change before rebasing." -ForegroundColor Cyan

