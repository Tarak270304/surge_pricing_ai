import requests

def search_location(query):

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": query,
        "format": "json",
        "limit": 5
    }

    headers = {
        "User-Agent": "surge-pricing-app"   # 🔥 VERY IMPORTANT
    }

    try:
        res = requests.get(url, params=params, headers=headers, timeout=5)

        # Check if request failed
        if res.status_code != 200:
            print("Geocode API failed:", res.status_code)
            return []

        # Safe JSON parsing
        try:
            data = res.json()
        except Exception as e:
            print("JSON parse error:", e)
            return []

        # Ensure it's list
        if not isinstance(data, list):
            return []

        return data

    except Exception as e:
        print("Geocode error:", e)
        return []
