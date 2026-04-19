import requests
import os

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

def get_traffic(lat, lon):

    try:
        if not TOMTOM_API_KEY:
            print("TOMTOM_API_KEY not set")
            return 1   # fallback instead of crash

        url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={lat},{lon}&key={TOMTOM_API_KEY}"

        res = requests.get(url, timeout=3)
        data = res.json()

        current_speed = data["flowSegmentData"]["currentSpeed"]
        free_speed = data["flowSegmentData"]["freeFlowSpeed"]

        ratio = current_speed / free_speed

        if ratio > 0.7:
            return 1
        elif ratio > 0.4:
            return 2
        else:
            return 3

    except Exception as e:
        print("Traffic API error:", e)
        return 1
