#! /usr/bin/env node

const fs = require('fs')
const icalEvents = require('./index')
const argv = require('minimist')(process.argv.slice(2))

if (argv._.length === 0) {
  console.log("USAGE: ical-events [--json] [--ics] icsUrl [icsUrl [...]]")
}

const urls = argv._
const prefix = argv.o || 'calendar'

icalEvents(urls, function(err, result) {
  if (argv.ics) fs.writeFileSync(`${prefix}.ics`, result.ical)
  if (argv.json) fs.writeFileSync(`${prefix}.json`, JSON.stringify(result.json, null, 2))
  if (!argv.ics && !argv.json) console.log(JSON.stringify(result.json, null, 2))
})