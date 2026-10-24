async function getData(latitude, longitude) {
    const url =
        `https://weather-game-api.loongsemail.workers.dev/getWeather` +
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

    return new Promise(async (resolve, reject) => {

        var data = []
        const result = await getData(4.608838160732616,
            114.33079117686476
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

        // navigator.geolocation.getCurrentPosition(async (position) => {



        // });
    });

}


