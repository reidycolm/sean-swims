/* Dashboard rendering; all source values and calculations live in data/ and tides.js. */
const tideData = TideEngine.create(typeof TARBERT_TIDES_2026 === 'undefined' ? [] : TARBERT_TIDES_2026);

function tideDayLabel(date, today) {
    if (date === today) return 'Today';
    if (date === TideEngine.addDays(today, 1)) return 'Tomorrow';
    return new Intl.DateTimeFormat('en-IE', {
        timeZone: 'Europe/Dublin', weekday: 'short', day: 'numeric', month: 'short'
    }).format(new Date(`${date}T12:00:00Z`));
}

function tidePill(event, now) {
    const passed = event.instant < now;
    return `<span class="tide-pill ${event.type}${passed ? ' tide-past' : ''}">
        <span class="tide-event-type">${event.type === 'high' ? 'High' : 'Low'}</span>
        <time datetime="${event.date}T${event.time}">${event.time}</time>
        <span class="tide-event-height">${event.height.toFixed(2)} m</span></span>`;
}

function renderTidesFromTable() {
    const now = Date.now();
    const snapshot = tideData.snapshot(now);
    for (const [type, event] of [['high', snapshot.nextHigh], ['low', snapshot.nextLow]]) {
        document.getElementById(`next-${type}-tide`).textContent = event ? event.time : 'Unavailable';
        document.getElementById(`next-${type}-height`).textContent = event ? `${event.height.toFixed(2)} m` : '';
        document.getElementById(`${type}-tide-context`).textContent = event ? tideDayLabel(event.date, snapshot.date) : '';
        document.getElementById(`${type}-tide-countdown`).textContent = TideEngine.countdown(event, now);
    }
    // Reorder the existing elements, including their accessible reading order.
    // Dublin timestamps already account for midnight and the October clock change.
    const summary = document.querySelector('.tide-summary');
    [['high', snapshot.nextHigh], ['low', snapshot.nextLow]]
        .sort((a, b) => (a[1]?.instant ?? Infinity) - (b[1]?.instant ?? Infinity))
        .forEach(([type, event], index) => {
            const card = summary.querySelector(`.tide-item.${type}`);
            card.querySelector('.tide-order').textContent = event ? (index === 0 ? 'Next tide' : 'Following tide') : 'Unavailable';
            summary.appendChild(card);
        });
    const state = document.getElementById('tide-state');
    state.textContent = snapshot.state
        ? `${snapshot.state === 'Rising' ? '↗' : '↘'} Tide ${snapshot.state.toLowerCase()}`
        : 'Tide state unavailable';
    state.classList.toggle('tide-unavailable', !snapshot.state);
    document.getElementById('today-tides').innerHTML = snapshot.today.length
        ? snapshot.today.map(event => tidePill(event, now)).join('')
        : '<p class="tide-unavailable">No tide-table data available for today.</p>';
    document.getElementById('weekly-tides-container').innerHTML = snapshot.week.map(day => `
        <div class="tide-row">
            <div class="tide-date">${tideDayLabel(day.date, snapshot.date)}</div>
            <div class="tide-times">${day.events.length ? day.events.map(event => tidePill(event, now)).join('')
                : '<span class="tide-unavailable">Tide-table data unavailable</span>'}</div>
        </div>`).join('');

    const moon = getMoonPhase(new Date(now));
    document.getElementById('moon-icon').textContent = moon.icon;
    document.getElementById('moon-label').textContent = `Moon: ${moon.name}`;
    const moonType = document.getElementById('moon-tide-type');
    moonType.textContent = moon.type ? `${moon.type} Tide Cycle` : '';
    moonType.className = `moon-tide-type ${moon.type.toLowerCase()}-tide`;
    moonType.hidden = !moon.type;
    renderTideChart(now);
}

function tideClockTicks(start, end) {
    const ticks = [];
    // Anchor ticks to Dublin clock boundaries, not to the current minute or UTC.
    for (let date = TideEngine.dateKey(start); date <= TideEngine.dateKey(end); date = TideEngine.addDays(date, 1)) {
        for (const time of ['00:00', '06:00', '12:00', '18:00']) {
            const instant = TideEngine.civilToEpoch(date, time);
            if (instant !== null && instant >= start && instant <= end) ticks.push({ value: instant });
        }
    }
    return ticks;
}

function tideSkyMarkers(start, end) {
    const daily = lastWeatherData?.daily;
    if (!daily) return [];
    const markers = [];
    for (const type of ['sunrise', 'sunset']) {
        for (const civil of daily[type] || []) {
            if (!civil) continue;
            const instant = TideEngine.civilToEpoch(civil.slice(0, 10), civil.slice(11, 16));
            if (instant === null || instant < start || instant > end) continue;
            // The moon is a decorative sunset marker, NOT an invented moonrise time.
            markers.push({ instant, type, icon: type === 'sunrise' ? '☀' : getMoonPhase(new Date(instant)).icon });
        }
    }
    return markers.sort((a, b) => a.instant - b.instant);
}

function renderTideChart(now) {
    const canvas = document.getElementById('tideChart');
    const note = document.getElementById('tide-chart-note');
    const end = now + 24 * 3600000;
    const curve = tideData.curve(now, end);
    if (window.tideChartInstance) {
        window.tideChartInstance.destroy();
        window.tideChartInstance = null;
    }
    const available = curve.samples.some((sample, i) => i && sample.y !== null && curve.samples[i - 1].y !== null);
    canvas.parentElement.hidden = !available || typeof Chart === 'undefined';
    if (!available) {
        note.textContent = 'Tide curve unavailable: insufficient surrounding tide-table events.';
        return;
    }
    if (typeof Chart === 'undefined') {
        note.textContent = 'Chart unavailable. Official tide times and heights are listed above and below.';
        return;
    }
    note.textContent = `${curve.complete ? '' : 'Some tide data is unavailable. '}` +
        'Tide times & heights: Tarbert Island Tide Table 2026';
    note.title = 'Dots mark official times and heights; the curve is a visual guide between them. Sun: sunrise. Moon: sunset, not moonrise. All times are Irish local time.';
    const skyMarkers = tideSkyMarkers(now, end);
    const skyPlugin = {
        id: 'tideSkyMarkers',
        afterDraw(chart) {
            const { ctx, chartArea, scales: { x } } = chart;
            ctx.save();
            ctx.font = `${chart.width < 480 ? 12 : 14}px "Segoe UI Emoji", sans-serif`;
            ctx.textBaseline = 'bottom';
            ctx.globalAlpha = 0.7;
            for (const marker of skyMarkers) {
                const position = x.getPixelForValue(marker.instant);
                ctx.textAlign = position < chartArea.left + 8 ? 'left' : position > chartArea.right - 8 ? 'right' : 'center';
                ctx.fillStyle = marker.type === 'sunrise' ? '#fbbf24' : '#94a3b8';
                ctx.fillText(marker.icon, position, chartArea.top - 7);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
                ctx.moveTo(position, chartArea.top - 3);
                ctx.lineTo(position, chartArea.top + 6);
                ctx.stroke();
            }
            ctx.restore();
        }
    };
    window.tideChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { datasets: [
            {
                label: 'Tide curve', data: curve.samples,
                borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)',
                borderWidth: 2, fill: true, pointRadius: 0, tension: 0, spanGaps: false,
                order: 2
            },
            {
                label: 'Official tide-table event',
                data: curve.points.map(event => ({ x: event.instant, y: event.height, event })),
                showLine: false, pointRadius: 5, pointHoverRadius: 7,
                pointBackgroundColor: context => context.raw?.event.type === 'high' ? '#4ade80' : '#f87171',
                pointBorderColor: '#0f172a', pointBorderWidth: 2, order: 1
            }
        ] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            layout: { padding: { top: 23 } },
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        title: items => {
                            const point = items[0].raw;
                            return point.event ? `${tideDayLabel(point.event.date, TideEngine.dateKey(now))} ${point.event.time}`
                                : `${tideDayLabel(TideEngine.dateKey(point.x), TideEngine.dateKey(now))} ${TideEngine.formatTime(point.x)}`;
                        },
                        label: context => context.raw.event
                            ? `Official ${context.raw.event.type}: ${context.raw.event.height.toFixed(2)} m`
                            : 'Guide between official tide points'
                    }
                }
            },
            scales: {
                x: { type: 'linear', min: now, max: end, grid: { display: false },
                    afterBuildTicks: scale => { scale.ticks = tideClockTicks(now, end); },
                    ticks: { color: '#94a3b8', maxTicksLimit: 5, maxRotation: 0, callback: value => TideEngine.formatTime(value) } },
                y: { suggestedMin: 0, grid: { color: 'rgba(148, 163, 184, 0.08)' },
                    ticks: { color: '#94a3b8', maxTicksLimit: 4, callback: value => `${value} m` } }
            }
        },
        plugins: [skyPlugin]
    });
}
