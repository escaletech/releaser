#! /usr/bin/env node
const { argv } = require('yargs')

const { getNextTag } = require('../lib/tags')
const {
  lookForLastTag,
  printChanges,
  askToProceed,
  updatePackageJson,
  applyTagAndPush,
  fetchUpdates
} = require('../lib/steps')

async function main () {
  const dryRun = argv.d || argv['dry-run']
  const shouldUpdatePackageJson = argv['update-package-json']
  const majorVersion = argv['major-version']
  const gpgSign = argv['gpg-sign']

  await fetchUpdates({ dryRun })

  const lastTag = await lookForLastTag({ majorVersion })

  await printChanges({ lastTag })

  const nextTag = await getNextTag(lastTag)

  await askToProceed({ nextTag, lastTag })

  if (shouldUpdatePackageJson) {
    await updatePackageJson({ nextTag, dryRun })
  }

  await applyTagAndPush({ nextTag, dryRun, gpgSign })
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
