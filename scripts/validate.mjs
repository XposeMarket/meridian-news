#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const articlesDir = resolve(root, 'content', 'articles');
const sitePath = resolve(root, 'content', 'site.json');
const checkImages = process.argv.includes('--check-images');
const sections = new Set(['markets', 'economy', 'ai-tech', 'autos', 'business', 'world', 'us', 'science', 'health', 'climate', 'crypto', 'sports', 'culture']);
const editions = new Set(['pre-market', 'midday', 'afternoon']);
const directions = new Set(['up', 'down', 'mixed', 'watch']);
const imageHosts = new Set(['upload.wikimedia.org', 'images.unsplash.com', 'images.pexels.com']);
const errors = [];
const articles = [];

function fail(file, message) { errors.push(`${file}: ${message}`); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function string(value) { return typeof value === 'string' && value.trim().length > 0; }
function isoUtc(value) { return string(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value)); }
function date(value) { return string(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value); }
function httpUrl(value) { try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function arrayOfStrings(value) { return Array.isArray(value) && value.every(string); }
function wordCount(value) { return string(value) ? value.trim().split(/\s+/).length : 0; }

function required(obj, key, file) { if (!(key in obj) || obj[key] === undefined || obj[key] === null || obj[key] === '') fail(file, `missing required field "${key}"`); }
function validateMarketImpact(value, file) {
  if (!object(value)) return fail(file, 'marketImpact must be an object');
  for (const key of ['summary', 'timeframe', 'confidence', 'tickers', 'catalysts']) required(value, key, file);
  if (!string(value.summary)) fail(file, 'marketImpact.summary must be a non-empty string');
  if (!string(value.timeframe)) fail(file, 'marketImpact.timeframe must be a non-empty string');
  if (!['low', 'medium', 'high'].includes(value.confidence)) fail(file, 'marketImpact.confidence must be low, medium, or high');
  if (!Array.isArray(value.tickers)) fail(file, 'marketImpact.tickers must be an array');
  else value.tickers.forEach((ticker, index) => {
    if (!object(ticker)) return fail(file, `marketImpact.tickers[${index}] must be an object`);
    for (const key of ['symbol', 'direction', 'rationale']) required(ticker, key, file);
    if (!string(ticker.symbol) || !string(ticker.rationale)) fail(file, `marketImpact.tickers[${index}] needs non-empty symbol and rationale`);
    if (!directions.has(ticker.direction)) fail(file, `marketImpact.tickers[${index}].direction is invalid`);
  });
  if (!Array.isArray(value.catalysts)) fail(file, 'marketImpact.catalysts must be an array');
  else value.catalysts.forEach((catalyst, index) => {
    if (!object(catalyst)) return fail(file, `marketImpact.catalysts[${index}] must be an object`);
    if (!date(catalyst.date) || !string(catalyst.event)) fail(file, `marketImpact.catalysts[${index}] needs date (YYYY-MM-DD) and event`);
  });
}

function validateArticle(article, file) {
  const requiredFields = ['slug', 'title', 'dek', 'section', 'tags', 'author', 'publishedAt', 'updatedAt', 'edition', 'featured', 'breaking', 'readMinutes', 'image', 'keyPoints', 'body', 'sources'];
  requiredFields.forEach((key) => required(article, key, file));
  const stem = basename(file, '.json');
  const match = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(stem);
  if (!match) fail(file, 'filename must be YYYY-MM-DD-slug.json');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || '')) fail(file, 'slug must be kebab-case');
  if (match && article.slug !== match[2]) fail(file, 'slug must match the filename suffix');
  if (!string(article.title) || !string(article.dek) || !string(article.author)) fail(file, 'title, dek, and author must be non-empty strings');
  if (!sections.has(article.section)) fail(file, 'section must be a valid section id');
  if (!arrayOfStrings(article.tags) || article.tags.length === 0) fail(file, 'tags must be a non-empty array of strings');
  if (!isoUtc(article.publishedAt) || !isoUtc(article.updatedAt)) fail(file, 'publishedAt and updatedAt must be ISO 8601 UTC timestamps');
  if (!editions.has(article.edition)) fail(file, 'edition must be pre-market, midday, or afternoon');
  if (typeof article.featured !== 'boolean' || typeof article.breaking !== 'boolean') fail(file, 'featured and breaking must be booleans');
  if (!Number.isInteger(article.readMinutes) || article.readMinutes < 1) fail(file, 'readMinutes must be a positive integer');
  if (!object(article.image)) fail(file, 'image must be an object');
  else {
    for (const key of ['url', 'alt', 'credit', 'license', 'sourceUrl']) required(article.image, key, file);
    if (!httpUrl(article.image.url)) fail(file, 'image.url must be an HTTP(S) URL');
    else if (!imageHosts.has(new URL(article.image.url).hostname)) fail(file, 'image.url host is not on the approved allowlist');
    if (!string(article.image.alt) || !string(article.image.credit) || !string(article.image.license)) fail(file, 'image alt, credit, and license are required');
    if (!httpUrl(article.image.sourceUrl)) fail(file, 'image.sourceUrl must be an HTTP(S) URL');
  }
  if (!arrayOfStrings(article.keyPoints) || article.keyPoints.length < 3 || article.keyPoints.length > 5) fail(file, 'keyPoints must contain 3-5 non-empty strings');
  if (wordCount(article.body) < 300) fail(file, 'body must contain at least 300 words');
  if (!Array.isArray(article.sources) || article.sources.length < 2) fail(file, 'sources must contain at least 2 entries');
  else article.sources.forEach((source, index) => {
    if (!object(source)) return fail(file, `sources[${index}] must be an object`);
    for (const key of ['title', 'publisher', 'url', 'accessedAt']) required(source, key, file);
    if (!string(source.title) || !string(source.publisher) || !httpUrl(source.url) || !date(source.accessedAt)) fail(file, `sources[${index}] needs title, publisher, HTTP(S) url, and accessedAt YYYY-MM-DD`);
  });
  if (['markets', 'business', 'crypto'].includes(article.section)) validateMarketImpact(article.marketImpact, file);
  else if ('marketImpact' in article) validateMarketImpact(article.marketImpact, file);
  if ('corrections' in article && (!Array.isArray(article.corrections) || article.corrections.some((item) => !object(item) || !date(item.date) || !string(item.note)))) fail(file, 'corrections entries need date (YYYY-MM-DD) and note');
}

function validateSite(site) {
  const file = 'content/site.json';
  if (!object(site)) return fail(file, 'must contain an object');
  for (const key of ['updatedAt', 'edition', 'leadSlug', 'marketBrief', 'marketSnapshot', 'calendar', 'trending']) required(site, key, file);
  if (!isoUtc(site.updatedAt)) fail(file, 'updatedAt must be ISO 8601 UTC');
  if (!editions.has(site.edition)) fail(file, 'edition must be pre-market, midday, or afternoon');
  if (!string(site.leadSlug)) fail(file, 'leadSlug must be a non-empty slug');
  if (!object(site.marketBrief)) fail(file, 'marketBrief must be an object');
  else {
    for (const key of ['headline', 'summary', 'bullets', 'asOf']) required(site.marketBrief, key, file);
    if (!string(site.marketBrief.headline) || !string(site.marketBrief.summary) || !arrayOfStrings(site.marketBrief.bullets) || site.marketBrief.bullets.length < 4 || site.marketBrief.bullets.length > 6 || !isoUtc(site.marketBrief.asOf)) fail(file, 'marketBrief needs headline, summary, 4-6 bullets, and ISO UTC asOf');
  }
  if (!Array.isArray(site.marketSnapshot)) fail(file, 'marketSnapshot must be an array');
  else site.marketSnapshot.forEach((item, index) => { if (!object(item) || !string(item.label) || !string(item.value) || !string(item.change) || !directions.has(item.direction)) fail(file, `marketSnapshot[${index}] needs label, value, change, and valid direction`); });
  if (!Array.isArray(site.calendar)) fail(file, 'calendar must be an array');
  else site.calendar.forEach((item, index) => { if (!object(item) || !date(item.date) || !string(item.time) || !string(item.event) || !['low', 'medium', 'high'].includes(item.importance) || !string(item.why)) fail(file, `calendar[${index}] has an invalid shape`); });
  if (!arrayOfStrings(site.trending)) fail(file, 'trending must be an array of slugs');
  const slugs = new Set(articles.map(({ slug }) => slug));
  if (string(site.leadSlug) && !slugs.has(site.leadSlug)) fail(file, 'leadSlug must reference an existing article');
  (Array.isArray(site.trending) ? site.trending : []).forEach((slug) => { if (!slugs.has(slug)) fail(file, `trending slug "${slug}" does not reference an existing article`); });
}

if (existsSync(articlesDir)) {
  for (const filename of readdirSync(articlesDir).filter((name) => name.endsWith('.json') && !name.startsWith('_')).sort()) {
    const file = resolve(articlesDir, filename);
    try {
      const article = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      if (!object(article)) fail(`content/articles/${filename}`, 'must contain a JSON object');
      else { validateArticle(article, `content/articles/${filename}`); articles.push(article); }
    } catch (error) { fail(`content/articles/${filename}`, `invalid JSON: ${error.message}`); }
  }
}
const seen = new Set();
for (const article of articles) { if (seen.has(article.slug)) fail('content/articles', `duplicate slug "${article.slug}"`); seen.add(article.slug); }
if (existsSync(sitePath)) {
  try { validateSite(JSON.parse(readFileSync(sitePath, 'utf8').replace(/^\uFEFF/, ''))); } catch (error) { fail('content/site.json', `invalid JSON: ${error.message}`); }
} else if (articles.length > 0) fail('content/site.json', 'is required once articles exist');

// Image verification. Wikimedia (and other CDNs) answer bursts with HTTP 429.
// A rate limit says nothing about whether the image exists, so requests are
// throttled, 429/503 are retried with backoff (honouring Retry-After), and an
// image that is still rate-limited after retries becomes a WARNING, not an
// error. Real failures (404, 403, non-image content, DNS/timeouts) still fail.
const warnings = [];
const checked = new Set();
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const userAgent = 'Meridian-content-validator/1.1 (https://meridian-news-two.vercel.app; newsroom image verification)';
async function probe(url) {
  let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': userAgent } });
  if (response.status !== 200 && response.status !== 429 && response.status !== 503) {
    response = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': userAgent, Range: 'bytes=0-1023' } });
  }
  await response.body?.cancel();
  return response;
}
async function verifyImages() {
  const onlyRecent = process.argv.find((arg) => arg.startsWith('--since='));
  const since = onlyRecent ? onlyRecent.split('=')[1] : null;
  const images = articles
    .filter((article) => !since || String(article.updatedAt || article.publishedAt || '').slice(0, 10) >= since)
    .map((article) => ({ file: `content/articles/${article.slug}.json`, url: article.image?.url }))
    .filter((image) => httpUrl(image.url));
  for (const image of images) {
    if (checked.has(image.url)) continue;
    checked.add(image.url);
    try {
      let response;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        response = await probe(image.url);
        if (response.status !== 429 && response.status !== 503) break;
        const retryAfter = Number(response.headers.get('retry-after'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 2000 * 2 ** attempt);
      }
      if (response.status === 429 || response.status === 503) warnings.push(`${image.file}: image host rate-limited (HTTP ${response.status}) after retries; not treated as broken: ${image.url}`);
      else if (response.status !== 200 && response.status !== 206) fail(image.file, `image URL returned HTTP ${response.status}: ${image.url}`);
      else if (!response.headers.get('content-type')?.startsWith('image/')) fail(image.file, `image URL did not return an image: ${image.url}`);
    } catch (error) { fail(image.file, `image URL check failed: ${image.url} (${error.message})`); }
    await sleep(400);
  }
}
if (checkImages) await verifyImages();
if (warnings.length) console.warn(`Warnings (${warnings.length}):\n- ${warnings.join('\n- ')}`);
if (errors.length) { console.error(`Validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Validation passed: ${articles.length} article${articles.length === 1 ? '' : 's'}${checkImages ? `; ${checked.size} image URL(s) checked${warnings.length ? ` (${warnings.length} rate-limited, see warnings)` : ''}` : ''}.`);
