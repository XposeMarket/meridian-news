# Meridian

Meridian is a static-generated Next.js newsroom. Content is JSON under `content/`; the application reads it at build time. The binding data contract is [CONTENT_SCHEMA.md](CONTENT_SCHEMA.md).

## Local workflow

```bash
npm install
npm run dev
npm run validate
npm run build
npm run start
```

Create an intentionally incomplete draft (do not publish it without replacing every placeholder):

```bash
npm run new-article -- markets federal-reserve-preview
```

This writes `content/articles/YYYY-MM-DD-federal-reserve-preview.json`. Complete it with original reporting and at least two real sources, then validate it:

```bash
npm run validate
npm run validate -- --check-images
```

`--check-images` follows redirects and checks every article image with a Meridian user agent. It tries `HEAD`, then falls back to `GET` for servers that do not support `HEAD`.

## Content rules

- Edit only `content/` for newsroom updates.
- Article filenames and fields must satisfy `CONTENT_SCHEMA.md`.
- Use only approved hotlinkable image hosts: Wikimedia Commons, Unsplash, or Pexels; supply descriptive alt text, credit, license, and source URL.
- Never publish placeholders, invented sources, quotes, figures, or URLs.
- Run validation before every content commit.

## Deployment

`main` is the production branch. Pushing a validated change to `main` triggers the Vercel production deployment automatically. Use the Vercel project dashboard for deployment logs and production status; do not manually deploy unvalidated content.

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the local Next.js development server. |
| `npm run build` | Produce a production build. |
| `npm run start` | Serve the production build locally. |
| `npm run validate` | Validate all article JSON and site references. |
| `npm run validate -- --check-images` | Also verify image responses over HTTP. |
| `npm run new-article -- <section> <slug>` | Create a deliberately non-publishable article draft for today. |

## Browser verification

After `npm run build`, run `npm run start -- -p 3077` in one terminal and `npx playwright install chromium && npm run qa` in another. QA checks production routes, RSS/sitemap, both viewport widths, image loading, theme persistence, overflow, and (when articles exist) search and NewsArticle JSON-LD. Screenshots are saved in `screenshots/`. Set `QA_URL` to check another running instance. Browser installation is only needed on development/QA machines, never for deployment.

The app also builds without any content files, rendering honest empty states. Content is never fetched from external services at request time. A missing corrections inbox is explicitly disclosed on the corrections page rather than inventing an email address.
