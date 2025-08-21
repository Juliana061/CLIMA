// Helper corto
const $ = (id) => document.getElementById(id);

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error de red");
  return res.json();
}

/* === Mapas de códigos de clima (Open-Meteo) === */
function weatherIcon(code){
  // Referencia compacta
  if ([0].includes(code)) return "☀️";                  // Despejado
  if ([1,2,3].includes(code)) return "⛅";              // Parcial nublado
  if ([45,48].includes(code)) return "🌫️";             // Niebla
  if ([51,53,55,56,57].includes(code)) return "🌦️";    // Llovizna
  if ([61,63,65,80,81,82].includes(code)) return "🌧️"; // Lluvia
  if ([66,67].includes(code)) return "🌧️❄️";           // Lluvia helada
  if ([71,73,75,85,86].includes(code)) return "🌨️";    // Nieve
  if ([95,96,99].includes(code)) return "⛈️";           // Tormenta
  return "❓";
}
function weatherText(code){
  const map = {
    0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nublado",3:"Nublado",
    45:"Niebla",48:"Niebla con escarcha",
    51:"Llovizna ligera",53:"Llovizna",55:"Llovizna intensa",
    56:"Llovizna helada ligera",57:"Llovizna helada intensa",
    61:"Lluvia ligera",63:"Lluvia",65:"Lluvia intensa",
    66:"Lluvia helada ligera",67:"Lluvia helada intensa",
    71:"Nieve ligera",73:"Nieve",75:"Nieve intensa",
    77:"Granos de nieve",
    80:"Chubascos ligeros",81:"Chubascos",82:"Chubascos intensos",
    85:"Nevadas ligeras",86:"Nevadas intensas",
    95:"Tormentas",96:"Tormentas con granizo",99:"Tormentas fuertes con granizo"
  };
  return map[code] || "Condición desconocida";
}

/* === Cargar clima actual + pronóstico 5 días === */
async function loadWeather(lat, lon, cityName) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
      `&forecast_days=5&timezone=auto`;

    const data = await fetchJSON(url);

    // --- Actual ---
    const weather = data.current_weather;
    const timezone = data.timezone;
    $("city").textContent = `🌍 ${cityName}`;
    $("temperature").textContent = `🌡️ ${weather.temperature}°C`;
    $("condition").textContent = `☁️ Viento: ${weather.windspeed} km/h`;

    // Hora local
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const hh = String(localTime.getHours()).padStart(2,"0");
    const mm = String(localTime.getMinutes()).padStart(2,"0");
    $("timezone").textContent = `⏰ Zona: ${timezone} | Hora local: ${hh}:${mm}`;

    // --- Pronóstico diario (5 días) ---
    const d = data.daily;
    const grid = $("forecastGrid");
    grid.innerHTML = d.time.map((iso, i) => {
      const date = new Date(iso + "T00:00:00");
      const dow = date.toLocaleDateString(undefined, { weekday: "short" });
      const code = d.weathercode[i];
      const tmax = Math.round(d.temperature_2m_max[i]);
      const tmin = Math.round(d.temperature_2m_min[i]);
      return `
        <div class="day-card">
          <div class="dow">${dow}</div>
          <div class="icon">${weatherIcon(code)}</div>
          <div class="range">${tmin}° / ${tmax}°</div>
          <div class="desc">${weatherText(code)}</div>
        </div>
      `;
    }).join("");

    addToHistory(cityName, lat, lon);
  } catch (err) {
    console.error(err);
    alert("Error al obtener el clima");
  }
}

/* === Búsqueda (Open-Meteo Geocoding) === */
async function searchCity(city) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geo = await fetchJSON(geoUrl);
    if (!geo.results || geo.results.length === 0) return alert("Ciudad no encontrada");

    const place = geo.results[0];
    loadWeather(place.latitude, place.longitude, `${place.name}${place.country ? ", "+place.country : ""}`);
  } catch (err) {
    console.error(err);
    alert("Error en la búsqueda");
  }
}

/* === Historial simple en sesión === */
function addToHistory(city, lat, lon) {
  const li = document.createElement("li");
  li.textContent = city;
  li.onclick = () => loadWeather(lat, lon, city);
  $("historyList").prepend(li);
}

/* === Eventos UI === */
$("searchBtn").addEventListener("click", () => {
  const city = $("cityInput").value.trim();
  if (city) searchCity(city);
});
$("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") $("searchBtn").click();
});

/* === Tema claro/oscuro === */
const themeToggle = $("theme-toggle");
if (localStorage.getItem("theme")) {
  document.documentElement.setAttribute("data-theme", localStorage.getItem("theme"));
  themeToggle.textContent = localStorage.getItem("theme") === "dark" ? "☀️" : "🌙";
} else {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  themeToggle.textContent = prefersDark ? "☀️" : "🌙";
}
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  themeToggle.textContent = next === "dark" ? "☀️" : "🌙";
});

