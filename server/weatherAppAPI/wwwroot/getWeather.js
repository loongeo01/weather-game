async function getData(latitude, longitude) {
    const url =
        `https://weather-game-lo69.onrender.com/getWeather` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();

        console.log(latitude, longitude);

        return result;
    } catch (error) {
        console.error("Error at getWeather.js:", error);
        return -1;
    }
}

export function getCurrentWeatherData() {

    return new Promise((resolve, reject) => {

        var data = []

        navigator.geolocation.getCurrentPosition(async (position) => {

            const result = await getData(
                position.coords.latitude,
                position.coords.longitude
            );

            if (result === -1) {
                reject(new Error("Failed to retrieve weather data"));
                return;
            }

            const temperature = result.current.temp_c;
            data.push(temperature)

            var currentWeather = result.current.condition.text
            data.push(currentWeather)
            resolve(data)

        }, reject);
    });

}


