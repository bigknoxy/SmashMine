---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Mobile-First Game Dev (SmashMine)

This project is a **mobile-first PWA game**. Primary use case is mobile phones and tablets.

### Mobile Touch Requirements
- ALL touch controls must work on real mobile devices (not just headless browser)
- Test touch on real device before declaring done
- Use real device debugging: Chrome DevTools → Device Mode or connect physical phone via USB
- Verify touch events fire: check console for `[Joystick]` debug messages

### Mobile Performance
- Target 60fps on mid-range phones (Pixel A-series, iPhone SE)
- Keep bundle under 150KB gzip
- Use PWA offline caching
- Test on slow 3G connection

### Mobile UX Requirements
- Touch targets minimum 44x44px
- Prevent accidental browser gestures (back swipe, zoom, refresh)
- Handle orientation changes
- Handle notched devices (viewport-fit=cover)

---

## Skill Routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---

## Project-Specific Skill Automation

### Auto-Invoke Rules for Project Skills

**1. `/git-workflow` — ALWAYS use after making code changes**
- Trigger: After ANY commit to main branch (Phase 1-4 patterns)
- Trigger: After implementing a feature or bug fix
- What it does: Automates `git pull --rebase origin main` → `git push origin main`

**2. `/pwa-verify` — ALWAYS use after code changes + before declaring done**
- Trigger: After ANY implementation phase completes
- Trigger: After modifying: `src/**/*.ts`, `index.html`, `vite.config.ts`, `*.css`
- What it does: Runs 5-step verification (tests, typescript, build, CI, deployment)

**3. `/mobile-test` — Use when testing touch/mobile features**
- Trigger: After modifying `src/ui/Joystick.ts`, `src/game/Player.ts`, `src/rendering/CameraController.ts`
- Trigger: When user says "test on mobile" or "verify touch"
- What it does: Launches Chromium with `--no-sandbox`, tests mobile viewports

---

## Auto-Invoke Rules for Agents

**HashPilot Agent — Use for ALL file edits**
- Trigger: When editing ANY `.ts`, `.tsx` file
- Trigger: When multiple file edits are needed
- What it does: Hash-anchored editing, AST-aware edits, batched operations

**perf-bug-hunter Agent — Use when debugging performance/mobile issues**
- Trigger: User reports "FPS drop", "laggy", "slow"
- Trigger: Mobile performance issues on real devices

**pwa-game-builder Agent — Use for implementation tasks**
- Trigger: Implementing new game features
- Trigger: Modifying: `src/game/*.ts`, `src/rendering/*.ts`, `src/world/*.ts`

**code-simplifier Agent — Use after large implementations**
- Trigger: After completing a Phase (1-4 pattern)
- Trigger: When code feels verbose or overly complex
