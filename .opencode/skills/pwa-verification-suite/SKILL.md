# Skill: pwa-verification-suite

SmashMine-specific 5-step verification: tests + typescript + build + CI + deployment.

## Usage
`/pwa-verify` or invoke via skill tool with name "pwa-verification-suite"

## Workflow

### Step 1: Run tests
```bash
cd /root/projects/SmashMine && bun test 2>&1 | tail -5
```
Expected: "25 pass, 0 fail"

### Step 2: TypeScript check
```bash
cd /root/projects/SmashMine && bunx tsc --noEmit 2>&1 | tail -5
```
Expected: no output (clean)

### Step 3: Production build
```bash
cd /root/projects/SmashMine && bun run build 2>&1 | tail -10
```
Expected: "✓ built in" with JS/CSS sizes

### Step 4: Check GitHub Actions CI
```bash
curl -s "https://api.github.com/repos/bigknoxy/SmashMine/actions/runs?per_page=1" | grep -E '"status"|"conclusion"' | head -4
```
Expected: "status": "completed", "conclusion": "success"

### Step 5: Check GitHub Pages deployment
```bash
curl -s -o /dev/null -w "%{http_code}" https://bigknoxy.github.io/SmashMine/
```
Expected: "200"

### Report Format
```
Tests: ✅ 25/25 pass | ❌ FAILED
TypeScript: ✅ 0 errors | ❌ ERRORS
Build: ✅ Success (XX KB) | ❌ FAILED
CI: ✅ Passing | ❌ FAILED
Deploy: ✅ 200 OK | ❌ ERROR
```
