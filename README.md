# order-me-app

OrderMe ("This round is on me"): a phone app for collecting a round of drinks and snacks from friends and reading it out at the counter. It's an installable, offline PWA hosted on GitHub Pages.

- What and why: [docs/prd.md](docs/prd.md). Words used in code and docs: [CONTEXT.md](CONTEXT.md). Design: [docs/look-and-feel.md](docs/look-and-feel.md). Decisions: [docs/adr/](docs/adr/).
- Code is grouped by feature: `src/round/`, `src/counter/`, `src/history/`, `src/items/`, `src/settings/`, plus `src/shared/`.

```sh
npm install
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright, phone viewport)
npm run typecheck && npm run lint
```
