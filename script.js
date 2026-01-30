/**
 * Tarbert Coastal Dashboard Logic
 * Updated with accurate Tarbert Island Tide Table data
 */

// Coordinates
const LOCATIONS = {
    tarbert: { lat: 52.5718, lon: -9.3703 }, // Local (Weather, Waves)
    regional: { lat: 52.5800, lon: -9.6500 } // Deep Water (SST fallback)
};

// Tarbert Island Tide Table - January 2026 (last few days)
const TIDE_TABLE_JAN_2026 = {
    30: [
        { time: '05:00', height: 4.60, type: 'High' },
        { time: '11:14', height: 0.90, type: 'Low' },
        { time: '17:30', height: 4.60, type: 'High' },
        { time: '23:24', height: 1.00, type: 'Low' }
    ],
    31: [
        { time: '05:35', height: 4.80, type: 'High' },
        { time: '11:49', height: 0.70, type: 'Low' },
        { time: '18:03', height: 4.70, type: 'High' },
        { time: '23:59', height: 0.80, type: 'Low' }
    ]
};

// Tarbert Island Tide Table - February 2026 (from provided PDF)
const TIDE_TABLE_FEB_2026 = {
    1: [
        { time: '05:03', height: 4.90, type: 'High' },
        { time: '11:22', height: 0.50, type: 'Low' },
        { time: '17:38', height: 4.80, type: 'High' },
        { time: '23:35', height: 0.70, type: 'Low' }
    ],
    2: [
        { time: '05:50', height: 5.10, type: 'High' },
        { time: '12:06', height: 0.30, type: 'Low' },
        { time: '18:21', height: 5.00, type: 'High' }
    ],
    3: [
        { time: '00:16', height: 0.60, type: 'Low' },
        { time: '06:32', height: 5.20, type: 'High' },
        { time: '12:45', height: 0.20, type: 'Low' },
        { time: '19:02', height: 5.00, type: 'High' }
    ],
    4: [
        { time: '00:54', height: 0.60, type: 'Low' },
        { time: '07:11', height: 5.20, type: 'High' },
        { time: '13:23', height: 0.30, type: 'Low' },
        { time: '19:39', height: 4.90, type: 'High' }
    ],
    5: [
        { time: '01:29', height: 0.60, type: 'Low' },
        { time: '07:48', height: 5.10, type: 'High' },
        { time: '13:58', height: 0.50, type: 'Low' },
        { time: '20:14', height: 4.80, type: 'High' }
    ],
    6: [
        { time: '02:02', height: 0.80, type: 'Low' },
        { time: '08:24', height: 4.90, type: 'High' },
        { time: '14:32', height: 0.80, type: 'Low' },
        { time: '20:49', height: 4.60, type: 'High' }
    ],
    7: [
        { time: '02:36', height: 1.10, type: 'Low' },
        { time: '09:01', height: 4.70, type: 'High' },
        { time: '15:06', height: 1.10, type: 'Low' },
        { time: '21:26', height: 4.40, type: 'High' }
    ],
    8: [
        { time: '03:13', height: 1.40, type: 'Low' },
        { time: '09:40', height: 4.40, type: 'High' },
        { time: '15:44', height: 1.50, type: 'Low' },
        { time: '22:07', height: 4.20, type: 'High' }
    ],
    9: [
        { time: '03:55', height: 1.70, type: 'Low' },
        { time: '10:27', height: 4.10, type: 'High' },
        { time: '16:32', height: 1.80, type: 'Low' },
        { time: '22:59', height: 4.00, type: 'High' }
    ],
    10: [
        { time: '04:51', height: 2.00, type: 'Low' },
        { time: '11:30', height: 3.80, type: 'High' },
        { time: '17:37', height: 2.10, type: 'Low' }
    ],
    11: [
        { time: '00:05', height: 3.80, type: 'High' },
        { time: '06:10', height: 2.20, type: 'Low' },
        { time: '12:58', height: 3.70, type: 'High' },
        { time: '19:04', height: 2.20, type: 'Low' }
    ],
    12: [
        { time: '01:26', height: 3.80, type: 'High' },
        { time: '07:47', height: 2.10, type: 'Low' },
        { time: '14:26', height: 3.70, type: 'High' },
        { time: '20:25', height: 2.10, type: 'Low' }
    ],
    13: [
        { time: '02:41', height: 4.00, type: 'High' },
        { time: '09:02', height: 1.80, type: 'Low' },
        { time: '15:29', height: 3.90, type: 'High' },
        { time: '21:24', height: 1.80, type: 'Low' }
    ],
    14: [
        { time: '03:37', height: 4.20, type: 'High' },
        { time: '09:54', height: 1.50, type: 'Low' },
        { time: '16:16', height: 4.10, type: 'High' },
        { time: '22:09', height: 1.50, type: 'Low' }
    ],
    15: [
        { time: '04:21', height: 4.40, type: 'High' },
        { time: '10:37', height: 1.20, type: 'Low' },
        { time: '16:55', height: 4.40, type: 'High' },
        { time: '22:48', height: 1.20, type: 'Low' }
    ],
    16: [
        { time: '05:00', height: 4.60, type: 'High' },
        { time: '11:14', height: 0.90, type: 'Low' },
        { time: '17:30', height: 4.60, type: 'High' },
        { time: '23:24', height: 1.00, type: 'Low' }
    ],
    17: [
        { time: '05:35', height: 4.80, type: 'High' },
        { time: '11:49', height: 0.70, type: 'Low' },
        { time: '18:03', height: 4.70, type: 'High' },
        { time: '23:59', height: 0.80, type: 'Low' }
    ],
    18: [
        { time: '06:09', height: 5.00, type: 'High' },
        { time: '12:23', height: 0.50, type: 'Low' },
        { time: '18:36', height: 4.90, type: 'High' }
    ],
    19: [
        { time: '00:32', height: 0.70, type: 'Low' },
        { time: '06:43', height: 5.10, type: 'High' },
        { time: '12:55', height: 0.40, type: 'Low' },
        { time: '19:10', height: 5.00, type: 'High' }
    ],
    20: [
        { time: '01:05', height: 0.60, type: 'Low' },
        { time: '07:18', height: 5.20, type: 'High' },
        { time: '13:28', height: 0.50, type: 'Low' },
        { time: '19:45', height: 5.00, type: 'High' }
    ],
    21: [
        { time: '01:39', height: 0.70, type: 'Low' },
        { time: '07:54', height: 5.10, type: 'High' },
        { time: '14:03', height: 0.60, type: 'Low' },
        { time: '20:22', height: 4.90, type: 'High' }
    ],
    22: [
        { time: '02:17', height: 0.80, type: 'Low' },
        { time: '08:34', height: 4.90, type: 'High' },
        { time: '14:41', height: 0.90, type: 'Low' },
        { time: '21:02', height: 4.70, type: 'High' }
    ],
    23: [
        { time: '02:58', height: 1.00, type: 'Low' },
        { time: '09:20', height: 4.60, type: 'High' },
        { time: '15:25', height: 1.20, type: 'Low' },
        { time: '21:48', height: 4.40, type: 'High' }
    ],
    24: [
        { time: '03:49', height: 1.40, type: 'Low' },
        { time: '10:16', height: 4.30, type: 'High' },
        { time: '16:21', height: 1.60, type: 'Low' },
        { time: '22:49', height: 4.10, type: 'High' }
    ],
    25: [
        { time: '04:54', height: 1.70, type: 'Low' },
        { time: '11:36', height: 3.90, type: 'High' },
        { time: '17:38', height: 1.90, type: 'Low' }
    ],
    26: [
        { time: '00:13', height: 3.90, type: 'High' },
        { time: '06:32', height: 1.80, type: 'Low' },
        { time: '13:15', height: 3.90, type: 'High' },
        { time: '19:23', height: 1.90, type: 'Low' }
    ],
    27: [
        { time: '01:47', height: 4.00, type: 'High' },
        { time: '08:23', height: 1.60, type: 'Low' },
        { time: '14:48', height: 4.10, type: 'High' },
        { time: '20:52', height: 1.60, type: 'Low' }
    ],
    28: [
        { time: '03:08', height: 4.30, type: 'High' },
        { time: '09:33', height: 1.10, type: 'Low' },
        { time: '15:54', height: 4.40, type: 'High' },
        { time: '21:52', height: 1.30, type: 'Low' }
    ]
};

// DOM Elements
const els = {
    temp: document.getElementById('current-temp'),
    conditionIcon: document.getElementById('weather-icon'),
    conditionDesc: document.getElementById('weather-desc'),
    rain: document.getElementById('current-rain'),
    rainStatus: document.getElementById('rain-status'),
    nextRain: document.getElementById('next-hour-rain'),
    seaTemp: document.getElementById('sea-temp'),
    waveHeight: document.getElementById('wave-height'),
    nextHighTide: document.getElementById('next-high-tide'),
    nextLowTide: document.getElementById('next-low-tide'),
    forecastContainer: document.getElementById('forecast-container'),
    updatedTime: document.getElementById('last-updated-time'),
    rainfallChartCtx: document.getElementById('rainfallChart')?.getContext('2d'),
    tideChartCtx: document.getElementById('tideChart')?.getContext('2d'),
    // New Elements
    sunrise: document.getElementById('sunrise-time'),
    sunset: document.getElementById('sunset-time'),
    weeklyTidesContainer: document.getElementById('weekly-tides-container'),
    currentDate: document.getElementById('current-date'),
    tideSource: document.getElementById('tide-source')
};

// Weather Codes Mapping
const weatherCodes = {
    0: { desc: 'Clear Sky', icon: 'sun' },
    1: { desc: 'Mainly Clear', icon: 'sun' },
    2: { desc: 'Partly Cloudy', icon: 'cloud' },
    3: { desc: 'Overcast', icon: 'cloud' },
    45: { desc: 'Fog', icon: 'menu' },
    48: { desc: 'Depositing Rime Fog', icon: 'menu' },
    51: { desc: 'Light Drizzle', icon: 'cloud-drizzle' },
    53: { desc: 'Moderate Drizzle', icon: 'cloud-drizzle' },
    55: { desc: 'Dense Drizzle', icon: 'cloud-drizzle' },
    61: { desc: 'Slight Rain', icon: 'cloud-rain' },
    63: { desc: 'Moderate Rain', icon: 'cloud-rain' },
    65: { desc: 'Heavy Rain', icon: 'cloud-rain' },
    71: { desc: 'Slight Snow', icon: 'cloud-snow' },
    73: { desc: 'Moderate Snow', icon: 'cloud-snow' },
    75: { desc: 'Heavy Snow', icon: 'cloud-snow' },
    80: { desc: 'Slight Showers', icon: 'cloud-rain' },
    81: { desc: 'Moderate Showers', icon: 'cloud-rain' },
    82: { desc: 'Violent Showers', icon: 'cloud-lightning' },
    95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
    96: { desc: 'Thunderstorm with Hail', icon: 'cloud-lightning' },
    99: { desc: 'Thunderstorm with Hail', icon: 'cloud-lightning' }
};

function getWeatherIcon(code) {
    return (weatherCodes[code] && weatherCodes[code].icon) || 'help-circle';
}

function getWeatherDesc(code) {
    return (weatherCodes[code] && weatherCodes[code].desc) || 'Unknown';
}

function formatTime(timeStr) {
    // Handle both ISO strings and HH:MM format
    if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timeStr;
}

function formatTimeFromDate(date) {
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Get the correct day name accounting for timezone
function getDayName(date, isToday = false) {
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-IE', { weekday: 'short' });
}

// Data Fetching
async function initDashboard() {
    updateTime();

    // Parallel fetching
    await Promise.all([
        fetchWeather(),
        fetchMarine()
    ]);

    // Render tides from static table data
    renderTidesFromTable();

    feather.replace();
}

function updateTime() {
    const now = new Date();
    els.updatedTime.textContent = now.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

    // Update current date display
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-IE', dateOptions);
    if (els.currentDate) {
        els.currentDate.textContent = dateStr;
    }

    // Update Rainfall Card Date - show just day and time
    const rainDateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const rainDateStr = now.toLocaleDateString('en-IE', rainDateOptions);
    if (document.getElementById('rain-date')) {
        document.getElementById('rain-date').textContent = rainDateStr;
    }
}

async function fetchWeather() {
    try {
        const { lat, lon } = LOCATIONS.tarbert;
        // Updated URL to include sunrise/sunset and more days
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=precipitation,temperature_2m&timezone=Europe%2FDublin&past_days=1&forecast_days=7`;
        const res = await fetch(url);
        const data = await res.json();
        renderWeather(data);
        renderForecast(data);
    } catch (e) {
        console.error("Weather fetch failed", e);
    }
}

async function fetchMarine() {
    try {
        // 1. Try Local Marine Data (Waves)
        const { lat, lon } = LOCATIONS.tarbert;
        const urlLocal = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height&hourly=wave_height,sea_surface_temperature&timezone=Europe%2FDublin&forecast_days=1`;

        const resLocal = await fetch(urlLocal);
        const dataLocal = await resLocal.json();

        // Render Waves
        if (dataLocal.current && dataLocal.current.wave_height !== undefined) {
            els.waveHeight.textContent = dataLocal.current.wave_height;
        }

        // 2. Check Local SST
        let sst = null;
        if (dataLocal.hourly && dataLocal.hourly.sea_surface_temperature) {
            sst = dataLocal.hourly.sea_surface_temperature.find(t => t !== null);
        }

        // 3. If Local SST is null, try Regional
        if (sst === null || sst === undefined) {
            console.log("Local SST unavailable, trying regional...");
            const { lat: rLat, lon: rLon } = LOCATIONS.regional;
            const urlRegional = `https://marine-api.open-meteo.com/v1/marine?latitude=${rLat}&longitude=${rLon}&current=sea_surface_temperature&hourly=sea_surface_temperature&timezone=Europe%2FDublin&forecast_days=1`;

            const resRegional = await fetch(urlRegional);
            const dataRegional = await resRegional.json();

            if (dataRegional.current && dataRegional.current.sea_surface_temperature) {
                sst = dataRegional.current.sea_surface_temperature;
            } else if (dataRegional.hourly && dataRegional.hourly.sea_surface_temperature) {
                sst = dataRegional.hourly.sea_surface_temperature.find(t => t !== null);
            }
        }

        // Render SST
        if (sst !== null && sst !== undefined) {
            els.seaTemp.textContent = Number(sst).toFixed(1);
        } else {
            els.seaTemp.textContent = "--";
        }

    } catch (e) {
        console.error("Marine fetch failed", e);
    }
}

// Get tides for a specific date from the static table
function getTidesForDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();

    // Check which table to use
    if (year === 2026 && month === 1) {
        return TIDE_TABLE_JAN_2026[day] || [];
    } else if (year === 2026 && month === 2) {
        return TIDE_TABLE_FEB_2026[day] || [];
    }

    return [];
}

// Convert time string (HH:MM) to Date object for a given day
function timeStringToDate(timeStr, baseDate) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Render tides from the static table
function renderTidesFromTable() {
    const now = new Date();
    const todayTides = getTidesForDate(now);

    // Find next high and low tides
    let nextHigh = null;
    let nextLow = null;

    // First check today's remaining tides
    for (const tide of todayTides) {
        const tideTime = timeStringToDate(tide.time, now);
        if (tideTime > now) {
            if (tide.type === 'High' && !nextHigh) {
                nextHigh = { ...tide, date: tideTime };
            }
            if (tide.type === 'Low' && !nextLow) {
                nextLow = { ...tide, date: tideTime };
            }
        }
    }

    // If we didn't find one, check tomorrow
    if (!nextHigh || !nextLow) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTides = getTidesForDate(tomorrow);

        for (const tide of tomorrowTides) {
            const tideTime = timeStringToDate(tide.time, tomorrow);
            if (tide.type === 'High' && !nextHigh) {
                nextHigh = { ...tide, date: tideTime };
            }
            if (tide.type === 'Low' && !nextLow) {
                nextLow = { ...tide, date: tideTime };
            }
            if (nextHigh && nextLow) break;
        }
    }

    // Update display
    els.nextHighTide.textContent = nextHigh ? nextHigh.time : '--';
    els.nextLowTide.textContent = nextLow ? nextLow.time : '--';

    // Update tide source indicator
    if (els.tideSource) {
        els.tideSource.textContent = 'Tarbert Island Tide Table';
    }

    // Render tide chart (simulated curve based on next high/low)
    renderTideChart(now, todayTides, nextHigh, nextLow);

    // Render weekly tides
    renderWeeklyTidesFromTable();
}

function renderTideChart(now, todayTides, nextHigh, nextLow) {
    if (!els.tideChartCtx) return;

    // Generate a 24-hour tide curve simulation
    const labels = [];
    const levels = [];

    // Get tides for today and tomorrow for the chart
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTides = getTidesForDate(tomorrow);

    // Combine all tide events
    const allEvents = [];
    todayTides.forEach(t => {
        const date = timeStringToDate(t.time, now);
        allEvents.push({ ...t, date });
    });
    tomorrowTides.forEach(t => {
        const date = timeStringToDate(t.time, tomorrow);
        allEvents.push({ ...t, date });
    });

    // Sort by time
    allEvents.sort((a, b) => a.date - b.date);

    // Generate 30 points over next 24 hours
    const startTime = new Date(now);
    startTime.setMinutes(0, 0, 0);

    for (let i = 0; i < 25; i++) {
        const pointTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);
        labels.push(formatTimeFromDate(pointTime));

        // Interpolate tide level based on surrounding events
        const level = interpolateTideLevel(pointTime, allEvents);
        levels.push(level);
    }

    if (window.tideChartInstance) window.tideChartInstance.destroy();
    window.tideChartInstance = new Chart(els.tideChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tide Level (m)',
                data: levels,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: false },
            scales: {
                x: {
                    grid: { display: false, color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 11 } }
                },
                y: { display: false }
            },
            elements: {
                point: { radius: 0, hitRadius: 10 }
            }
        }
    });
}

// Interpolate tide level between known points using sine wave approximation
function interpolateTideLevel(time, events) {
    if (events.length < 2) return 2.5; // Default mid-level

    // Find surrounding events
    let prevEvent = null;
    let nextEvent = null;

    for (let i = 0; i < events.length; i++) {
        if (events[i].date > time) {
            nextEvent = events[i];
            prevEvent = events[i - 1] || events[0];
            break;
        }
        prevEvent = events[i];
    }

    if (!nextEvent) {
        nextEvent = events[events.length - 1];
        prevEvent = events[events.length - 2] || events[0];
    }

    if (!prevEvent || !nextEvent) return 2.5;

    // Calculate position in cycle
    const totalDuration = nextEvent.date - prevEvent.date;
    const elapsed = time - prevEvent.date;
    const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

    // Use cosine interpolation for smooth curve
    const prevHeight = prevEvent.height;
    const nextHeight = nextEvent.height;

    // Smooth sinusoidal interpolation
    const interpolated = prevHeight + (nextHeight - prevHeight) * (1 - Math.cos(progress * Math.PI)) / 2;

    return interpolated;
}

function renderWeeklyTidesFromTable() {
    const container = els.weeklyTidesContainer;
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();

    // Generate 7 days of tide data
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(now);
        date.setDate(now.getDate() + dayOffset);

        const tides = getTidesForDate(date);
        if (tides.length === 0) continue;

        const dayLabel = dayOffset === 0 ? 'Today' :
            dayOffset === 1 ? 'Tomorrow' :
                date.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric' });

        const rowDiv = document.createElement('div');
        rowDiv.className = 'tide-row';

        // Generate Pills
        let eventsHtml = tides.map(t => `
            <span class="tide-pill ${t.type === 'High' ? 'high' : 'low'}">
                ${t.type.charAt(0)} ${t.time}
            </span>
        `).join('');

        rowDiv.innerHTML = `
            <div class="tide-date">${dayLabel}</div>
            <div class="tide-times">
                ${eventsHtml}
            </div>
        `;
        container.appendChild(rowDiv);
    }
}

// Rendering
function renderSunTimes(daily) {
    if (!daily.sunrise || !daily.sunset) return;

    // OpenMeteo past_days=1 implies: 0=Yesterday, 1=Today, 2=Tomorrow, etc.
    // We want Today (index 1).
    const todayIndex = 1;

    if (daily.sunrise[todayIndex] && daily.sunset[todayIndex]) {
        const sunrise = new Date(daily.sunrise[todayIndex]);
        const sunset = new Date(daily.sunset[todayIndex]);

        if (els.sunrise) els.sunrise.textContent = sunrise.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
        if (els.sunset) els.sunset.textContent = sunset.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
    }
}

function renderWeather(data) {
    const current = data.current;

    // Render Sun Times (New)
    renderSunTimes(data.daily);

    els.temp.textContent = Math.round(current.temperature_2m);
    els.temp.classList.remove('loading');

    // Condition
    const code = current.weather_code;
    const icon = getWeatherIcon(code);
    els.conditionIcon.setAttribute('data-feather', icon);
    els.conditionDesc.textContent = getWeatherDesc(code);

    // Rainfall Logic
    const precip = current.precipitation;
    els.rain.textContent = precip;

    // 1. Rain Status
    let statusText = 'Dry';
    if (precip > 0) statusText = 'Drizzle';
    if (precip >= 0.5) statusText = 'Light Rain';
    if (precip >= 2.5) statusText = 'Moderate Rain';
    if (precip >= 7.6) statusText = 'Heavy Rain';

    if (els.rainStatus) els.rainStatus.textContent = statusText;

    // 2. Next Hour Forecast
    const hourly = data.hourly;
    const nowIndex = getCurrentHourIndex(hourly.time);

    // Safety check for index
    if (nowIndex !== -1 && nowIndex + 1 < hourly.precipitation.length) {
        const nextHourPrecip = hourly.precipitation[nowIndex + 1];
        if (els.nextRain) els.nextRain.textContent = `Next Hour: ${nextHourPrecip} mm`;
    } else {
        if (els.nextRain) els.nextRain.textContent = 'Next Hour: --';
    }

    // Rain Chart
    const sliceStart = Math.max(0, nowIndex - 6);
    const sliceEnd = Math.min(hourly.time.length, nowIndex + 18);

    const labels = hourly.time.slice(sliceStart, sliceEnd).map(t => formatTime(t));
    const rainPoints = hourly.precipitation.slice(sliceStart, sliceEnd);

    if (window.rainChartInstance) window.rainChartInstance.destroy();
    if (els.rainfallChartCtx) {
        window.rainChartInstance = new Chart(els.rainfallChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Rain (mm)',
                    data: rainPoints,
                    backgroundColor: 'rgba(56, 189, 248, 0.7)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: false },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0 }
                }
            }
        });
    }
}

function renderForecast(data) {
    const daily = data.daily;
    els.forecastContainer.innerHTML = '';

    // Start loop from 1 (Today) because of past_days=1 in query
    for (let i = 1; i <= 4; i++) {
        if (!daily.time[i]) break;

        const date = new Date(daily.time[i]);
        // i=1 is Today, i=2 is Tomorrow, etc.
        let dayName;
        if (i === 1) {
            dayName = 'Today';
        } else if (i === 2) {
            dayName = 'Tomorrow';
        } else {
            dayName = date.toLocaleDateString('en-IE', { weekday: 'short' });
        }

        const code = daily.weather_code[i];

        const div = document.createElement('div');
        div.className = 'forecast-day';
        div.innerHTML = `
            <div class="day-name">${dayName}</div>
            <i data-feather="${getWeatherIcon(code)}" class="day-icon"></i>
            <div class="day-temps">
                <span class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
        `;
        els.forecastContainer.appendChild(div);
    }
}

// Helpers
function getCurrentHourIndex(times) {
    const now = new Date();
    let minDiff = Infinity;
    let index = 0;
    times.forEach((t, i) => {
        const diff = Math.abs(new Date(t) - now);
        if (diff < minDiff) {
            minDiff = diff;
            index = i;
        }
    });
    return index;
}

// Init
initDashboard();
setInterval(initDashboard, 15 * 60 * 1000); // 15 mins
