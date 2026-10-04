# graft-doc

Public documentation for Graft (the product lives in `../graft`). Astro Starlight, deployed to GitHub Pages at https://ben42-01.github.io/graft-doc/ on every push to `main`.

## Layout
- `src/content/docs/getting-started`: what Graft is, core concepts, first workspace
- `src/content/docs/guide`: user guide (entities, forms, bookings, payments, team, ...)
- `src/content/docs/developers`: API docs for developers
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
- Check with `npm run build` before opening a PR.

## Dev
`npm run dev`, `npm run build`.
