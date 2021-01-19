#!/usr/bin/env node

/*!
 * Script to update version number references in the project.
 * Copyright 2017-2021 The Bootstrap Authors
 * Copyright 2017-2021 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */

'use strict'

const fs = require('fs').promises
const path = require('path')
const globby = require('globby')

const VERBOSE = process.argv.includes('--verbose')
const DRY_RUN = process.argv.includes('--dry') || process.argv.includes('--dry-run')

const ROOT_DIR = path.join(__dirname, '..')
const GLOB = [
  '**/*.{css,html,js,json,md,scss,txt,yml}'
]
const GLOBBY_OPTIONS = {
  cwd: ROOT_DIR,
  gitignore: true
}

// Blame TC39... https://github.com/benjamingr/RegExp.escape/issues/37
function regExpQuote(string) {
  return string.replace(/[$()*+-.?[\\\]^{|}]/g, '\\$&')
}

function regExpQuoteReplacement(string) {
  return string.replace(/\$/g, '$$')
}

async function replaceRecursively(file, oldVersion, newVersion) {
  const originalString = await fs.readFile(file, 'utf8')
  const newString = originalString.replace(
    new RegExp(regExpQuote(oldVersion), 'g'), regExpQuoteReplacement(newVersion)
  )

  if (originalString === newString) {
    return
  }

  if (VERBOSE) {
    console.log(`FILE: ${file}`)
  }

  if (DRY_RUN) {
    return
  }

  await fs.writeFile(file, newString, 'utf8')
}

async function main(args) {
  const [oldVersion, newVersion] = args

  if (!oldVersion || !newVersion) {
    console.error('USAGE: change-version old_version new_version [--verbose] [--dry[-run]]')
    console.error('Got arguments:', args)
    process.exit(1)
  }

  try {
    const files = await globby(GLOB, GLOBBY_OPTIONS)

    await Promise.all(files.map(file => replaceRecursively(file, oldVersion, newVersion)))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main(process.argv.slice(2))
