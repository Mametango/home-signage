const DEFAULT_URL = 'https://mametango.github.io/home-signage/latest-news.json'
const DEFAULT_MAX_AGE_MINUTES = 45

function getArg(name, fallback) {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match ? match.slice(prefix.length) : fallback
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

async function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) return
  const fs = await import('node:fs/promises')
  await fs.appendFile(outputPath, `${name}=${value}\n`, 'utf8')
}

const url = getArg('url', DEFAULT_URL)
const maxAgeMinutes = Number(getArg('max-age-minutes', DEFAULT_MAX_AGE_MINUTES))
const softStale = hasFlag('soft-stale')

if (!Number.isFinite(maxAgeMinutes) || maxAgeMinutes <= 0) {
  fail(`Invalid --max-age-minutes value: ${maxAgeMinutes}`)
}

const response = await fetch(`${url}?monitor=${Date.now()}`, {
  headers: {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'User-Agent': 'home-signage-news-monitor'
  }
})

if (!response.ok) {
  fail(`Failed to fetch latest news: ${response.status} ${response.statusText}`)
}

const payload = await response.json()
const generatedAt = new Date(payload.generatedAt)

if (!payload.generatedAt || Number.isNaN(generatedAt.getTime())) {
  fail('latest-news.json does not include a valid generatedAt value')
}

if (!Array.isArray(payload.news) || payload.news.length === 0) {
  fail('latest-news.json does not include any news items')
}

const ageMinutes = (Date.now() - generatedAt.getTime()) / 60000
const firstTitle = payload.news[0]?.title || '(no title)'

console.log(`latest-news.json generatedAt: ${payload.generatedAt}`)
console.log(`latest-news.json age: ${ageMinutes.toFixed(1)} minutes`)
console.log(`latest-news.json items: ${payload.news.length}`)
console.log(`latest-news.json first title: ${firstTitle}`)

if (ageMinutes > maxAgeMinutes) {
  const message = `latest-news.json is stale: ${ageMinutes.toFixed(1)} minutes old, max ${maxAgeMinutes} minutes`
  if (softStale) {
    console.warn(message)
    await setOutput('stale', 'true')
  } else {
    fail(message)
  }
} else {
  await setOutput('stale', 'false')
}
