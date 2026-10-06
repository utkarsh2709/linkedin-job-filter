# LinkedIn Company Filter

Chrome extension (Manifest V3) that hides LinkedIn job listings from companies you block.

> Status: early development. The popup and blocklist storage work; hiding job cards on LinkedIn is not implemented yet (see [PROJECT_PLAN.md](PROJECT_PLAN.md)).

## Develop

```bash
npm install
npm run build      # typecheck + build popup and content script into dist/
npm run dev        # rebuild on change (reload the extension in chrome://extensions after)
npm test           # Vitest unit, DOM and popup tests
npm run lint
```

Load it in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `dist/`.

## Docs

- [PROJECT_PLAN.md](PROJECT_PLAN.md): milestones, decisions, manual test checklist
- [ARCHITECTURE.md](ARCHITECTURE.md): module layout and runtime flow
- [DOM_RESEARCH.md](DOM_RESEARCH.md): LinkedIn markup notes (unverified) and the checklist to confirm them
