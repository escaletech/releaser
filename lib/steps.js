const fs = require('fs')
const https = require('https')
const { URL } = require('url')
const chalk = require('chalk')
const prompts = require('prompts')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const DotJson = require('dot-json')

const { listCommits } = require('./commits')
const { getLastTag } = require('./tags')

function lookForLastTag ({ majorVersion }) {
  console.log(`${chalk.bold.yellow('…')} Looking for the next tag`)
  return getLastTag({ majorVersion })
}

async function printChanges ({ lastTag }) {
  const commits = await listCommits(lastTag)
  console.log(`${chalk.bold.cyan('!')} Considering these changes`)
  console.log('')
  console.log(commits || chalk.bold.black('  -- no changes since last tag --'))
  console.log('')
}

async function askToProceed ({ nextTag, lastTag }) {
  const message = `Create tag ${nextTag}?`
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: lastTag ? `${message} ${chalk.black(`(from ${lastTag})`)}` : message
  })

  if (!confirmed) {
    console.log(`${chalk.bold.redBright('✕')} Release cancelled`)
    process.exit(1)
  }
}

async function askForGmudTitle () {
  const { gmudTitle } = await prompts({
    type: 'text',
    name: 'gmudTitle',
    message: 'Informe o título da GMUD:'
  })

  const title = gmudTitle && gmudTitle.trim()

  if (!title) {
    console.log(`${chalk.bold.redBright('✕')} Título da GMUD é obrigatório`)
    process.exit(1)
  }

  return title
}

async function updatePackageJson ({ nextTag, dryRun }) {
  const version = nextTag.replace(/^v/, '')

  const patchedFiles = ['package.json']
  try {
    await promisify(fs.stat)('package-lock.json')
    patchedFiles.push('package-lock.json')
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  if (!dryRun) {
    patchedFiles.forEach(file => {
      const pkg = new DotJson(file)
      pkg.set('version', version).save('auto')
    })

    await runCommand(`git add ${patchedFiles.join(' ')}`)
    await runCommand(`git commit -m "release: ${nextTag}"`)
  }
}

async function applyTagAndPush ({ nextTag, dryRun, gpgSign, releaseTitle }) {
  console.log(`${chalk.bold.yellow('…')} Creating tag`)
  if (!dryRun) {
    await runCommand(buildTagCommand({ nextTag, gpgSign, releaseTitle }))
  }

  console.log(`${chalk.bold.yellow('…')} Pushing to origin`)
  const currentBranch = (await runCommand('git rev-parse --abbrev-ref HEAD')).trim()
  if (!dryRun) {
    await runCommand(`git push origin ${currentBranch} ${nextTag}`)
  }

  const repoUrl = (await runCommand('git remote get-url origin'))
    .trim()
    .replace('.com:', '.com/')
    .replace(/^git@/, 'https://')
    .replace(/\.git$/, '')

  console.log(`${chalk.bold.green('✔✔')} Tag created: ${repoUrl}/releases/tag/${nextTag}`)

  await createGithubRelease({
    dryRun,
    nextTag,
    releaseTitle,
    repoUrl
  })
}

async function fetchUpdates ({ dryRun }) {
  console.log(`${chalk.bold.yellow('…')} Fetching updates`)

  if (!dryRun) {
    await runCommand('git fetch')
  }
}

async function runCommand (command) {
  const result = await exec(command)
  return result.stdout
}

function buildTagCommand ({ nextTag, gpgSign, releaseTitle }) {
  const escapedTag = shellEscape(nextTag)

  if (gpgSign) {
    const message = releaseTitle ?? nextTag
    return `git tag -s ${escapedTag} -m ${shellEscape(message)}`
  }

  if (releaseTitle) {
    return `git tag -a ${escapedTag} -m ${shellEscape(releaseTitle)}`
  }

  return `git tag ${escapedTag}`
}

function shellEscape (value) {
  const stringValue = String(value)
  return `'${stringValue.replace(/'/g, `'"'"'`)}'`
}

async function createGithubRelease ({ dryRun, nextTag, releaseTitle, repoUrl }) {
  if (dryRun) {
    console.log(`${chalk.bold.yellow('…')} Skipping release creation (dry run)`)
    return
  }

  const repoSlug = getRepoSlugFromUrl(repoUrl)
  if (!repoSlug) {
    console.log(`${chalk.bold.redBright('✕')} Could not determine repository slug from ${repoUrl}`)
    process.exit(1)
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) {
    console.log(`${chalk.bold.redBright('✕')} Environment variable GITHUB_TOKEN (or GH_TOKEN) is required to create the release`)
    process.exit(1)
  }

  const payload = JSON.stringify({
    tag_name: nextTag,
    name: releaseTitle ?? nextTag,
    body: '',
    draft: false,
    prerelease: false
  })

  console.log(`${chalk.bold.yellow('…')} Creating GitHub release ${releaseTitle ?? nextTag}`)

  await githubRequest({
    token,
    method: 'POST',
    path: `/repos/${repoSlug}/releases`,
    body: payload
  })

  console.log(`${chalk.bold.green('✔✔')} Release created: https://github.com/${repoSlug}/releases/tag/${nextTag}`)
}

function getRepoSlugFromUrl (url) {
  if (!url) return null

  try {
    if (url.startsWith('git@')) {
      const [, path] = url.split(':')
      return path ? path.replace(/\.git$/, '') : null
    }

    const parsed = new URL(url)
    return parsed.pathname.replace(/^\/|\/$/g, '').replace(/\.git$/, '')
  } catch (error) {
    return null
  }
}

async function githubRequest ({ token, method, path, body }) {
  const options = {
    hostname: 'api.github.com',
    method,
    path,
    headers: {
      'User-Agent': 'releaser-script',
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }

  await new Promise((resolve, reject) => {
    const request = https.request(options, response => {
      let responseBody = ''

      response.on('data', chunk => {
        responseBody += chunk
      })

      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve()
          return
        }

        if (response.statusCode === 422) {
          console.log(`${chalk.bold.yellow('!')} Release already exists for ${path}`)
          resolve()
          return
        }

        reject(new Error(`GitHub request failed with status ${response.statusCode}: ${responseBody}`))
      })
    })

    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

module.exports = {
  lookForLastTag,
  printChanges,
  askToProceed,
  askForGmudTitle,
  updatePackageJson,
  applyTagAndPush,
  fetchUpdates
}
