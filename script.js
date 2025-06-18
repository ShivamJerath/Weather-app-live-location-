const apiKey ="a214f1b2dfdad1a35049679719c0204c";
const currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";
let unit = "metric"; // Default unit
let lastCity = null; // Track last searched city

async function getWeather(city) {
    const errorMessage = document.getElementById("error-message");
    const loading = document.getElementById("loading");

    console.log(`getWeather called with city: "${city}"`);
    if (!city || typeof city !== "string" || city.trim() === "") {
        errorMessage.textContent = "Please enter a valid city name";
        console.log("Invalid city input");
        return;
    }

    loading.style.display = "block";
    errorMessage.textContent = "";

    try {
        const currentResponse = await fetch(`${currentWeatherUrl}?q=${encodeURIComponent(city.trim())}&appid=${apiKey}&units=${unit}`);
        if (!currentResponse.ok) {
            throw new Error("City not found or API error");
        }
        const currentData = await currentResponse.json();
        console.log("Current Weather Data:", currentData);

        const forecastResponse = await fetch(`${forecastUrl}?q=${encodeURIComponent(city.trim())}&appid=${apiKey}&units=${unit}`);
        if (!forecastResponse.ok) {
            throw new Error("Forecast data unavailable");
        }
        const forecastData = await forecastResponse.json();
        console.log("Forecast Data:", forecastData);

        lastCity = city.trim();
        updateRecentSearches(city.trim());
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
    console.log("Location button clicked");
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
                const currentData = await currentResponse.json();
                console.log("Current Weather (Location):", currentData);

                const forecastResponse = await fetch(`${forecastUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`);
                if (!forecastResponse.ok) throw new Error("Forecast data unavailable");
                const forecastData = await forecastResponse.json();
                console.log("Forecast (Location):", forecastData);

                lastCity = currentData.name;
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
    console.log("Updating UI");
    const cityName = document.getElementById("city-name");
    const currentTemp = document.getElementById("current-temp");
    const currentDesc = document.getElementById("current-desc");
    const currentHumidity = document.getElementById("current-humidity");
    const currentWind = document.getElementById("current-wind");
    const currentPressure = document.getElementById("current-pressure");
    const currentSunrise = document.getElementById("current-sunrise");
    const currentSunset = document.getElementById("current-sunset");
    const currentIcon = document.getElementById("current-icon");

    if (!cityName || !currentTemp || !currentDesc || !currentHumidity || !currentWind || !currentPressure || !currentSunrise || !currentSunset || !currentIcon) {
        console.error("One or more DOM elements not found");
        document.getElementById("error-message").textContent = "UI error: Elements not found";
        return;
    }

    cityName.textContent = currentData.name;
    const temp = Math.round(currentData.main.temp);
    currentTemp.textContent = `${temp}${unit === "metric" ? "°C" : "°F"}`;
    currentDesc.textContent = currentData.weather[0].description;
    currentHumidity.textContent = `${currentData.main.humidity}%`;
    currentWind.textContent = `${currentData.wind.speed} ${unit === "metric" ? "km/h" : "mph"}`;
    currentPressure.textContent = `${currentData.main.pressure} hPa`;
    currentSunrise.textContent = new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentSunset.textContent = new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentIcon.src = `http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
    currentIcon.style.display = "block";

    const tempCelsius = unit === "metric" ? currentData.main.temp : (currentData.main.temp - 32) * 5/9;
    console.log(`Temperature (Celsius): ${tempCelsius}, Unit: ${unit}`);
    const className = tempCelsius <= 15 ? "cool" : "warm";
    console.log(`Applied class: ${className}`);

    const elements = {
        container: document.querySelector(".container"),
        weatherCard: document.querySelector(".weather-card"),
        hourlyForecast: document.querySelector(".hourly-forecast"),
        dailyForecast: document.querySelector(".daily-forecast"),
        recentSearches: document.querySelector(".recent-searches"),
        hourlyItems: document.querySelectorAll(".hourly-item"),
        dailyItems: document.querySelectorAll(".daily-item")
    };

    for (const [key, element] of Object.entries(elements)) {
        if (element instanceof NodeList) {
            element.forEach(item => {
                if (item) {
                    item.classList.remove("cool", "warm");
                    item.classList.add(className);
                } else {
                    console.warn(`Element in ${key} is null`);
                }
            });
        } else if (element) {
            element.classList.remove("cool", "warm");
            element.classList.add(className);
        } else {
            console.warn(`Element ${key} not found`);
        }
    }

    const hourlyList = document.getElementById("hourly-list");
    if (hourlyList) {
        hourlyList.innerHTML = "";
        forecastData.list.slice(0, 8).forEach(item => {
            const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const temp = Math.round(item.main.temp);
            hourlyList.innerHTML += `
                <div class="hourly-item ${className}">
                    <p>${time}</p>
                    <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                    <p>${temp}${unit === "metric" ? "°C" : "°F"}</p>
                    <p>${item.weather[0].description}</p>
                </div>
            `;
        });
    } else {
        console.warn("hourly-list not found");
    }

    const dailyList = document.getElementById("daily-list");
    if (dailyList) {
        dailyList.innerHTML = "";
        const dailyData = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        dailyData.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            const temp = Math.round(item.main.temp);
            dailyList.innerHTML += `
                <div class="daily-item ${className}">
                    <p>${date}</p>
                    <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                    <p>Temp: ${temp}${unit === "metric" ? "°C" : "°F"}</p>
                    <p>${item.weather[0].description}</p>
                </div>
            `;
        });
    } else {
        console.warn("daily-list not found");
    }

    showTab("current");
}

function toggleUnit() {
    console.log("Toggle button clicked");
    unit = unit === "metric" ? "imperial" : "metric";
    document.getElementById("unit-toggle").textContent = unit === "metric" ? "To °F" : "To °C";
    console.log("Unit toggled to:", unit);
    if (lastCity) {
        getWeather(lastCity);
    }
}

function updateRecentSearches(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    searches = searches.filter(item => item !== city);
    searches.unshift(city);
    if (searches.length > 5) searches.pop();
    localStorage.setItem("recentSearches", JSON.stringify(searches));
    displayRecentSearches();
}

function displayRecentSearches() {
    const searchList = document.getElementById("recent-search-list");
    if (!searchList) {
        console.warn("recent-search-list not found");
        return;
    }
    const searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    searchList.innerHTML = "";
    searches.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        li.addEventListener("click", async () => {
            console.log(`Recent search clicked: ${city}`);
            li.classList.add("loading");
            document.getElementById("city-input").value = city;
            await getWeather(city);
            li.classList.remove("loading");
        });
        searchList.appendChild(li);
    });
}

function showTab(tabId) {
    console.log(`Tab clicked: ${tabId}`);
    const sections = document.querySelectorAll(".weather-section");
    const tabs = document.querySelectorAll(".tab");
    if (!sections.length || !tabs.length) {
        console.warn("Weather sections or tabs not found");
        return;
    }
    sections.forEach(section => section.classList.remove("active"));
    tabs.forEach(tab => tab.classList.remove("active"));
    const section = document.getElementById(tabId);
    const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (section && tab) {
        section.classList.add("active");
        tab.classList.add("active");
    } else {
        console.warn(`Section or tab for ${tabId} not found`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");
    localStorage.removeItem("recentSearches");
    displayRecentSearches();

    const searchBtn = document.getElementById("search-btn");
    const locationBtn = document.getElementById("location-btn");
    const unitToggle = document.getElementById("unit-toggle");
    const cityInput = document.getElementById("city-input");

    if (!searchBtn || !locationBtn || !unitToggle || !cityInput) {
        console.error("One or more button/input elements not found");
        document.getElementById("error-message").textContent = "UI error: Buttons not found";
        return;
    }

    searchBtn.addEventListener("click", () => {
        const city = cityInput.value.trim();
        console.log(`Search button clicked with city: "${city}"`);
        getWeather(city);
    });

    locationBtn.addEventListener("click", () => {
        getWeatherByLocation();
    });

    unitToggle.addEventListener("click", () => {
        toggleUnit();
    });

    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const tabId = tab.getAttribute("data-tab");
            showTab(tabId);
        });
    });

    cityInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const city = cityInput.value.trim();
            console.log(`Enter key pressed with city: "${city}"`);
            getWeather(city);
        }
    });
});
