/**
 * Tarbert Coastal Dashboard Logic
 */

// Coordinates
const LOCATIONS = {
    tarbert: { lat: 52.5718, lon: -9.3703 }, // Local (Weather, Waves)
    regional: { lat: 52.5800, lon: -9.6500 } // Deep Water (SST fallback)
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
    rainfallChartCtx: document.getElementById('rainfallChart').getContext('2d'),
    tideChartCtx: document.getElementById('tideChart').getContext('2d')
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

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Data Fetching
async function initDashboard() {
    updateTime();

    // Parallel fetching
    await Promise.all([
        fetchWeather(),
        fetchMarine(),
        fetchTides()
    ]);

    feather.replace();
}

function updateTime() {
    const now = new Date();
    els.updatedTime.textContent = now.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

    // Update Rainfall Card Date
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    const dateStr = now.toLocaleDateString('en-IE', dateOptions);
    if (document.getElementById('rain-date')) {
        document.getElementById('rain-date').textContent = dateStr;
    }
}

async function fetchWeather() {
    try {
        const { lat, lon } = LOCATIONS.tarbert;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=precipitation,temperature_2m&timezone=Europe%2FLondon&past_days=1&forecast_days=2`;
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
        const urlLocal = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height&hourly=wave_height,sea_surface_temperature&timezone=Europe%2FLondon&forecast_days=1`;

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
            const urlRegional = `https://marine-api.open-meteo.com/v1/marine?latitude=${rLat}&longitude=${rLon}&current=sea_surface_temperature&hourly=sea_surface_temperature&timezone=Europe%2FLondon&forecast_days=1`;

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

async function fetchTides() {
    try {
        const baseUrl = "https://erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.json";

        // Strict URL construction
        const safeQuery = `?time,Water_Level&stationID=%22Kilrush%22&time%3E=now-6hours&time%3C=now%2B24hours`;

        const res = await fetch(baseUrl + safeQuery);
        if (!res.ok) throw new Error(`Tide API Error: ${res.status}`);

        const data = await res.json();

        const rows = data.table.rows; // Array of [timeString, waterLevel]

        // Parse rows
        const tideData = rows.map(r => ({
            time: r[0],
            level: r[1]
        }));

        renderTides(tideData);

    } catch (e) {
        console.error("Tide fetch failed", e);
        els.nextHighTide.textContent = "--";
        els.nextLowTide.textContent = "--";
    }
}

// Rendering
function renderWeather(data) {
    const current = data.current;
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
    window.rainChartInstance = new Chart(els.rainfallChartCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rain (mm)',
                data: rainPoints,
                backgroundColor: '#38bdf8',
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

function renderForecast(data) {
    const daily = data.daily;
    els.forecastContainer.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-IE', { weekday: 'short' });
        const code = daily.weather_code[i];

        const div = document.createElement('div');
        div.className = 'forecast-day';
        div.innerHTML = `
            <div class="day-name">${dayName}</div>
            <i data-feather="${getWeatherIcon(code)}" class="day-icon"></i>
            <div class="day-temp">${Math.round(daily.temperature_2m_max[i])}°</div>
        `;
        els.forecastContainer.appendChild(div);
    }
}

function renderTides(tideData) {
    if (!tideData || tideData.length < 3) {
        console.error("Insufficient tide data");
        els.nextHighTide.textContent = '--';
        els.nextLowTide.textContent = '--';
        return;
    }

    // Logic: Look for local peaks/troughs
    const peaks = [];
    const troughs = [];

    // Improved peak/trough detection (handles plateaus)
    for (let i = 1; i < tideData.length - 1; i++) {
        const prev = tideData[i - 1].level;
        const curr = tideData[i].level;
        const next = tideData[i + 1].level;

        if (curr >= prev && curr > next) {
            peaks.push(tideData[i]);
        } else if (curr > prev && curr >= next) {
            peaks.push(tideData[i]);
        }

        if (curr <= prev && curr < next) {
            troughs.push(tideData[i]);
        } else if (curr < prev && curr <= next) {
            troughs.push(tideData[i]);
        }
    }

    const now = new Date();
    const parseTime = (t) => new Date(t);

    // Find the next High and Low that are in the future
    let nextHigh = peaks.find(p => parseTime(p.time) > now);
    let nextLow = troughs.find(p => parseTime(p.time) > now);

    // Conflict Resolution: If they are suspiciously close (e.g. data noise),
    // or if we found "the same" event due to some bug, ensure they are distinct.
    if (nextHigh && nextLow) {
        const hTime = parseTime(nextHigh.time).getTime();
        const lTime = parseTime(nextLow.time).getTime();
        const diffHours = Math.abs(hTime - lTime) / 36e5;

        // Tides are usually ~6 hours apart. If < 2 hours, something is wrong.
        // It likely means one of them is valid and the other is a local noise point 
        // near the same time, OR we just grabbed the immediate next ones and one is 
        // effectively "now" and the other is slightly "later" but part of same cycle.

        // Actually, usually we just want the *Next* absolute High and *Next* absolute Low.
        // They legitimately might be 6 hours apart.
        // If they are < 2 hours, it's weird.
        if (diffHours < 2) {
            // If High is first, then the detected "Low" might be a false dip.
            // Find the next Low that is *after* this High + 2 hours.
            if (hTime < lTime) {
                nextLow = troughs.find(p => parseTime(p.time).getTime() > hTime + 72e5);
            } else {
                nextHigh = peaks.find(p => parseTime(p.time).getTime() > lTime + 72e5);
            }
        }
    }

    // Fallback if still not found (e.g. end of data window)
    if (!nextHigh && peaks.length > 0) nextHigh = peaks[peaks.length - 1]; // Just show last known
    if (!nextLow && troughs.length > 0) nextLow = troughs[troughs.length - 1];

    console.log("Next High Found:", nextHigh);
    console.log("Next Low Found:", nextLow);

    els.nextHighTide.textContent = nextHigh ? formatTime(nextHigh.time) : '--';
    els.nextLowTide.textContent = nextLow ? formatTime(nextLow.time) : '--';

    // Chart
    const labels = tideData.map(d => formatTime(d.time));
    const levels = tideData.map(d => d.level);

    if (window.tideChartInstance) window.tideChartInstance.destroy();
    window.tideChartInstance = new Chart(els.tideChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tide Level (m)',
                data: levels,
                borderColor: '#a5b4fc',
                backgroundColor: 'rgba(165, 180, 252, 0.2)',
                borderWidth: 2,
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
                    grid: { display: false },
                    ticks: { color: '#64748b', maxTicksLimit: 6 }
                },
                y: { display: false }
            },
            elements: {
                point: { radius: 0, hitRadius: 10 }
            }
        }
    });
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
