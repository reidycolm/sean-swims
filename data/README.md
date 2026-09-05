# Tarbert Island tide data

`tides-2026.js` contains 1,299 flat `{ date, time, height, type }` records.
The application loads this classic script directly: no database, tide API,
server-side code or build step is required.

- **30 January-31 August 2026:** 827 existing application records migrated without
  changing dates, clock times or heights. `High`/`Low` labels were normalized to
  lowercase. A regression checksum in `tests/tides.test.js` verifies preservation.
  These older months were not retranscribed or comprehensively audited against the PDF.
- **1 September-31 December 2026:** 472 entries on 122 consecutive dates, taken
  exclusively from **TARBERT ISLAND TIDE TABLE**, PDF pages 9-12, printed pages
  25-28, in the user-supplied `2026-Tides_copy.pdf`.
- Source PDF SHA-256:
  `95cadc3ade5449beceb1882d5d58fb4078843da6e5aa61719f0330f7ea673a98`.

Every new time and height was extracted as a pair from its dated row and then
independently checked using PDF text coordinates. Each of the 472 triples matched.
All four source pages were rendered for visual inspection. The regression fixtures
were separately transcribed during visual checks of 5 and 25 September; 10, 24,
25 and 26 October; 15 November; and 15 and 31 December.

The PDF does not explicitly label highs/lows. Types were assigned by comparing
each event's height with its preceding/following neighbours, then checking that
types alternate across every day/month boundary (including August-September).
Blank table cells are not events. No times or heights were estimated or substituted.
Numeric literals and UI formatting retain the PDF's two decimal places.

## Time and coverage rules

- `date` and `time` are authoritative **Europe/Dublin civil strings**. Display them
  directly; never shift them using the viewer's timezone.
- `tides.js` resolves each civil timestamp through Dublin's zone rules solely for
  chronological comparisons and real elapsed countdowns. The October clock change
  is already reflected in the printed times. No extra hour is added/subtracted
  from the displayed source values.
- A nonexistent or ambiguous civil time is rejected instead of guessed. None of
  the current 1,299 records is rejected. In particular, 25 October's first event
  is 04:38, outside the repeated 01:00 hour.
- Future-event lookup searches the entire remaining sorted dataset. Today,
  tomorrow and the seven-day schedule use Dublin calendar dates.
- Rising/falling and visual interpolation require surrounding alternating
  extrema with consistent relative heights and a gap no larger than nine hours.
  This gap guard prevents drawing across missing records; it does not invent events.
- Chart samples are **visual cosine interpolation only**. Source extrema are
  included at their exact times/heights, never rounded to hourly marker positions.
  Samples outside supported intervals are `null`, not an assumed 2.5 m level.
- There is no data before 30 January or after 31 December 2026. Missing days,
  future events and unsupported chart intervals are displayed as unavailable.

## Maintenance

Add only verified Tarbert Island source records, in date/time order. Keep source
provenance and coverage notes current, validate alternation and relative heights,
and add independently checked regression fixtures. Do not generate production
values using the Kilrush diagnostic scripts. Update the versioned script URL in
`index.html`, its matching cache entry in `sw.js`, and the service-worker cache
version whenever releasing a new data file.

Run the dependency-free checks with `node --test tests/tides.test.js`.
