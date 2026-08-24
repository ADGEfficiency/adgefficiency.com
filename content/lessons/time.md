---
id: time
aliases: []
tags: []
competencies:
  - Analytics
  - Software Engineering
date_created: "2025-08-23"
date_updated: "2026-08-24"
description: Learn to handle dates, times, and timezones in data analysis and programming.
draft: false
title: Time
toc_end_level: 2
---

## What is Time?

**Correct manipulation of time is a must have data skill**.

This lesson covers:

- **Dates, times and datetimes**: Creating them, taking them apart, moving them around.
- **Timezones**: What they are, why they are hard, and how to localize and convert.
- **Daylight saving**: Missing hours, duplicate hours, and the days that are not 24 hours long.
- **Datetime representations**: Partitioned, offset and string representations of the same instant.
- **Datetime strings**: ISO 8601, format codes, `strftime` and `strptime`.

This lesson uses the Python standard library - timezones come from the `zoneinfo` module.

### Resources

- [Python strftime cheat sheet](https://strftime.org/) - Every format code in one table.
- [strftime reference and sandbox](https://www.strfti.me/) - Interactive format code playground.
- [Storing UTC is not a silver bullet](https://codeblog.jonskeet.uk/2019/03/27/storing-utc-is-not-a-silver-bullet/) - Why "just use UTC" is incomplete advice.
- [PEP 495](https://peps.python.org/pep-0495/) - How Python represents the ambiguous hour during daylight saving.

## Why Learn About Time?

Almost every dataset has a time dimension in at least one column - a `last_modified_utc`, a settlement period, a meter reading interval.

**Managing time in data also has specific challenges** - timezones, daylight saving, and the many ways a datetime can be represented, all offer hard problems that can be mitigated to easy if you manage things correctly.

Timezones force us to consider the same instant in time in different places.  Daylight saving forces us to consider a discontinuity in time itself.

Where timezone boundaries sit, whether daylight saving applies, which end of a date string the day goes - these are conventions. They are arbitrary but consistent.

Working with time requires a certain amount of boilerplate knowledge - that the format code for year is `%Y`, what ISO 8601 is, what `strptime` does. This sits alongside a genuine understanding of what a point in time actually is.

## Dates, Times & Datetimes

**A date is made of a year, month and day**:

```python
import datetime

print(datetime.date(2020, 1, 1))
```

```output
2020-01-01
```

We can access the elements of a `date` as attributes:

```python
dt = datetime.date(2020, 1, 1)
print(dt.year, dt.day)
```

```output
2020 1
```

A date does not specify a precise point in time - it covers a whole day. This is why **dates cannot be timezone aware**.

**A time is made of hours, minutes and seconds**:

```python
import datetime

print(datetime.time(12, 30, 0))
```

```output
12:30:00
```

The elements are attributes, the same as for a date:

```python
dt = datetime.time(12, 30, 0)
print(dt.hour, dt.minute)
```

```output
12 30
```

**A datetime is a date and a time together**:

```python
import datetime

print(datetime.datetime(2050, 12, 25, 18, 30))
```

```output
2050-12-25 18:30:00
```

Attribute access works the same way - below we access the year of a datetime:

```python
dt = datetime.datetime(2050, 12, 25, 18, 30)
print(dt.year)
```

```output
2050
```

## Datetime Manipulation

### Combine

The `combine` method builds a `datetime` from a `date` and a `time`:

```python
import datetime

print(datetime.datetime.combine(datetime.date(2020, 1, 1), datetime.time(12, 30)))
```

```output
2020-01-01 12:30:00
```

### Replace

The `replace` method returns a new datetime with attributes changed:

```python
import datetime

dt = datetime.datetime(2020, 1, 1, 12, 30)
print(dt.replace(year=2021))
```

```output
2021-01-01 12:30:00
```

`replace` does not modify the original - datetimes are immutable.

### Getting the Current Time

We can get the current time in UTC:

```python
import datetime

print(datetime.datetime.now(datetime.UTC))
```

```output
2026-08-23 14:51:16.624685+00:00
```

**Use `datetime.now(datetime.UTC)` rather than `datetime.utcnow()`.** `utcnow` is deprecated since Python 3.12, and it returned a naive datetime holding UTC time - a value that claimed no timezone while secretly being in one. That combination caused a lot of bugs.

`datetime.datetime.today()` gives you local time, and is timezone naive.

### Timedeltas

**A `timedelta` is a duration** - the difference between two datetimes, or an offset to apply to one:

```python
import datetime

dt = datetime.datetime(2020, 1, 1, 12, 30)
print(dt + datetime.timedelta(hours=1))
```

```output
2020-01-01 13:30:00
```

Subtracting two datetimes gives a `timedelta`:

```python
print(datetime.datetime(2020, 1, 2) - datetime.datetime(2020, 1, 1))
```

```output
1 day, 0:00:00
```

Adding `timedelta(hours=24)` is not always the same as moving to the same time tomorrow. On a daylight saving boundary those two ideas come apart, which we return to below.

## Timezones

Our ability to communicate and travel over large distances requires us to reference time all across the planet - past, present and future, in many locations, at the same instant in time.

**Timezones force us to do something unnatural - consider the same point in time in different places.**

Timezones are arbitrary - where we draw timezone boundaries is a political decision. China spans about five geographic timezones and uses one.

Timezones also change. Cities move from one timezone to another, and governments change daylight saving rules with a few months notice.

### UTC

**UTC stands for Coordinated Universal Time - it is the anchor that all other timezones are defined against.**

UTC is a *standard* timezone - it does not observe daylight saving, and it will not change.

### Timezone Naive vs. Timezone Aware

**A naive datetime has no timezone attached - it is a wall clock reading with no location.**

```python
import datetime

dt = datetime.datetime(2050, 12, 25, 18, 30)
print(dt.tzinfo)
```

```output
None
```

**An aware datetime knows its offset from UTC - it identifies an actual point in time.**

```python
dt = datetime.datetime(2050, 12, 25, 18, 30, tzinfo=datetime.UTC)
print(dt.isoformat())
```

```output
2050-12-25T18:30:00+00:00
```

The `+00:00` on the end of that string is the datetime telling you it is aware - indicating a UTC offset of zero hours.

### The tz Database and `zoneinfo`

Named timezones come from the **tz database** - the IANA maintained list of every timezone, and every rule change since 1970.

Python exposes it through the standard library `zoneinfo` module:

```python
import zoneinfo

print(len(zoneinfo.available_timezones()))
```

```output
598
```

Older Python code often uses `pytz` for this. **`pytz` is no longer necessary** - `zoneinfo` arrived in the standard library in Python 3.9, and it works directly with `datetime` rather than requiring special handling.

One quirk of the tz database survives into `zoneinfo` - the `+/-` in `Etc/GMT` timezone names is **reversed** relative to the offsets in ISO 8601:

| tz database name | Actual UTC offset |
|------------------|-------------------|
| `Etc/GMT-10`     | `+10:00`          |
| `Etc/GMT-2`      | `+02:00`          |
| `Etc/GMT+0`      | `+00:00`          |
| `Etc/GMT+2`      | `-02:00`          |
| `Etc/GMT+10`     | `-10:00`          |

```python
import datetime
from zoneinfo import ZoneInfo

print(datetime.datetime(2020, 1, 1, tzinfo=ZoneInfo("Etc/GMT+10")).strftime("%z"))
```

```output
-1000
```

This sign reversal catches people out. Prefer named location timezones like `Pacific/Auckland` over `Etc/GMT` names.

### Localization vs. Conversion

These are two different operations, and confusing them is a common source of wrong data.

**Localization attaches a timezone to a naive datetime. The wall clock reading does not change.**

```python
import datetime
from zoneinfo import ZoneInfo

dt = datetime.datetime(2050, 12, 25, 18, 30)
print(dt.replace(tzinfo=ZoneInfo("Pacific/Auckland")).isoformat())
```

```output
2050-12-25T18:30:00+13:00
```

The time is still 18:30 - we have only declared where that 18:30 was measured.

**Conversion takes an aware datetime and expresses the same instant elsewhere. The wall clock reading does change.**

```python
dt = datetime.datetime(2050, 12, 25, 18, 30, tzinfo=datetime.UTC)
print(dt.astimezone(ZoneInfo("Pacific/Auckland")).isoformat())
```

```output
2050-12-26T07:30:00+13:00
```

Note the date rolled over to the 26th. **Same instant, different label.**

## Advice for Working with Timezones

- **Decide early**: Make the call about whether you need to support multiple timezones before you have data on disk.
- **Prefer standard timezones**: A timezone that does not observe daylight saving removes a whole category of problem.
- **Stick to one UTC offset if you can**: If your entire business can be run using a fixed offset from UTC, do that. If not that, then a standardizing on a single timezone is the next best thing.
- **Default to UTC, knowing it is not a silver bullet**: Consider storing the original timezone alongside the UTC timestamp - UTC alone loses the information about where an event happened.
- **Name your columns**: A `_utc` suffix on a column name costs nothing and answers the question every reader of your table will have.
- **Know your database**: Understand how your database stores timestamps and whether it preserves timezones at all.

## Daylight Saving

### Why Daylight Saving is Hard

Timezones ask us to consider the same instant in different places. **Daylight saving asks us to accept a discontinuity in time itself.**

Daylight saving means a single location has more than one timezone during a year. It means some wall clock times never happen, and some happen twice.

### Standard versus Non-Standard Timezones

**A standard timezone is unaffected by daylight saving** - UTC, or Australian Eastern Standard Time (AEST).

A non-standard timezone observes daylight saving, and switches between two offsets during the year.

The advice for working with daylight saving is: where possible, don't. Use a standard timezone.

### The Hour That Happens Twice

When the clocks go back, one hour of wall clock time repeats. `2020-04-05 02:30` in Auckland is genuinely ambiguous - it happened once at `UTC+13:00` and again an hour later at `UTC+12:00`.

Python represents this with the `fold` attribute:

```python
import datetime
from zoneinfo import ZoneInfo

akl = ZoneInfo("Pacific/Auckland")
first = datetime.datetime(2020, 4, 5, 2, 30, tzinfo=akl, fold=0)
second = datetime.datetime(2020, 4, 5, 2, 30, tzinfo=akl, fold=1)

print(first.isoformat())
print(second.isoformat())
```

```output
2020-04-05T02:30:00+13:00
2020-04-05T02:30:00+12:00
```

The same wall clock reading, two different instants:

```python
print(first.astimezone(datetime.UTC).isoformat())
print(second.astimezone(datetime.UTC).isoformat())
```

```output
2020-04-04T13:30:00+00:00
2020-04-04T14:30:00+00:00
```

There is a trap here worth knowing about:

```python
print(first == second)
```

```output
True
```

**Two datetimes an hour apart compare as equal.** Within a single timezone, Python compares wall clock readings and ignores `fold`. Convert to UTC before comparing anything that might straddle a daylight saving boundary.

### The Hour That Never Happens

When the clocks go forward, an hour of wall clock time is skipped. `2020-09-27 02:30` in Auckland does not exist - the clocks jumped from 02:00 to 03:00.

Python will not stop you constructing it, which is its own kind of hazard:

```python
n = datetime.datetime(2020, 9, 27, 2, 30, tzinfo=akl)

print(n.isoformat())
print(n.astimezone(datetime.UTC).astimezone(akl).isoformat())
```

```output
2020-09-27T02:30:00+12:00
2020-09-27T03:30:00+13:00
```

A round trip through UTC does not return the datetime you started with, because the datetime you started with was never a real point in time.

### Days That Are Not 24 Hours Long

The consequence of all this is that **a day is not a reliable unit of time**:

```python
def day_length(day: datetime.date, tz: ZoneInfo) -> datetime.timedelta:
    """Elapsed time between midnight on this day and midnight on the next."""
    start = datetime.datetime.combine(day, datetime.time(0), tzinfo=tz)
    end = datetime.datetime.combine(day + datetime.timedelta(days=1), datetime.time(0), tzinfo=tz)
    return end.astimezone(datetime.UTC) - start.astimezone(datetime.UTC)


print(day_length(datetime.date(2020, 6, 1), akl))
print(day_length(datetime.date(2020, 9, 27), akl))
print(day_length(datetime.date(2020, 4, 5), akl))
```

```output
1 day, 0:00:00
23:00:00
1 day, 1:00:00
```

**One short 23 hour day with a missing hour, one long 25 hour day with a duplicated hour.** If you are summing energy over a day, or resampling half-hourly data to daily, these two days are where your totals go wrong.

## Datetime Representations

### Partitioned Representations

**A partitioned representation stores each element of the datetime in its own space** - year, month, day, hour and minute, each an integer component of time.

This is the representation used everywhere above. It is easy to read and easy to take apart. It is also verbose, and says nothing on its own about which timezone it belongs to.

### Offset Representations

**An offset representation is a single number counting from a fixed anchor.**

There are no components to assemble and no ambiguity about what the number means, provided you know the anchor.

### UNIX Time

**UNIX time is the number of seconds elapsed since the UNIX epoch - midnight UTC on 1 January 1970.**

```python
import time

print(time.time())
```

```output
1787496690.646406
```

The anchor is in UTC, which is why this section comes after timezones. **A UNIX timestamp is unambiguous** - it identifies an instant with no timezone attached and no wall clock to interpret.

We can move between the two representations:

```python
import datetime

print(datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC).timestamp())
print(datetime.datetime.fromtimestamp(1577836800, tz=datetime.UTC))
```

```output
1577836800.0
2020-01-01 00:00:00+00:00
```

**Always pass `tz` to `fromtimestamp`.** Without it you get local time, and your results depend on which machine ran the code.

If you ever see a long float or integer in a datetime column, it is likely UNIX time.

## Datetime Strings

The third representation is a string.

### Why a Section on `strftime` and `strptime`?

Much of working with data follows a process:

```text
data on disk -> data in memory -> data on disk
```

Which is really a process of changing types:

```text
string -> object -> string
```

These two operations are so common that Python includes its own mini-language for them:

- **`strptime` is the parser**: String plus format code, to datetime object.
- **`strftime` is the formatter**: Datetime object plus format code, to string.

The `p` is for parse and the `f` is for format. Nobody remembers this the first fifty times.

### Strings versus Objects

With a string, what you see is what you get - it is a simple, concrete representation.

A Python object can be arbitrarily complex, with methods and attributes far beyond what it displays. A `datetime` object knows how to add durations to itself, compare itself to other datetimes, and tell you which day of the week it falls on.

**A string that lives in a CSV or JSON file is not a Python object.** Getting it into your process means parsing it, and that is where the ambiguity bites - a datetime string can be perfectly readable and still mean two different things.

### ISO 8601

**ISO 8601 is the standard format for datetime strings, and you should use it wherever you can.**

Dates are `YEAR-MONTH-DAY` with a `-` separator:

```text
2022-01-24
%Y-%m-%d
```

A `T` separates the date from the time, and the time components use a `:` separator:

```text
2022-01-24T23:51:45
%Y-%m-%dT%H:%M:%S
```

The UTC offset goes on the end:

```text
2022-01-24T23:51:45+0200
%Y-%m-%dT%H:%M:%S%z
```

**ISO 8601 sorts correctly as a string**, which is the quiet reason it wins. It has no day-versus-month ambiguity, and almost every library handles it without extra effort.

Python has dedicated methods for it, so you never need format codes for ISO 8601:

```python
import datetime

print(datetime.datetime(2050, 12, 25, 18, 30).isoformat())
print(datetime.datetime.fromisoformat('2022-01-24T23:51:45+02:00'))
```

```output
2050-12-25T18:30:00
2022-01-24 23:51:45+02:00
```

`fromisoformat` handles the `Z` suffix for UTC as well:

```python
print(datetime.datetime.fromisoformat('2022-01-24T23:51:45Z'))
```

```output
2022-01-24 23:51:45+00:00
```

### Format Codes

Format codes describe the shape of a datetime string. Common ones:

| Code | Meaning       | Example    |
|------|---------------|------------|
| `%Y` | 4 digit year  | `2050`     |
| `%m` | 2 digit month | `12`       |
| `%B` | Month name    | `December` |
| `%d` | 2 digit day   | `25`       |
| `%A` | Weekday name  | `Sunday`   |
| `%H` | Hour, 24 hour | `18`       |
| `%M` | Minute        | `30`       |
| `%S` | Second        | `00`       |
| `%z` | UTC offset    | `+1300`    |

### `strftime` Creates Strings from Datetimes

`strftime` is the formatter - given a datetime and a format code, you get a string back:

```python
import datetime

dt = datetime.datetime(2050, 12, 25, 18, 30)
print(dt.strftime('%A %d of %B'))
print(dt.strftime('%A %d of %B of %Y'))
```

```output
Sunday 25 of December
Sunday 25 of December of 2050
```

### `strptime` Creates Datetimes from Strings

`strptime` is the inverse - given a string and the format code describing it, you get a `datetime` object back:

```python
import datetime

print(datetime.datetime.strptime('Sunday 25 of December of 2050', '%A %d of %B of %Y'))
```

```output
2050-12-25 00:00:00
```

**Notice the time is midnight.** The format code had no time components, so there was nothing to parse - the information is silently gone. A format code is a contract about what your string contains, and anything not in the contract is dropped.

## Summary

**A datetime is only a point in time if it knows its timezone.** Everything else in this lesson follows from that:

- **Naive is not UTC**: A naive datetime has no timezone, which is different from having a timezone of UTC. Do not let a naive datetime stand in for an aware one.
- **Localize, then convert**: Localizing attaches a timezone and keeps the wall clock. Converting keeps the instant and changes the wall clock. Use `replace(tzinfo=...)` to localize and `astimezone` to convert.
- **Compare in UTC**: Two datetimes an hour apart across a daylight saving boundary can compare as equal in their local timezone.
- **Prefer standard timezones**: UTC where you can, a named location timezone where you must, and a `_utc` suffix on the column either way.
- **Days are not always 24 hours**: Daylight saving gives you a 23 hour day with a missing hour and a 25 hour day with a duplicated one. This is where daily aggregations break.
- **Three representations**: Partitioned (year, month, day), offset (UNIX time), and string (ISO 8601). Know which one you are holding.
- **Use ISO 8601 for strings**: It sorts correctly, it has no day-versus-month ambiguity, and every library reads it.
