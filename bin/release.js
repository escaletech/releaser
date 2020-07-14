#! /usr/bin/env node
const { argv } = require('yargs')

const { getNextTag } = require('../lib/tags')
const {
  lookForLastTag,
  printChanges,
  askToProceed,
  updatePackageJson,
  applyTagAndPush
} = require('../lib/steps')

async function main () {
  const dryRun = argv.d || argv['dry-run']

  const lastTag = await lookForLastTag()

  await printChanges({ lastTag })

  const nextTag = await getNextTag(lastTag)

  await askToProceed({ nextTag, lastTag })

  if (argv['update-package-json']) {
    await updatePackageJson({ nextTag, dryRun })
  }

  await applyTagAndPush({ nextTag, dryRun })
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
