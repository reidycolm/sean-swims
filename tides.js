/* Pure tide calculations. Source events are civil date/time records, never curve samples. */
(function (root) {
    'use strict';
    const ZONE = 'Europe/Dublin';
    const HOUR = 3600000;
    const civilFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    const timeFormatter = new Intl.DateTimeFormat('en-IE', {
        timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });

    function civilParts(instant) {
        return Object.fromEntries(civilFormatter.formatToParts(instant)
            .filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    }

    function dateKey(instant) {
        const p = civilParts(instant);
        return `${p.year}-${p.month}-${p.day}`;
    }

    function addDays(date, days) {
        const value = new Date(`${date}T12:00:00Z`);
        value.setUTCDate(value.getUTCDate() + days);
        return value.toISOString().slice(0, 10);
    }

    function civilToEpoch(date, time) {
        // Construct candidate offsets using Dublin's zone rules on either side of
        // the date. Match the printed wall time, independent of the browser zone.
        // Reject nonexistent or ambiguous wall times instead of guessing a fold.
        const wall = Date.parse(`${date}T${time}:00Z`);
        if (!Number.isFinite(wall)) return null;
        const offsets = new Set([-24, 0, 24].map(hours => {
            const sample = wall + hours * HOUR;
            const p = civilParts(sample);
            return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`) - sample;
        }));
        const candidates = [...offsets].map(offset => wall - offset).filter(instant => {
            const p = civilParts(instant);
            return `${p.year}-${p.month}-${p.day}` === date && `${p.hour}:${p.minute}` === time;
        });
        return candidates.length === 1 ? candidates[0] : null;
    }

    function validInterval(before, after) {
        // Prevent curves or rising/falling claims across missing/invalid records.
        if (!before || !after || before.type === after.type) return false;
        const gap = after.instant - before.instant;
        return gap > 0 && gap <= 9 * HOUR &&
            (before.type === 'low' ? before.height < after.height : before.height > after.height);
    }

    function create(source = []) {
        const events = source.map(event => ({ ...event, instant: civilToEpoch(event.date, event.time) }))
            .filter(event => event.instant !== null && Number.isFinite(event.height) &&
                ['high', 'low'].includes(event.type))
            .sort((a, b) => a.instant - b.instant);
        const byDate = new Map();
        for (const event of events) {
            if (!byDate.has(event.date)) byDate.set(event.date, []);
            byDate.get(event.date).push(event);
        }
        function forDate(date) { return byDate.get(date) || []; }
        function snapshot(now = Date.now()) {
            const instant = Number(now);
            const today = dateKey(instant);
            const future = events.filter(event => event.instant > instant);
            const previous = events.findLast(event => event.instant <= instant);
            const next = future[0];
            return {
                instant, date: today,
                nextHigh: future.find(event => event.type === 'high') || null,
                nextLow: future.find(event => event.type === 'low') || null,
                state: validInterval(previous, next) ? (next.type === 'high' ? 'Rising' : 'Falling') : null,
                today: forDate(today), tomorrow: forDate(addDays(today, 1)),
                week: Array.from({ length: 7 }, (_, day) => {
                    const date = addDays(today, day);
                    return { date, events: forDate(date) };
                })
            };
        }
        function visualLevel(instant) {
            const exact = events.find(event => event.instant === instant);
            if (exact) return exact.height;
            const nextIndex = events.findIndex(event => event.instant > instant);
            const before = events[nextIndex - 1];
            const after = events[nextIndex];
            if (!validInterval(before, after)) return null;
            const progress = (instant - before.instant) / (after.instant - before.instant);
            // Presentation ONLY: cosine interpolation, not a measured or additional
            // predicted tide value. Never extrapolate outside known extrema.
            return before.height + (after.height - before.height) * (1 - Math.cos(progress * Math.PI)) / 2;
        }
        function curve(start, end = start + 24 * HOUR) {
            const times = new Set([start, end]);
            for (let time = start; time < end; time += 10 * 60000) times.add(time);
            const points = events.filter(event => event.instant >= start && event.instant <= end);
            points.forEach(event => times.add(event.instant)); // Exact extrema, never rounded to an hour.
            return {
                samples: [...times].sort((a, b) => a - b).map(x => ({ x, y: visualLevel(x) })),
                points,
                complete: visualLevel(start) !== null && visualLevel(end) !== null &&
                    [...times].every(time => visualLevel(time) !== null)
            };
        }
        return { events, forDate, snapshot, visualLevel, curve };
    }

    function countdown(event, now) {
        if (!event) return 'No later event in the supplied table';
        const minutes = Math.max(0, Math.ceil((event.instant - Number(now)) / 60000));
        if (minutes === 0) return 'Now';
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor(minutes % 1440 / 60);
        const remaining = minutes % 60;
        return `In ${days ? `${days}d ` : ''}${hours ? `${hours}h ` : ''}${remaining}m`;
    }

    const api = { create, dateKey, addDays, civilToEpoch, validInterval, countdown,
        formatTime: instant => timeFormatter.format(instant), zone: ZONE };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.TideEngine = api;
})(globalThis);
