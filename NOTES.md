It should be pretty easy to set this up and a lambda function to run every hour or whatever, writing the json (and eventually, ical) to an open s3 bucket.

Also might be worth writing a cron type module for altcloud.

Hm. Could also write parsers for things like https://docs.google.com/spreadsheets/d/1GTC3hOpeq2wypEvPfN5eDVG9ZHaOPIBl0GDdNFwrXl0/edit#gid=0.

Should probably use a library that works in both directions, don't want to lose data in between. Also, need that "all day" flag.