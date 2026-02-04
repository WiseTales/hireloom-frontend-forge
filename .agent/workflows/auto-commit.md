---
description: Automatically commit and push changes to GitHub
---

This workflow ensures that all recent changes are committed and pushed to the remote repository.

// turbo-all
1. Stage all changes
   `git add .`

2. Check if there are changes to commit
   `git status`

3. Commit changes with a descriptive message
   `git commit -m "chore: automated update from Antigravity"`

4. Push changes to the remote repository
   `git push origin main`
