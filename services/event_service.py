import requests
import os

TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY")

def check_events(lat, lon):

    try:
        url = f"https://app.ticketmaster.com/discovery/v2/events.json?apikey={TICKETMASTER_API_KEY}&latlong={lat},{lon}&radius=5"

        res = requests.get(url, timeout=3)
        data = res.json()

        if "_embedded" in data:
            return 1
        else:
            return 0

    except Exception as e:
        print("Event API error:", e)
        return 0
