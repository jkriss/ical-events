const ical = require('ical')

const now = new Date()
const nextYearish = new Date(now.getTime() + (1000 * 60 * 60 * 24 * 367))

const format = function(entry) {
  const evt = {}
  evt.summary = entry.summary
  if (entry.description && entry.description.trim() !== '') evt.description = entry.description
  evt.start = entry.start
  evt.end = entry.end
  console.log(entry.summary)
  console.log(entry.location, entry.start, 'to', entry.end)
  if (entry.rrule) {
    // console.log(entry.rrule)
    // var rule = new RRule(entry.rrule.origOptions)
    evt.repeats = entry.rrule.toText()
    evt.upcoming = entry.rrule.between(now, nextYearish).slice(0,5)
    console.log(evt.repeats)
    console.log("upcoming:", evt.upcoming)
  }
  return evt
}

let events = []

ical.fromURL('https://calendar.google.com/calendar/ical/afhvm1spb2ap2ldc513p7culpg%40group.calendar.google.com/private-394f049e611065f2f9ed1fe2e9a136e7/basic.ics', {}, function(err, data) {
// ical.fromURL('https://calendar.google.com/calendar/ical/l7jsc4l2uo5j9il5u7pq9frt7k%40group.calendar.google.com/private-7256f3d1addc06a8ff32ee68eece20f5/basic.ics', {}, function(err, data) {
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
  // sort by start date
  events = events.sort(function(a,b) { return a.next - b.next })
  const jsonEvents = events.map(format)
  console.log(JSON.stringify(jsonEvents, null, 2))
})

