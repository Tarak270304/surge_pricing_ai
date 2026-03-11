from datetime import datetime
import random

from services.traffic_service import get_traffic
from services.weather_service import get_weather
from services.event_service import check_events


def build_features(lat, lon):

    traffic = get_traffic(lat, lon)
    weather = get_weather(lat, lon)
    event = check_events(lat, lon)

    now = datetime.now()
    hour = now.hour

    # -----------------------------
    # DEMAND SCORE CALCULATION
    # -----------------------------
    demand = 5

    if traffic == "High":
        demand += 8
    elif traffic == "Medium":
        demand += 4

    if weather == "Rain":
        demand += 5

    if event == "Yes":
        demand += 7

    if 8 <= hour <= 10 or 17 <= hour <= 20:
        demand += 6

    # -----------------------------
    # DRIVER SUPPLY (SIMULATION)
    # -----------------------------
    supply = random.randint(5, 20)

    # -----------------------------
    # DEMAND SUPPLY RATIO
    # -----------------------------
    ratio = round(demand / supply, 2)

    return {
        "hour": hour,
        "traffic": traffic,
        "weather": weather,
        "event": event,
        "demand": demand,
        "supply": supply,
        "ratio": ratio
    }