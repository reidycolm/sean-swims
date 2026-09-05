const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const source = require('../data/tides-2026');
const Tide = require('../tides');
const data = Tide.create(source);

// Independently transcribed during visual review of Tarbert Island PDF pages
// 9-12 (printed 25-28). H/L labels are inferred from neighbouring heights.
const checkedRows = {
    '2026-09-05': '05:52 1.70 low;12:37 3.90 high;18:58 1.70 low',
    '2026-09-25': '05:37 4.50 high;11:39 0.90 low;17:54 4.80 high;23:59 0.50 low',
    '2026-10-10': '06:14 4.90 high;12:14 0.50 low;18:32 5.10 high',
    '2026-10-24': '05:01 4.60 high;11:04 0.80 low;17:19 4.80 high;23:24 0.50 low',
    '2026-10-25': '04:38 4.80 high;10:44 0.60 low;16:57 5.00 high;23:02 0.40 low',
    '2026-10-26': '05:15 5.00 high;11:23 0.40 low;17:36 5.10 high;23:40 0.30 low',
    '2026-11-15': '02:26 1.60 low;08:50 4.20 high;14:57 1.50 low;21:25 3.80 high',
    '2026-12-15': '02:48 1.50 low;09:11 4.30 high;15:19 1.30 low;21:48 4.00 high',
    '2026-12-31': '04:45 1.40 low;11:10 4.20 high;17:28 1.30 low;23:56 4.00 high'
};

test('manually checked PDF rows retain every printed time and height', () => {
    for (const [date, expected] of Object.entries(checkedRows)) {
        assert.equal(data.forDate(date).map(e => `${e.time} ${e.height.toFixed(2)} ${e.type}`).join(';'), expected, date);
    }
});

test('122 new dates: complete, unique, ordered, alternating across month boundaries', () => {
    const extended = data.events.filter(e => e.date >= '2026-09-01');
    assert.equal(extended.length, 472);
    assert.equal(new Set(extended.map(e => `${e.date} ${e.time}`)).size, 472);
    for (let date = '2026-09-01'; date <= '2026-12-31'; date = Tide.addDays(date, 1)) {
        assert.ok([3, 4].includes(data.forDate(date).length), date);
    }
    const boundary = data.events.filter(e => e.date >= '2026-08-31');
    for (let i = 1; i < boundary.length; i++) {
        assert.ok(Tide.validInterval(boundary[i - 1], boundary[i]), JSON.stringify(boundary[i]));
    }
    for (const event of extended) {
        assert.equal(Tide.dateKey(event.instant), event.date);
        assert.equal(Tide.formatTime(event.instant), event.time);
    }
});

test('827 legacy events match the pre-migration normalized checksum', () => {
    const legacy = source.filter(e => e.date < '2026-09-01');
    assert.equal(legacy.length, 827);
    assert.equal(createHash('sha256').update(JSON.stringify(legacy)).digest('hex'), '8a75a1e003b15da27cb6e4c4df878be3e761c8c1c4dba8cc50181de6be5f5eae');
});

test('next high/low, heights, countdown, rising/falling and seven civil days', () => {
    const now = Date.parse('2026-09-05T09:00:00Z'); // 10:00 Dublin
    const s = data.snapshot(now);
    assert.equal(s.nextHigh.time, '12:37');
    assert.equal(s.nextHigh.height, 3.90);
    assert.equal(s.nextLow.time, '18:58');
    assert.equal(s.nextLow.height, 1.70);
    assert.equal(Tide.countdown(s.nextHigh, now), 'In 2h 37m');
    assert.equal(Tide.countdown(s.nextLow, now), 'In 8h 58m');
    assert.equal(s.state, 'Rising');
    assert.equal(s.today.length, 3);
    assert.equal(s.tomorrow.length, 4);
    assert.equal(s.week.length, 7);
    assert.equal(s.week.at(-1).date, '2026-09-11');
    assert.equal(data.snapshot(Date.parse('2026-09-05T11:37:00Z')).state, 'Falling');
    assert.equal(data.snapshot(Date.parse('2026-09-05T18:00:00Z')).nextHigh.date, '2026-09-06');
    assert.equal(data.snapshot(Date.parse('2026-08-31T23:30:00Z')).date, '2026-09-01');
});

test('future search extends beyond tomorrow without bridging gaps in the curve/state', () => {
    const sparse = Tide.create(source.filter(e => e.date === '2026-09-05' || e.date === '2026-09-09'));
    const now = Date.parse('2026-09-05T22:00:00Z');
    assert.equal(sparse.snapshot(now).nextHigh.date, '2026-09-09');
    assert.equal(sparse.snapshot(now).nextLow.date, '2026-09-09');
    assert.equal(sparse.snapshot(now).state, null);
    assert.equal(sparse.visualLevel(now), null);
});

test('October clock change: exact wall times, real elapsed countdowns, no guessed folds', () => {
    assert.equal(new Date(Tide.civilToEpoch('2026-10-24', '23:24')).toISOString(), '2026-10-24T22:24:00.000Z');
    assert.equal(new Date(Tide.civilToEpoch('2026-10-25', '04:38')).toISOString(), '2026-10-25T04:38:00.000Z');
    for (const [instant, remaining] of [['2026-10-25T00:30:00Z', 'In 4h 8m'], ['2026-10-25T01:30:00Z', 'In 3h 8m']]) {
        const now = Date.parse(instant);
        const s = data.snapshot(now);
        assert.equal(s.date, '2026-10-25');
        assert.equal(s.nextHigh.time, '04:38');
        assert.equal(s.state, 'Rising');
        assert.equal(Tide.countdown(s.nextHigh, now), remaining);
    }
    assert.equal(Tide.civilToEpoch('2026-10-25', '01:30'), null);
    assert.equal(Tide.civilToEpoch('2026-03-29', '01:30'), null);
});

test('visual curve contains exact extrema; no fabricated or extrapolated levels', () => {
    const start = Date.parse('2026-09-05T00:00:00Z');
    const curve = data.curve(start);
    assert.equal(curve.complete, true);
    for (const e of curve.points) {
        assert.deepEqual(curve.samples.find(p => p.x === e.instant), { x: e.instant, y: e.height });
    }
    for (const date of ['2026-01-01', '2027-01-01']) {
        assert.equal(data.visualLevel(Date.parse(`${date}T00:00:00Z`)), null);
    }
    const empty = Tide.create();
    assert.equal(empty.snapshot(start).state, null);
    assert.equal(empty.snapshot(start).nextHigh, null);
    assert.ok(empty.curve(start).samples.every(p => p.y === null));
    const single = Tide.create([source.at(-1)]);
    assert.equal(single.visualLevel(single.events[0].instant - 1), null);
    assert.equal(single.visualLevel(single.events[0].instant + 1), null);
});

test('year-end explicitly reports unavailable future events', () => {
    const s = data.snapshot(Date.parse('2026-12-31T20:00:00Z'));
    assert.equal(s.nextHigh.time, '23:56');
    assert.equal(s.nextLow, null);
    assert.equal(s.tomorrow.length, 0);
    assert.equal(s.week.length, 7);
    assert.ok(s.week.slice(1).every(day => day.events.length === 0));
    assert.equal(data.curve(s.instant).complete, false);
    const ended = data.snapshot(Date.parse('2027-01-01T00:00:00Z'));
    assert.equal(ended.nextHigh, null);
    assert.equal(ended.nextLow, null);
    assert.equal(ended.state, null);
});
