import requests
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def get_route(start_lat, start_lon, end_lat, end_lon):

    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=false"

    try:
        r = requests.get(url, timeout=5)
        data = r.json()

        if "routes" in data and len(data["routes"]) > 0:
            distance = data["routes"][0]["distance"] / 1000
            duration = data["routes"][0]["duration"] / 60
            return distance, duration

    except Exception as e:
        print("Routing API failed:", e)

    # fallback distance
    distance = haversine(start_lat, start_lon, end_lat, end_lon)
    duration = distance / 30 * 60  # assume 30 km/h

    return distance, duration