const { promisify } = require('util')
const getTags = promisify(require('git-semver-tags'))
const { major, inc } = require('semver')
const getRecommendedBump = promisify(require('conventional-recommended-bump'))

async function getLastTag () {
  const allTags = await getTags()
  return allTags[0] || ''
}

async function getNextTag (lastTag) {
  if (!lastTag) {
    return 'v0.1.0'
  }

  const recommendedBump = await getRecommendedBump({ preset: 'angular' })
  const increment = recommendedBump.releaseType === 'major' && major(lastTag) === 0
    ? 'minor'
    : recommendedBump.releaseType
  return `v${inc(lastTag, increment)}`
}

module.exports = {
  getLastTag,
  getNextTag
}
