# Meridian newsroom runbook

The newsroom edits **only** `content/`. The application reads JSON at build time. Treat [CONTENT_SCHEMA.md](CONTENT_SCHEMA.md) as binding.

## Daily article workflow

1. Check the live site and reliable primary or reputable sources. Do not invent facts, quotes, numbers, or URLs.
2. Create or update the article JSON in `content/articles/`. For a new draft, use:
   ```bash
   npm run new-article -- <section> <kebab-case-slug>
   ```
   The generated file is deliberately invalid and cannot be published until all placeholders are replaced.
3. Write original prose, add two or more real sources, and complete every contract field. For corrections, edit the same article, update `updatedAt`, and add a `corrections` entry.
4. Update `content/site.json` whenever the front-page lead, trending list, market brief, snapshot, or calendar changes. Every referenced slug must exist.
5. Validate before committing:
   ```bash
   npm run validate
   npm run validate -- --check-images
   ```

## Wikimedia Commons image workflow (exact API path)

Only use freely licensed images from `upload.wikimedia.org`, `images.unsplash.com`, or `images.pexels.com`. For Wikimedia Commons, use this exact API workflow:

1. Search Commons file pages:
   ```text
   https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=YOUR%20QUERY&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url%7Cextmetadata&format=json&origin=*
   ```
2. Select a result whose `imageinfo[0].url` begins with `https://upload.wikimedia.org/` and whose metadata confirms a usable free license.
3. Open the Commons file page from the returned page title (or `descriptionurl`) and record attribution from the source page. Put the direct `upload.wikimedia.org` URL in `image.url`; put the Commons file-page URL in `image.sourceUrl`.
4. Fill all required image metadata: meaningful `alt`, creator/agency `credit`, and `license` (for example, `CC BY-SA 4.0` or `Public domain`).
5. Confirm the selected direct URL returns an image before publishing:
   ```bash
   npm run validate -- --check-images
   ```

Never use wire-service or news-outlet photography. Never treat a search-result thumbnail as a licensed image.

## Git and deployment

Start from current `main`, rebase before changing content, stage only newsroom JSON, validate, then commit and push:

```bash
git pull --rebase origin main
git add content/
npm run validate
npm run validate -- --check-images
git commit -m "newsroom(<edition>): <short summary>"
git push origin main
```

Pushes to `main` trigger Vercel production deployment. Verify the resulting deployment in Vercel. If rebase conflicts occur, resolve only the intended `content/` changes, re-run both validation commands, then continue the rebase.
