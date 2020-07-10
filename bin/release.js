#! /usr/bin/env node
const { getNextTag } = require('../lib/tags')
const { lookForLastTag, printChanges, askToProceed, applyTagAndPush } = require('../lib/steps')

async function main () {
  const lastTag = await lookForLastTag()

  await printChanges({ lastTag })

  const nextTag = await getNextTag(lastTag)

  await askToProceed({ nextTag, lastTag })

  await applyTagAndPush({ nextTag })
}

main()
  .catch(err => console.error(err) || process.exit(1))
