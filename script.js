/**
 * Tarbert Coastal Dashboard Logic
 * Updated with accurate Tarbert Island Tide Table data
 */

// Coordinates
const LOCATIONS = {
    tarbert: { lat: 52.5718, lon: -9.3703 }, // Local (Weather, Waves)
    regional: { lat: 52.5800, lon: -9.6500 } // Deep Water (SST fallback)
};

// Global state for sharing data between cards
let lastWeatherData = null;

// DOM Elements
const els = {
    temp: document.getElementById('current-temp'),
    conditionIcon: document.getElementById('weather-icon'),
    conditionDesc: document.getElementById('weather-desc'),
    feelsLike: document.getElementById('feels-like'),
    rain: document.getElementById('current-rain'),
    rainStatus: document.getElementById('rain-status'),
    nextRain: document.getElementById('next-hour-rain'),
    seaTemp: document.getElementById('sea-temp'),
    waveHeight: document.getElementById('wave-height'),
    windSpeed: document.getElementById('wind-speed'),
    windDir: document.getElementById('wind-dir'),
    windGusts: document.getElementById('wind-gusts'),
    windBeaufort: document.getElementById('wind-beaufort'),
    compassNeedle: document.getElementById('compass-needle'),
    nextHighTide: document.getElementById('next-high-tide'),
    nextLowTide: document.getElementById('next-low-tide'),
    nextHighHeight: document.getElementById('next-high-height'),
    nextLowHeight: document.getElementById('next-low-height'),
    tideState: document.getElementById('tide-state'),
    swimSafety: document.getElementById('swim-safety'),
    forecastContainer: document.getElementById('forecast-container'),
    updatedTime: document.getElementById('last-updated-time'),
    rainfallChartCtx: document.getElementById('rainfallChart')?.getContext('2d'),
    tideChartCtx: document.getElementById('tideChart')?.getContext('2d'),
    sunrise: document.getElementById('sunrise-time'),
    sunset: document.getElementById('sunset-time'),
    weeklyTidesContainer: document.getElementById('weekly-tides-container'),
    currentDate: document.getElementById('current-date'),
    tideSource: document.getElementById('tide-source'),
    moonIcon: document.getElementById('moon-icon'),
    moonLabel: document.getElementById('moon-label'),
    moonTideType: document.getElementById('moon-tide-type'),
    highTideContext: document.getElementById('high-tide-context'),
    lowTideContext: document.getElementById('low-tide-context'),
    seaTempTrend: document.getElementById('sea-temp-trend'),
    seaTempHero: document.getElementById('sea-temp-hero'),
    seaTempTrendHero: document.getElementById('sea-temp-trend-hero')
};

// Weather Codes Mapping - Improved for Feather Icons
const weatherCodes = {
    0: { desc: 'Clear Sky', icon: 'sun' },
    1: { desc: 'Mainly Clear', icon: 'cloud-sun' },
    2: { desc: 'Partly Cloudy', icon: 'cloud' },
    3: { desc: 'Overcast', icon: 'cloud' },
    45: { desc: 'Foggy', icon: 'cloud' },
    48: { desc: 'Rime Fog', icon: 'cloud' },
    51: { desc: 'Light Drizzle', icon: 'cloud-drizzle' },
    53: { desc: 'Moderate Drizzle', icon: 'cloud-drizzle' },
    55: { desc: 'Dense Drizzle', icon: 'cloud-drizzle' },
    61: { desc: 'Slight Rain', icon: 'cloud-rain' },
    63: { desc: 'Moderate Rain', icon: 'cloud-rain' },
    65: { desc: 'Heavy Rain', icon: 'cloud-rain' },
    71: { desc: 'Slight Snow', icon: 'cloud-snow' },
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
        return timeStr.slice(11, 16);
    }
    return timeStr;
}

function formatTimeFromDate(date) {
    return date.toLocaleTimeString('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: false });
}

// Get the correct day name accounting for timezone
function getDayName(date, isToday = false) {
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin', weekday: 'short' });
}

// Moon Phase Calculation
function getMoonPhase(date) {
    // Known new moon: 2024-01-11 11:57 UTC
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const synodicMonth = 29.53058867;
    const diff = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phase = (diff / synodicMonth) % 1;
    const phaseValue = phase < 0 ? phase + 1 : phase;

    const phases = [
        { name: 'New Moon', icon: '🌑', type: 'Spring' },
        { name: 'Waxing Crescent', icon: '🌒', type: '' },
        { name: 'First Quarter', icon: '🌓', type: 'Neap' },
        { name: 'Waxing Gibbous', icon: '🌔', type: '' },
        { name: 'Full Moon', icon: '🌕', type: 'Spring' },
        { name: 'Waning Gibbous', icon: '🌖', type: '' },
        { name: 'Last Quarter', icon: '🌗', type: 'Neap' },
        { name: 'Waning Crescent', icon: '🌘', type: '' }
    ];

    const index = Math.floor(phaseValue * 8 + 0.5) % 8;
    return phases[index];
}

// Data Fetching
async function initDashboard() {
    updateTime();
    renderTidesFromTable();

    // Parallel fetching
    await Promise.all([
        fetchWeather(),
        fetchMarine()
    ]);

    if (typeof feather !== 'undefined') feather.replace();
}

function updateTime() {
    const now = new Date();
    els.updatedTime.textContent = now.toLocaleTimeString('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit' });

    // Update current date display
    const dateOptions = { timeZone: 'Europe/Dublin', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-IE', dateOptions);
    if (els.currentDate) {
        els.currentDate.textContent = dateStr;
    }

    // Update Rainfall Card Date - show just day and time
    const rainDateOptions = { timeZone: 'Europe/Dublin', weekday: 'short', day: 'numeric', month: 'short' };
    const rainDateStr = now.toLocaleDateString('en-IE', rainDateOptions);
    if (document.getElementById('rain-date')) {
        document.getElementById('rain-date').textContent = rainDateStr;
    }
}

async function fetchWeather() {
    try {
        const { lat, lon } = LOCATIONS.tarbert;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=precipitation,precipitation_probability,temperature_2m&timezone=Europe%2FDublin&past_days=1&forecast_days=7`;
        const res = await fetch(url);
        const data = await res.json();
        lastWeatherData = data;
        renderWeather(data);
        renderForecast(data);
        renderTideChart(Date.now()); // Add timeline sky markers as soon as sun times arrive.
    } catch (e) {
        console.error("Weather fetch failed", e);
    }
}

async function fetchMarine() {
    try {
        // 1. Try Local Marine Data (Waves + SST trend)
        const { lat, lon } = LOCATIONS.tarbert;
        // Fetch 2 days to compare with yesterday
        const urlLocal = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,sea_surface_temperature&hourly=sea_surface_temperature&timezone=Europe%2FDublin&past_days=1&forecast_days=1`;

        const resLocal = await fetch(urlLocal);
        const dataLocal = await resLocal.json();

        // Render Waves
        if (dataLocal.current && dataLocal.current.wave_height !== undefined) {
            els.waveHeight.textContent = dataLocal.current.wave_height;
        }

        // 2. Check Local SST and Trend
        let sst = null;
        let sstYesterday = null;

        if (dataLocal.current && dataLocal.current.sea_surface_temperature) {
            sst = dataLocal.current.sea_surface_temperature;
        }

        // Calculate Trend from hourly (compare now to 24h ago)
        if (dataLocal.hourly && dataLocal.hourly.sea_surface_temperature) {
            const hourlySST = dataLocal.hourly.sea_surface_temperature;
            const nowIdx = getCurrentHourIndex(dataLocal.hourly.time);
            if (nowIdx !== -1) {
                if (sst === null) sst = hourlySST[nowIdx];
                // Go back 24 hours
                const yesterdayIdx = nowIdx - 24;
                if (yesterdayIdx >= 0) {
                    sstYesterday = hourlySST[yesterdayIdx];
                }
            }
        }

        // 3. Fallback to Regional if needed
        if (sst === null) {
            console.log("Local SST unavailable, trying regional...");
            const { lat: rLat, lon: rLon } = LOCATIONS.regional;
            const urlRegional = `https://marine-api.open-meteo.com/v1/marine?latitude=${rLat}&longitude=${rLon}&current=sea_surface_temperature&hourly=sea_surface_temperature&timezone=Europe%2FDublin&forecast_days=1`;

            const resRegional = await fetch(urlRegional);
            const dataRegional = await resRegional.json();

            if (dataRegional.current && dataRegional.current.sea_surface_temperature) {
                sst = dataRegional.current.sea_surface_temperature;
            }
        }

        // Render SST and Trend
        if (sst !== null && sst !== undefined) {
            els.seaTemp.textContent = Number(sst).toFixed(1);

            if (els.seaTempTrend && sstYesterday !== null) {
                const diff = sst - sstYesterday;
                if (Math.abs(diff) < 0.1) {
                    els.seaTempTrend.textContent = '→';
                    els.seaTempTrend.className = 'temp-trend trend-stable';
                    els.seaTempTrend.title = 'Temperature is stable (vs yesterday)';
                } else if (diff > 0) {
                    els.seaTempTrend.textContent = '↑';
                    els.seaTempTrend.className = 'temp-trend trend-up';
                    els.seaTempTrend.title = `Warming up (+${diff.toFixed(1)}°C since yesterday)`;
                } else {
                    els.seaTempTrend.textContent = '↓';
                    els.seaTempTrend.className = 'temp-trend trend-down';
                    els.seaTempTrend.title = `Cooling down (${diff.toFixed(1)}°C since yesterday)`;
                }
            }
        } else {
            if (els.seaTemp) els.seaTemp.textContent = "--";
            if (els.seaTempHero) els.seaTempHero.textContent = "--";
        }

        // Render to Hero
        if (sst !== null && sst !== undefined && els.seaTempHero) {
            els.seaTempHero.textContent = Number(sst).toFixed(1);
            if (els.seaTempTrendHero && els.seaTempTrend) {
                els.seaTempTrendHero.innerHTML = els.seaTempTrend.innerHTML;
                els.seaTempTrendHero.className = els.seaTempTrend.className;
            }
        }

        // Update Wave Status
        if (dataLocal.current?.wave_height !== undefined) {
            const h = dataLocal.current.wave_height;
            const waveStatus = document.getElementById('wave-status');
            if (waveStatus) waveStatus.textContent = getWaveSummary(h);
        }

        // Re-evaluate swim safety with marine data
        const ws = parseFloat(els.windSpeed?.textContent) || 0;
        const wh = dataLocal.current?.wave_height || 0;
        updateSwimSafety(ws, wh, sst);

    } catch (e) {
        console.error("Marine fetch failed", e);
    }
}

// Rendering
function renderSunTimes(daily) {
    if (!daily.sunrise || !daily.sunset) return;

    // OpenMeteo past_days=1 implies: 0=Yesterday, 1=Today, 2=Tomorrow, etc.
    // We want Today (index 1).
    const todayIndex = 1;

    if (daily.sunrise[todayIndex] && daily.sunset[todayIndex]) {
        const sunrise = formatTime(daily.sunrise[todayIndex]);
        const sunset = formatTime(daily.sunset[todayIndex]);

        if (els.sunrise) els.sunrise.textContent = sunrise;
        if (els.sunset) els.sunset.textContent = sunset;
    }
}

// Convert wind degrees to compass direction
function getWindDirection(degrees) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(degrees / 22.5) % 16];
}

// Short, punchy wind summary
function getWindSummary(kmh, gusts = 0) {
    if (kmh < 1) return "Flat calm";
    if (kmh < 6) return "Barely any wind";
    if (kmh < 12) return "Light breeze";
    if (kmh < 20) return (gusts > 30) ? "Gentle but gusty" : "Gentle breeze";
    if (kmh < 29) return (gusts > 45) ? "Strong gusts" : "Moderate breeze";
    if (kmh < 39) return "Fresh winds";
    if (kmh < 50) return "Strong winds";
    return "Rough conditions";
}

function getWaveSummary(height) {
    if (height < 0.2) return "Flat / Glassy";
    if (height < 0.5) return "Calm";
    if (height < 0.8) return "Small Chop";
    if (height < 1.3) return "Moderate Chop";
    if (height < 2.0) return "Lumpy / Rough";
    return "Very Rough";
}

// Update swim safety badge based on conditions
function updateSwimSafety(windSpeed, waveHeight, waterTemp, windGusts = 0) {
    const el = els.swimSafety;
    if (!el) return;

    let score = 0; // lower = better

    // Base wind check
    if (windSpeed > 30) score += 3;
    else if (windSpeed > 20) score += 2;
    else if (windSpeed > 12) score += 1;

    // Gust check - gusts are often more dangerous than average wind
    if (windGusts > 45) score += 4; // Dangerous
    else if (windGusts > 30) score += 2; // Significant chop
    else if (windGusts > 20 && windGusts > windSpeed * 1.5) score += 1; // "Gusty" conditions


    if (waveHeight > 1.5) score += 3;
    else if (waveHeight > 0.8) score += 1;

    if (waterTemp !== null && waterTemp < 8) score += 1;

    el.classList.remove('swim-good', 'swim-caution', 'swim-poor');
    if (score <= 1) {
        el.textContent = '✓ GOOD';
        el.classList.add('swim-good');
    } else if (score <= 3) {
        el.textContent = '⚠ CAUTION';
        el.classList.add('swim-caution');
    } else {
        el.textContent = '✖ ROUGH';
        el.classList.add('swim-poor');
    }
}

function renderWeather(data) {
    const current = data.current;

    // Render Sun Times
    renderSunTimes(data.daily);

    els.temp.textContent = Math.round(current.temperature_2m);
    els.temp.classList.remove('loading');

    // Feels Like
    if (els.feelsLike && current.apparent_temperature !== undefined) {
        const feelsLike = Math.round(current.apparent_temperature);
        const actualTemp = Math.round(current.temperature_2m);
        if (feelsLike !== actualTemp) {
            els.feelsLike.textContent = `Feels like ${feelsLike}°`;
        } else {
            els.feelsLike.textContent = '';
        }
    }

    // Wind
    if (current.wind_speed_10m !== undefined) {
        if (els.windSpeed) els.windSpeed.textContent = Math.round(current.wind_speed_10m);
        if (els.windDir && current.wind_direction_10m !== undefined) {
            els.windDir.textContent = getWindDirection(current.wind_direction_10m);
        }

        // Rotate compass needle to wind direction
        if (els.compassNeedle && current.wind_direction_10m !== undefined) {
            els.compassNeedle.style.transform = `translate(-50%, -50%) rotate(${current.wind_direction_10m}deg)`;
        }

        // Wind gusts
        if (els.windGusts && current.wind_gusts_10m !== undefined) {
            els.windGusts.innerHTML = `${Math.round(current.wind_gusts_10m)}<span class="wind-detail-unit">km/h</span>`;
        }

        // Casual summary with gust context
        if (els.windBeaufort) {
            els.windBeaufort.textContent = getWindSummary(current.wind_speed_10m, current.wind_gusts_10m);
            els.windBeaufort.style.fontStyle = 'italic';
            els.windBeaufort.style.opacity = '0.9';
        }

        // Update compass speed display - Just the main number
        if (els.windSpeed) {
            const windVal = Math.round(current.wind_speed_10m);
            els.windSpeed.textContent = windVal;
        }

        // Update swim safety with wind + gusts
        const wh = parseFloat(document.getElementById('wave-height')?.textContent) || 0;
        const wt = parseFloat(document.getElementById('sea-temp')?.textContent) || null;
        updateSwimSafety(current.wind_speed_10m, wh, wt, current.wind_gusts_10m);
    }

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

    // 2. Next Rain Analysis
    const hourly = data.hourly;
    const nowIndex = getCurrentHourIndex(hourly.time);

    // Find "Next Rain Time" and "24h Total"
    let nextRainTime = null;
    let total24hRain = 0;

    // Look ahead 24 hours
    for (let i = nowIndex; i < nowIndex + 24; i++) {
        if (i >= hourly.precipitation.length) break;
        const precip = hourly.precipitation[i];
        total24hRain += precip;

        if (precip > 0 && nextRainTime === null && i > nowIndex) {
            nextRainTime = hourly.time[i];
        }
    }

    // Update Rain Indicators
    if (els.nextRain) {
        if (nextRainTime) {
            const time = formatTime(nextRainTime);
            els.nextRain.textContent = `Rain expected @ ${time}`;
        } else {
            els.nextRain.textContent = 'No rain expected today';
        }
    }

    // 24h Total and Probability
    if (document.getElementById('rain-total')) {
        document.getElementById('rain-total').textContent = total24hRain.toFixed(1);
    }
    if (document.getElementById('rain-prob') && hourly.precipitation_probability) {
        document.getElementById('rain-prob').textContent = `${hourly.precipitation_probability[nowIndex]}%`;
    }

    // Rain Chart - Better 12 hour view
    const sliceStart = nowIndex;
    const sliceEnd = Math.min(hourly.time.length, nowIndex + 12);

    const labels = hourly.time.slice(sliceStart, sliceEnd).map(t => formatTime(t).split(':')[0]); // Just the hour
    const rainPoints = hourly.precipitation.slice(sliceStart, sliceEnd);
    const probPoints = hourly.precipitation_probability ? hourly.precipitation_probability.slice(sliceStart, sliceEnd) : [];

    if (window.rainChartInstance) window.rainChartInstance.destroy();
    if (els.rainfallChartCtx) {
        window.rainChartInstance = new Chart(els.rainfallChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rain (mm)',
                        data: rainPoints,
                        backgroundColor: 'rgba(56, 189, 248, 0.7)',
                        hoverBackgroundColor: 'rgba(125, 211, 252, 0.9)',
                        maxBarThickness: 20,
                        borderRadius: 4,
                        order: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Chance (%)',
                        data: probPoints,
                        type: 'line',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false,
                        order: 1,
                        yAxisID: 'yPercentage'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 },
                plugins: { legend: false },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { color: 'rgba(148, 163, 184, 0.2)' },
                        ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 10, weight: 500 } }
                    },
                    y: { display: false, min: 0 },
                    yPercentage: { display: false, min: 0, max: 100 }
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
            dayName = date.toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin', weekday: 'short' });
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
        const instant = TideEngine.civilToEpoch(t.slice(0, 10), t.slice(11, 16));
        if (instant === null) return;
        const diff = Math.abs(instant - now);
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
setInterval(renderTidesFromTable, 60 * 1000); // Keep tide countdowns current independently of APIs.
