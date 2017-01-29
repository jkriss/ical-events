const ical = require('ical')
const RRule = require('rrule').RRule
const fs = require('fs')
const icalToolkit = require('ical-toolkit')
const builder = icalToolkit.createIcsFileBuilder()

const now = new Date()
const nextYearish = new Date(now.getTime() + (1000 * 60 * 60 * 24 * 367))

const format = function(entry) {
  const evt = {}
  evt.summary = entry.summary
  if (entry.description && entry.description.trim() !== '') evt.description = entry.description
  evt.start = entry.start
  evt.end = entry.end
  // console.log(entry.summary)
  // console.log(entry.location, entry.start, 'to', entry.end)
  if (entry.rrule) {
    // console.log(entry.rrule)
    // var rule = new RRule(entry.rrule.origOptions)
    evt.repeats = entry.rrule.toText()
    evt.upcoming = entry.rrule.between(now, nextYearish).slice(0,5)
    // console.log(evt.repeats)
    // console.log("upcoming:", evt.upcoming)
  }
  return evt
}

const makeICal = function(events) {
  builder.calname = 'Merged Calendar'
  builder.timezone = 'america/san_francisco'
  builder.tzid = 'america/san_francisco'
  builder.method = 'REQUEST'
  events.forEach(function(event) {
    const icalEvent = Object.assign({}, event)
    if (event.rrule) {
      icalEvent.repeating = event.rrule.origOptions
      icalEvent.repeating.freq = RRule.FREQUENCIES[event.rrule.origOptions.freq]
    }
    builder.events.push(icalEvent)
  })
  return builder.toString()
}

const mergeCalendars = function(urls, cb) {
  let events = []

  let count = urls.length
  urls.forEach(function(url) {
    ical.fromURL(url, {}, function(err, data) {
      Object.values(data).forEach(function(entry) {
        if (entry.type === 'VTIMEZONE') {
          // console.log(entry.tzid)
        } else if (entry.type === 'VEVENT') {
          if ((entry.end || entry.start) < now) return
          // print(entry)
          entry.next = entry.start
          // if it's recurring, get the next future one
          if (entry.rrule) {
            entry.rrule.between(now, nextYearish)[0].start
          }
          events.push(entry)
        }
      })
      count--
      if (count === 0) {
        // sort by start date
        events = events.sort(function(a,b) { return a.next - b.next })
        const jsonEvents = events.map(format)
        // console.log(JSON.stringify(jsonEvents, null, 2))
        const ical = makeICal(events)
        cb(null, { json: jsonEvents, ical: ical })
      }
    })
  })

}

const icals = [
  'https://calendar.google.com/calendar/ical/afhvm1spb2ap2ldc513p7culpg%40group.calendar.google.com/private-394f049e611065f2f9ed1fe2e9a136e7/basic.ics',
  'https://calendar.google.com/calendar/ical/l7jsc4l2uo5j9il5u7pq9frt7k%40group.calendar.google.com/private-7256f3d1addc06a8ff32ee68eece20f5/basic.ics'
]

mergeCalendars(icals, function(err, result) {
  // console.log(result.json)
  // console.log(result.ical)
  fs.writeFileSync('merged-calendar.ics', result.ical)
  fs.writeFileSync('merged-calendar.json', JSON.stringify(result.json, null, 2))
})