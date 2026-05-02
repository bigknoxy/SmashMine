# AI Agent Guidelines for SmashMine

These rules define how AI agents should automatically invoke skills and agents when working on SmashMine.

---

## Auto-Invoke Rules for Project Skills

### 1. `/git-workflow` — ALWAYS use after making code changes

**Trigger conditions (auto-invoke WITHOUT asking):**
- After ANY commit to main branch (Phase 1-4 patterns)
- After implementing a feature or bug fix
- After `git add -A` + `git commit`

**Workflow:**
```
/git-workflow "Meaningful commit message"
```

**What it does:** Automates `git pull --rebase origin main` → `git push origin main` with conflict handling.

---

### 2. `/pwa-verify` — ALWAYS use after code changes + before declaring done

**Trigger conditions (auto-invoke WITHOUT asking):**
- After ANY implementation phase completes (Phase 1-4 pattern)
- After modifying: `src/**/*.ts`, `index.html`, `vite.config.ts`, `*.css`
- Before telling user "done" or "complete"

**Verification steps (automated):**
1. `bun test` — 25/25 tests must pass
2. `bunx tsc --noEmit` — 0 TypeScript errors
3. `bun run build` — Build succeeds, check bundle size
4. `curl -s https://api.github.com/repos/bigknoxy/SmashMine/actions/runs?per_page=1` — CI green
5. `curl -s -o /dev/null -w "%{http_code}" https://bigknoxy.github.io/SmashMine/` — HTTP 200

**What it does:** Runs 5-step verification loop, returns pass/fail report.

---

### 3. `/mobile-test` — Use when testing touch/mobile features

**Trigger conditions (auto-invoke WITHOUT asking):**
- After modifying `src/ui/Joystick.ts`, `src/game/Player.ts`, `src/rendering/CameraController.ts`
- After any mobile-related changes (touch events, viewport, orientation)
- When user says "test on mobile" or "verify touch"

**What it does:** Launches Chromium with `--no-sandbox`, tests mobile viewports (375x667), validates touch events, takes screenshots.

---

## Auto-Invoke Rules for Agents

### HashPilot Agent — Use for ALL file edits

**Trigger conditions (auto-invoke WITHOUT asking):**
- When editing ANY `.ts`, `.tsx` file
- When multiple file edits are needed
- When precise hash-anchored edits are required

**Invocation:**
```
Use Task tool with subagent_type: "HashPilot"
```

**What it does:** Hash-anchored editing (replace-hash), AST-aware edits for TypeScript, batched read/search, verification bundling.

---

### perf-bug-hunter Agent — Use when debugging performance/mobile issues

**Trigger conditions (auto-invoke WITHOUT asking):**
- User reports: "FPS drop", "laggy", "slow", "stuttering"
- Mobile performance issues on real devices
- PWA install failures
- Touch input delays

**Invocation:**
```
Use Task tool with subagent_type: "perf-bug-hunter"
```

---

### pwa-game-builder Agent — Use for implementation tasks

**Trigger conditions (auto-invoke WITHOUT asking):**
- Implementing new game features
- Modifying: `src/game/*.ts`, `src/rendering/*.ts`, `src/world/*.ts`
- When user says "implement", "build", "add feature"

**Invocation:**
```
Use Task tool with subagent_type: "pwa-game-builder"
```

---

### code-simplifier Agent — Use after large implementations

**Trigger conditions (auto-invoke WITHOUT asking):**
- After completing a Phase (1-4 pattern)
- When code feels verbose or overly complex
- Before final `/pwa-verify`

**Invocation:**
```
Use Task tool with subagent_type: "code-simplifier"
```

---

## Skill Routing Rules

When the user's request matches a pattern, ALWAYS invoke the corresponding skill as your FIRST action:

| User says... | Invoke... |
|-------------|----------|
| "implement phase N" or "build feature" | `pwa-game-builder` agent |
| "fix bug" or "why is this broken" | `/investigate` skill |
| "test this" or "verify" | `/pwa-verify` skill |
| "commit and push" or "ship" | `/git-workflow` skill |
| "mobile test" or "test touch" | `/mobile-test` skill |
| "code review" or "check my diff" | `/review` skill |
| "improve code" or "simplify" | `code-simplifier` agent |

---

## Project-Specific Patterns

### Phase-Based Development (SmashMine)

When implementing a new phase:
1. Create `tasks/todo.md` with checklist
2. Implement changes (use `pwa-game-builder` agent)
3. Run `/pwa-verify` for 5-step verification
4. Run `/git-workflow "Phase N: Description"` to commit + push
5. Compress conversation (use `compress` tool)
6. Update `CHANGELOG.md`

### Verification Before "Done"

NEVER declare work "done" without running `/pwa-verify` first.

### Context Management

- Compress after every Phase completion
- Keep active phase uncompressed
- Use subagents for git/verification/testing (not main session)

---

## File Structure for Skills

Project skills are stored in `.opencode/skills/`:
- `.opencode/skills/git-workflow-automation/` — Git automation
- `.opencode/skills/pwa-verification-suite/` — PWA verification
- `.opencode/skills/mobile-sandbox-test/` — Mobile testing

Load skills using: `skill` tool with skill name.
