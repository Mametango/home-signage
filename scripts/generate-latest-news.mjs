import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as cheerio from 'cheerio'

const LIST_URL = 'https://news.web.nhk/newsweb/pl/news-nwa-latest-nationwide'
const OUTPUT_DIR = resolve(process.cwd(), 'public')
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'latest-news.json')

const ARTICLE_PATH_RE = /\/newsweb\/(na\/na-k|html\/)/i

function absoluteUrl(url = '') {
  if (!url) return ''
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://news.web.nhk${url}`
  return url
}

function cleanText(value = '') {
  return value.replace(/\s+/g, ' ').trim()
}

function extractMeta($, selectors) {
  for (const selector of selectors) {
    const value = $(selector).first().attr('content') || $(selector).first().text()
    const cleaned = cleanText(value || '')
    if (cleaned) return cleaned
  }
  return ''
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  })

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`)
  }

  return response.text()
}

async function collectArticleLinks() {
  const html = await fetchHtml(LIST_URL)
  const $ = cheerio.load(html)
  const seen = new Set()
  const links = []

  $('a[href]').each((_, element) => {
    const href = absoluteUrl($(element).attr('href') || '')
    if (!ARTICLE_PATH_RE.test(href)) return
    if (href.includes('/genre/') || href.includes('/pl/') || seen.has(href)) return
    seen.add(href)
    links.push(href)
  })

  return links.slice(0, 12)
}

async function scrapeArticle(link, index) {
  const html = await fetchHtml(link)
  const $ = cheerio.load(html)

  const title = extractMeta($, [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]'
  ]).replace(/\s*\|\s*NHKニュース.*$/, '')

  const description = extractMeta($, [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]'
  ])

  const image = absoluteUrl(extractMeta($, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]'
  ]))

  const video = absoluteUrl(extractMeta($, [
    'meta[property="og:video"]',
    'meta[property="og:video:url"]',
    'meta[property="og:video:secure_url"]'
  ]))

  const pubDate =
    $('meta[property="article:published_time"]').first().attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    new Date().toISOString()

  if (!title) return null

  return {
    id: 50000 + index,
    title,
    link,
    pubDate,
    description: description || undefined,
    category: '全国ニュース',
    image: image || undefined,
    video: video || undefined
  }
}

async function main() {
  try {
    const links = await collectArticleLinks()
    const articles = await Promise.allSettled(links.map((link, index) => scrapeArticle(link, index)))
    const news = articles
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => result.value)

    await mkdir(OUTPUT_DIR, { recursive: true })
    await writeFile(
      OUTPUT_FILE,
      JSON.stringify({ generatedAt: new Date().toISOString(), news }, null, 2),
      'utf8'
    )

    console.log(`Generated ${news.length} news items at ${OUTPUT_FILE}`)
  } catch (error) {
    console.error('Failed to generate latest-news.json:', error)
    process.exitCode = 1
  }
}

await main()
