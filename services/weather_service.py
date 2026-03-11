import requests
from config import OPENWEATHER_API_KEY

def get_weather(lat, lon):

    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"

        res = requests.get(url, timeout=3)
        data = res.json()

        weather = data["weather"][0]["main"]

        if weather == "Clear":
            return 0
        elif weather in ["Rain","Drizzle"]:
            return 1
        else:
            return 2

    except Exception as e:
        print("Weather API error:", e)
        return 0