const apiKey ="a214f1b2dfdad1a35049679719c0204c"; 
const currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

async function getWeather() {
    const city = document.getElementById("city-input").value.trim();
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
        const currentResponse = await fetch(`${currentWeatherUrl}?q=${city}&appid=${apiKey}&units=metric`);
        if (!currentResponse.ok) {
            throw new Error("City not found or API error");
        }
        const currentData = await currentResponse.json();
        console.log("Current Weather Data:", currentData);

        // Fetch 5-day forecast (includes hourly data every 3 hours)
        const forecastResponse = await fetch(`${forecastUrl}?q=${city}&appid=${apiKey}&units=metric`);
        if (!forecastResponse.ok) {
            throw new Error("Forecast data unavailable");
        }
        const forecastData = await forecastResponse.json();
        console.log("Forecast Data:", forecastData);

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
                const currentResponse = await fetch(`${currentWeatherUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
                if (!currentResponse.ok) throw new Error("Location data unavailable");
                const currentData = await currentResponse.json();
                console.log("Current Weather (Location):", currentData);

                const forecastResponse = await fetch(`${forecastUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
                if (!forecastResponse.ok) throw new Error("Forecast data unavailable");
                const forecastData = await forecastResponse.json();
                console.log("Forecast (Location):", forecastData);

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
    const temp = Math.round(currentData.main.temp);
    currentTemp.textContent = `${temp}°C`;
    currentDesc.textContent = currentData.weather[0].description;
    currentHumidity.textContent = `${currentData.main.humidity}%`;
    currentWind.textContent = `${currentData.wind.speed} km/h`;
    currentPressure.textContent = `${currentData.main.pressure} hPa`;
    currentSunrise.textContent = new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentSunset.textContent = new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentIcon.src = `http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
    currentIcon.style.display = "block";

    // Update background based on temperature
    document.body.className = "";
    if (temp < -10) {
        document.body.classList.add("very-cold");
    } else if (temp <= 0) {
        document.body.classList.add("cold");
    } else if (temp <= 15) {
        document.body.classList.add("cool");
    } else if (temp <= 25) {
        document.body.classList.add("warm");
    } else {
        document.body.classList.add("hot");
    }

    // Update hourly forecast (next 24 hours, 3-hour intervals)
    const hourlyList = document.getElementById("hourly-list");
    hourlyList.innerHTML = "";
    forecastData.list.slice(0, 8).forEach(item => { // 8 intervals = 24 hours
        const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        hourlyList.innerHTML += `
            <div class="hourly-item">
                <p>${time}</p>
                <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                <p>${Math.round(item.main.temp)}°C</p>
                <p>${item.weather[0].description}</p>
            </div>
        `;
    });

    // Update 5-day forecast
    const dailyList = document.getElementById("daily-list");
    dailyList.innerHTML = "";
    const dailyData = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5); // One per day
    dailyData.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        dailyList.innerHTML += `
            <div class="daily-item">
                <p>${date}</p>
                <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                <p>Temp: ${Math.round(item.main.temp)}°C</p>
                <p>${item.weather[0].description}</p>
            </div>
        `;
    });

    // Show current tab by default
    showTab("current");
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

// Allow pressing Enter to search
document.getElementById("city-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});
