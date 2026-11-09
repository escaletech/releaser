#! /usr/bin/env node
const fs = require('fs')
const path = require('path')
const argv = require('yargs-parser')(process.argv.slice(2), {
  boolean: ['help', 'version'],
  // Como no yargs: o que vem depois de `--` não conta como posicional `help`
  configuration: { 'populate--': true }
})

// Mantém o --help/--version que o yargs respondia (vale o que vier primeiro)
const infoFlag = process.argv.slice(2)
  .map(arg => arg.replace(/^--|=.*$/g, ''))
  .find(key => (key === 'help' || key === 'version') && argv[key])
if (infoFlag === 'version') {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  console.log(pkg.version)
  process.exit(0)
}
// O yargs também mostrava a ajuda quando o último posicional era `help`
if (infoFlag === 'help' || (!infoFlag && argv._[argv._.length - 1] === 'help')) {
  console.log([
    'Options:',
    '  --help     Show help                                                 [boolean]',
    '  --version  Show version number                                       [boolean]'
  ].join('\n'))
  process.exit(0)
}

const { getNextTag } = require('../lib/tags')
const {
  lookForLastTag,
  printChanges,
  askToProceed,
  updatePackageJson,
  applyTagAndPush,
  fetchUpdates,
  askForGmudTitle
} = require('../lib/steps')

async function main () {
  const dryRun = argv.d || argv['dry-run']
  const shouldUpdatePackageJson = argv['update-package-json']
  const majorVersion = argv['major-version']
  const gpgSign = argv['gpg-sign']
  const releaseTitle = await askForGmudTitle()

  await fetchUpdates({ dryRun })

  const lastTag = await lookForLastTag({ majorVersion })

  await printChanges({ lastTag })

  const nextTag = await getNextTag(lastTag)

  await askToProceed({ nextTag, lastTag })

  if (shouldUpdatePackageJson) {
    await updatePackageJson({ nextTag, dryRun })
  }

  await applyTagAndPush({ nextTag, dryRun, gpgSign, releaseTitle })
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
