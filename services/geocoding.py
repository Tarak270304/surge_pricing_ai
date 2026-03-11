import requests

def search_location(query):

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": query,
        "format":"json",
        "limit":5
    }

    res = requests.get(url,params=params).json()

    return res