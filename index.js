const ical = require('ical')
const RRule = require('rrule').RRule
const icalToolkit = require('ical-toolkit')
const builder = icalToolkit.createIcsFileBuilder()
const geocoder = require('cached-geocoder')()
const geohash = require('latlon-geohash')
const async = require('async')

const now = new Date()
const nextYearish = new Date(now.getTime() + (1000 * 60 * 60 * 24 * 367))

const format = function(entry, cb) {
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
  if (entry.location) {
    evt.location = entry.location
    geocoder.geocode(evt.location, function(err, results) {
      if (err) return cb(err)
      const result = results.results[0]
      if (result) {
        evt.geolocation = result
        evt.geohash = geohash.encode(result.geometry.location.lat, result.geometry.location.lng)
      }
      cb(null, evt)
    })
  } else {
    cb(null, evt)
  }

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
         async.map(events, format, function(err, jsonEvents) {
          // console.log(JSON.stringify(jsonEvents, null, 2))
          const ical = makeICal(events)
          cb(null, { json: jsonEvents, ical: ical })
        })
      }
    })
  })

}

module.exports = mergeCalendars