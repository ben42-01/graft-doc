# graft-doc

Public documentation for Graft (the product lives in `../graft`). Astro Starlight, deployed to GitHub Pages at https://ben42-01.github.io/graft-doc/ on every push to `main`.

## Layout
- `src/content/docs/getting-started`: what Graft is, core concepts, first workspace
- `src/content/docs/guide`: user guide (entities, forms, bookings, payments, team, ...)
- `src/content/docs/developers`: API docs for developers
- `src/content/docs/cli`: the `graft` CLI (sign-in, usage, walkthrough, scripting, troubleshooting)
- The sidebar is explicit in `astro.config.mjs`; add new pages there.

## Writing rules
- Document what the Graft code actually does: read `../graft/src` and `../graft/docs` first, don't write from memory.
- Quote `title` and `description` in frontmatter (colons break YAML).
- Use relative links; the site is served under the `/graft-doc` base path.
- The endpoint reference (`developers/api/`) is **generated** and gitignored. Never edit it.
  - Endpoint list: `data/api-catalogue.json`, copied from `../graft/src/lib/admin/api-catalogue.json`.
  - Prose and examples: `data/endpoint-docs.mjs`. The generator fails if a route has no entry or an entry names a missing route.
  - When Graft's routes change: `npm run api:catalogue` in `../graft`, then `npm run api:sync` here, and fill in any prose it asks for.
  - `npm run dev` and `npm run build` regenerate it automatically.
- The CLI command reference (`cli/reference/`) is **generated** and gitignored too. Never edit it.
  - `scripts/generate-cli-reference.mjs` derives the commands from `data/api-catalogue.json` with the same rule as the CLI (`../graft/cli/src/catalogue.ts`), and reuses the prose in `data/endpoint-docs.mjs`. If the CLI's naming rule changes, change it there too.
  - Cross-check after a change: `npm run cli -- commands --json` in `../graft` should list the same commands as the generated headings.
- The CLI pages (`cli/*.md`) are hand-written from `../graft/cli/src` and `../graft/cli/README.md`. Re-check flags, env vars and exit codes against `main.ts` when the CLI changes.
- Check with `npm run build` before opening a PR.

## Dev
`npm run dev`, `npm run build`.
