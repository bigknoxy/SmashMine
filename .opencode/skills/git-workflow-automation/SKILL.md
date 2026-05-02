# Skill: git-workflow-automation

Automate the pull-rebase-push cycle for direct main commits.

## Usage
`/git-workflow "commit message"` or invoke via skill tool with name "git-workflow-automation"

## Workflow

### Step 1: Check clean state
```bash
git status --short
git log --oneline -3
```

### Step 2: Pull with rebase
```bash
git pull --rebase origin main
```
If rejection occurs, auto-rebase and continue.

### Step 3: Stage and commit
```bash
git add -A
git commit -m "$COMMIT_MSG"
```

### Step 4: Push to main
```bash
git push origin main
```
If rejection: `git pull --rebase origin main` then retry push.

### Step 5: Report
Return: ✅ Pushed to main (commit <hash>) or ❌ Failed: <reason>
