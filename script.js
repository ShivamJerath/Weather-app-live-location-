const apiKey ="a214f1b2dfdad1a35049679719c0204c";
const currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";
let unit = "metric"; // Default unit
let currentData = null;
let forecastData = null;

async function getWeather(city = document.getElementById("city-input").value.trim()) {
    const errorMessage = document.getElementById("error-message");
    const loading = document.getElementById("loading");

    if (!city) {
        errorMessage.textContent = "Please enter a city name";
        return;
    }

    loading.style.display = "block";
    errorMessage.textContent = "";

    try {
        // Fetch current weather
        const currentResponse = await fetch(`${currentWeatherUrl}?q=${city}&appid=${apiKey}&units=${unit}`);
        if (!currentResponse.ok) {
            throw new Error("City not found or API error");
        }
        currentData = await currentResponse.json();
        console.log("Current Weather Data:", currentData);

        // Fetch 5-day forecast
        const forecastResponse = await fetch(`${forecastUrl}?q=${city}&appid=${apiKey}&units=${unit}`);
        if (!forecastResponse.ok) {
            throw new Error("Forecast data unavailable");
        }
        forecastData = await forecastResponse.json();
        console.log("Forecast Data:", forecastData);

        // Update recent searches
        updateRecentSearches(city);
        updateUI(currentData, forecastData);
    } catch (error) {
        console.error("Error fetching weather:", error);
        errorMessage.textContent = error.message;
        document.getElementById("current").style.display = "none";
        document.getElementById("hourly").style.display = "none";
        document.getElementById("daily").style.display = "none";
    } finally {
        loading.style.display = "none";
    }
}

async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        document.getElementById("error-message").textContent = "Geolocation not supported";
        return;
    }

    document.getElementById("loading").style.display = "block";
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const currentResponse = await fetch(`${currentWeatherUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`);
                if (!currentResponse.ok) throw new Error("Location data unavailable");
                currentData = await currentResponse.json();
                console.log("Current Weather (Location):", currentData);

                const forecastResponse = await fetch(`${forecastUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`);
                if (!forecastResponse.ok) throw new Error("Forecast data unavailable");
                forecastData = await forecastResponse.json();
                console.log("Forecast (Location):", forecastData);

                updateRecentSearches(currentData.name);
                updateUI(currentData, forecastData);
            } catch (error) {
                console.error("Error fetching location weather:", error);
                document.getElementById("error-message").textContent = error.message;
            } finally {
                document.getElementById("loading").style.display = "none";
            }
        },
        () => {
            document.getElementById("error-message").textContent = "Location access denied";
            document.getElementById("loading").style.display = "none";
        }
    );
}

function updateUI(currentData, forecastData) {
    // Update current weather
    const cityName = document.getElementById("city-name");
    const currentTemp = document.getElementById("current-temp");
    const currentDesc = document.getElementById("current-desc");
    const currentHumidity = document.getElementById("current-humidity");
    const currentWind = document.getElementById("current-wind");
    const currentPressure = document.getElementById("current-pressure");
    const currentSunrise = document.getElementById("current-sunrise");
    const currentSunset = document.getElementById("current-sunset");
    const currentIcon = document.getElementById("current-icon");

    cityName.textContent = currentData.name;
    const temp = Math.round(unit === "metric" ? currentData.main.temp : (currentData.main.temp * 9/5) + 32);
    currentTemp.textContent = `${temp}${unit === "metric" ? "°C" : "°F"}`;
    currentDesc.textContent = currentData.weather[0].description;
    currentHumidity.textContent = `${currentData.main.humidity}%`;
    currentWind.textContent = `${currentData.wind.speed} ${unit === "metric" ? "km/h" : "mph"}`;
    currentPressure.textContent = `${currentData.main.pressure} hPa`;
    currentSunrise.textContent = new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentSunset.textContent = new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentIcon.src = `http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
    currentIcon.style.display = "block";

    // Update body background based on temperature (converted to Celsius for consistency)
    const tempCelsius = unit === "metric" ? currentData.main.temp : (currentData.main.temp - 32) * 5/9;
    document.body.className = "";
    if (tempCelsius < -10) {
        document.body.classList.add("very-cold");
    } else if (tempCelsius <= 0) {
        document.body.classList.add("cold");
    } else if (tempCelsius <= 15) {
        document.body.classList.add("cool");
    } else if (tempCelsius <= 25) {
        document.body.classList.add("warm");
    } else {
        document.body.classList.add("hot");
    }

    // Update hourly forecast
    const hourlyList = document.getElementById("hourly-list");
    hourlyList.innerHTML = "";
    forecastData.list.slice(0, 8).forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(unit === "metric" ? item.main.temp : (item.main.temp * 9/5) + 32);
        hourlyList.innerHTML += `
            <div class="hourly-item">
                <p>${time}</p>
                <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                <p>${temp}${unit === "metric" ? "°C" : "°F"}</p>
                <p>${item.weather[0].description}</p>
            </div>
        `;
    });

    // Update 5-day forecast
    const dailyList = document.getElementById("daily-list");
    dailyList.innerHTML = "";
    const dailyData = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
    dailyData.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const temp = Math.round(unit === "metric" ? item.main.temp : (item.main.temp * 9/5) + 32);
        dailyList.innerHTML += `
            <div class="daily-item">
                <p>${date}</p>
                <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                <p>Temp: ${temp}${unit === "metric" ? "°C" : "°F"}</p>
                <p>${item.weather[0].description}</p>
            </div>
        `;
    });

    // Show current tab
    showTab("current");
}

function toggleUnit() {
    unit = unit === "metric" ? "imperial" : "metric";
    document.getElementById("unit-toggle").textContent = unit === "metric" ? "°C/°F" : "°F/°C";
    if (currentData && forecastData) {
        updateUI(currentData, forecastData);
    }
}

function updateRecentSearches(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    if (!searches.includes(city)) {
        searches.unshift(city); // Add to start
        if (searches.length > 5) searches.pop(); // Limit to 5
        localStorage.setItem("recentSearches", JSON.stringify(searches));
    }
    displayRecentSearches();
}

function displayRecentSearches() {
    const searchList = document.getElementById("recent-search-list");
    const searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    searchList.innerHTML = "";
    searches.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        li.onclick = () => {
            document.getElementById("city-input").value = city;
            getWeather(city);
        };
        searchList.appendChild(li);
    });
}

function showTab(tabId) {
    document.querySelectorAll(".weather-section").forEach(section => {
        section.classList.remove("active");
    });
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });
    document.getElementById(tabId).classList.add("active");
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add("active");
}

// Load recent searches on page load
document.addEventListener("DOMContentLoaded", displayRecentSearches);

// Allow pressing Enter to search
document.getElementById("city-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});
