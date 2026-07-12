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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchStatus(url, maxAgeMinutes) {
  const response = await fetch(`${url}?monitor=${Date.now()}`, {
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'User-Agent': 'home-signage-news-monitor'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch latest news: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  const generatedAt = new Date(payload.generatedAt)

  if (!payload.generatedAt || Number.isNaN(generatedAt.getTime())) {
    throw new Error('latest-news.json does not include a valid generatedAt value')
  }

  if (!Array.isArray(payload.news) || payload.news.length === 0) {
    throw new Error('latest-news.json does not include any news items')
  }

  const ageMinutes = (Date.now() - generatedAt.getTime()) / 60000
  const firstTitle = payload.news[0]?.title || '(no title)'

  return {
    ageMinutes,
    firstTitle,
    generatedAt: payload.generatedAt,
    itemCount: payload.news.length,
    stale: ageMinutes > maxAgeMinutes
  }
}

function logStatus(status) {
  console.log(`latest-news.json generatedAt: ${status.generatedAt}`)
  console.log(`latest-news.json age: ${status.ageMinutes.toFixed(1)} minutes`)
  console.log(`latest-news.json items: ${status.itemCount}`)
  console.log(`latest-news.json first title: ${status.firstTitle}`)
}

const url = getArg('url', DEFAULT_URL)
const maxAgeMinutes = Number(getArg('max-age-minutes', DEFAULT_MAX_AGE_MINUTES))
const retries = Number(getArg('retries', 0))
const retryDelaySeconds = Number(getArg('retry-delay-seconds', 30))
const softStale = hasFlag('soft-stale')

if (!Number.isFinite(maxAgeMinutes) || maxAgeMinutes <= 0) {
  fail(`Invalid --max-age-minutes value: ${maxAgeMinutes}`)
}

if (!Number.isInteger(retries) || retries < 0) {
  fail(`Invalid --retries value: ${retries}`)
}

if (!Number.isFinite(retryDelaySeconds) || retryDelaySeconds < 0) {
  fail(`Invalid --retry-delay-seconds value: ${retryDelaySeconds}`)
}

let lastStatus
let lastError
let passed = false

for (let attempt = 0; attempt <= retries; attempt += 1) {
  try {
    lastStatus = await fetchStatus(url, maxAgeMinutes)
    logStatus(lastStatus)

    if (!lastStatus.stale) {
      await setOutput('stale', 'false')
      passed = true
      break
    }

    lastError = new Error(
      `latest-news.json is stale: ${lastStatus.ageMinutes.toFixed(1)} minutes old, max ${maxAgeMinutes} minutes`
    )
  } catch (error) {
    lastError = error
    console.error(error.message)
  }

  if (attempt < retries) {
    console.warn(`Retrying latest-news check in ${retryDelaySeconds}s (${attempt + 1}/${retries})`)
    await sleep(retryDelaySeconds * 1000)
  }
}

if (passed) {
  process.exitCode = 0
} else if (softStale && lastStatus?.stale) {
  console.warn(lastError.message)
  await setOutput('stale', 'true')
  process.exitCode = 0
} else {
  fail(lastError?.message || 'latest-news.json freshness check failed')
}
