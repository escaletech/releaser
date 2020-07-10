const chalk = require('chalk')
const prompts = require('prompts')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const { listCommits } = require('./commits')
const { getLastTag } = require('./tags')

function lookForLastTag () {
  console.log(`${chalk.bold.yellow('…')} Looking for the next tag`)
  return getLastTag()
}

async function printChanges ({ lastTag }) {
  const commits = await listCommits(lastTag)
  console.log(`${chalk.bold.cyan('!')} Considering these changes`)
  console.log('')
  console.log(commits || chalk.bold.black('  -- no changes since last tag --'))
  console.log('')
}

async function askToProceed ({ nextTag, lastTag }) {
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: `Create tag ${nextTag}? ${chalk.black(`(from ${lastTag})`)}`
  })

  if (!confirmed) {
    console.log(`${chalk.bold.redBright('✕')} Release cancelled`)
    process.exit(1)
  }
}

async function applyTagAndPush ({ nextTag }) {
  console.log(`${chalk.bold.yellow('…')} Creating tag`)
  await runCommand(`git tag ${nextTag}`)

  console.log(`${chalk.bold.yellow('…')} Pushing to origin`)
  const currentBranch = (await runCommand('git rev-parse --abbrev-ref HEAD')).trim()
  await runCommand(`git push origin ${currentBranch} ${nextTag}`)

  const repoUrl = (await runCommand('git remote get-url origin'))
    .trim()
    .replace('.com:', '.com/')
    .replace(/^git@/, 'https://')
    .replace(/\.git$/, '')

  console.log(`${chalk.bold.green('✔✔')} Tag created: ${repoUrl}/releases/tag/${nextTag}`)
}

async function runCommand (command) {
  const result = await exec(command)
  return result.stdout
}

module.exports = {
  lookForLastTag,
  printChanges,
  askToProceed,
  applyTagAndPush
}
