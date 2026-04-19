import requests

def search_location(query):

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": query,
        "format": "json",
        "limit": 5
    }

    headers = {
        "User-Agent": "surge-pricing-app"
    }

    try:
        res = requests.get(url, params=params, headers=headers, timeout=5)

        if res.status_code != 200:
            print("Geocode failed:", res.status_code)
            return []

        text = res.text.strip()

        if not text:
            print("Empty response from Nominatim")
            return []

        try:
            data = res.json()
        except Exception as e:
            print("JSON parse error:", e)
            print("Raw response:", text)
            return []

        if not isinstance(data, list):
            return []

        return data

    except Exception as e:
        print("Geocode error:", e)
        return []
