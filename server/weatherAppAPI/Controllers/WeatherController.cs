using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
public class WeatherController : ControllerBase
{

    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public WeatherController(

        IConfiguration configuration,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }

    [HttpGet("/getWeather")]
    public async Task<IActionResult> GetWeather(
        double latitude,
        double longitude)
    {
        var apiKey = _configuration["WEATHER_API_KEY"];

        var url =
            $"http://api.weatherapi.com/v1/current.json" +
            $"?key={apiKey}" +
            $"&q={latitude},{longitude}" +
            $"&aqi=no";

        try
        {
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(
                    (int)response.StatusCode,
                    "Weather API request failed"
                );
            }

            var data = await response.Content.ReadAsStringAsync();

            return Content(data, "application/json");
        }
        catch (Exception)
        {
            return StatusCode(500, "Failed to contact WeatherAPI");
        }
    }
}