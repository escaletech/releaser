const getRawCommits = require('git-raw-commits')
const concat = require('concat-stream')
const chalk = require('chalk')

async function listCommits (from) {
  const commits = await new Promise(resolve => {
    getRawCommits({ format: '%s', from })
      .pipe(concat(data => resolve(data.toString())))
  })
  return commits
    .split('\n')
    .filter(line => line)
    .map(formatCommit)
    .join('\n')
}

function formatCommit (message) {
  const [left, right] = message.split(': ', 2)
  return right
    ? `  * ${colorLevel(left)}: ${chalk.whiteBright(right)}`
    : `  * ${message}`
}

function colorLevel (level) {
  switch (level.toLowerCase()) {
    case 'feat':
      return chalk.bold.underline.greenBright(level)
    case 'feat!':
      return chalk.bold.bgGreenBright(level)
    case 'fix':
      return chalk.bold.underline.redBright(level)
    case 'fix!':
      return chalk.bold.bgRedBright(level)
    default:
      return level.endsWith('!')
        ? chalk.whiteBright.bgCyan(level)
        : chalk.underline.cyan(level)
  }
}

module.exports = {
  listCommits
}
