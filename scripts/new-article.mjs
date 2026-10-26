#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [section, slug] = process.argv.slice(2);
const sections = new Set(['markets', 'economy', 'ai-tech', 'autos', 'business', 'world', 'us', 'science', 'health', 'climate', 'crypto', 'sports', 'culture']);
const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
if (!sections.has(section) || !kebabCase.test(slug || '')) {
  console.error('Usage: node scripts/new-article.mjs <section> <kebab-case-slug>');
  console.error(`Sections: ${[...sections].join(', ')}`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'content', 'articles');
const file = resolve(dir, `${today}-${slug}.json`);
if (existsSync(file)) { console.error(`Refusing to overwrite existing file: ${file}`); process.exit(1); }
mkdirSync(dir, { recursive: true });
const placeholder = 'REPLACE BEFORE PUBLISHING';
const article = {
  slug,
  title: placeholder,
  dek: placeholder,
  section,
  tags: ['replace-tag'],
  author: 'Meridian Newsroom',
  publishedAt: `${today}T12:00:00Z`,
  updatedAt: `${today}T12:00:00Z`,
  edition: 'midday',
  featured: false,
  breaking: false,
  readMinutes: 4,
  image: { url: 'https://upload.wikimedia.org/REPLACE-BEFORE-PUBLISHING.jpg', alt: placeholder, credit: placeholder, license: placeholder, sourceUrl: 'https://commons.wikimedia.org/wiki/File:REPLACE_BEFORE_PUBLISHING' },
  keyPoints: [placeholder, placeholder, placeholder],
  body: `${placeholder}. This scaffold is intentionally not publishable: replace every placeholder with original, sourced reporting of at least 300 words.`,
  marketImpact: { summary: placeholder, timeframe: placeholder, confidence: 'medium', tickers: [{ symbol: 'REPLACE', direction: 'watch', rationale: placeholder }], catalysts: [{ date: today, event: placeholder }] },
  sources: [{ title: placeholder, publisher: placeholder, url: 'https://example.com/REPLACE-BEFORE-PUBLISHING', accessedAt: today }, { title: placeholder, publisher: placeholder, url: 'https://example.org/REPLACE-BEFORE-PUBLISHING', accessedAt: today }]
};
writeFileSync(file, `${JSON.stringify(article, null, 2)}\n`);
console.log(`Created ${file}`);
console.log('This is an intentionally invalid draft. Replace every placeholder, then run npm run validate.');
