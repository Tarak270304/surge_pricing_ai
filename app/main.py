from fastapi import FastAPI
from services.routing import get_route
from app.feature_builder import build_features
from app.surge_model import predict_surge
from app.fare_calculator import calculate_fare
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# ================= CORS =================

app.add_middleware(
CORSMiddleware,
allow_origins=["*"],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)

# ================= STATIC =================

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
  return FileResponse("static/index.html")

# ================= ESTIMATE =================

@app.get("/estimate")
def estimate(start_lat: float, start_lon: float, end_lat: float, end_lon: float):

```
try:
    distance, duration = get_route(start_lat, start_lon, end_lat, end_lon)

    features = build_features(start_lat, start_lon)

    surge = predict_surge(features)
    fare = calculate_fare(distance, duration, surge)

    return {
        "distance_km": round(distance, 2),
        "duration_min": round(duration, 2),
        "traffic": features["traffic"],
        "weather": features["weather"],
        "event": features["event"],
        "demand_score": features["demand"],
        "drivers_available": features["supply"],
        "demand_supply_ratio": features["ratio"],
        "surge_multiplier": surge,
        "estimated_fare": fare
    }

except Exception as e:
    print("Estimate error:", e)
    return {
        "distance_km": 0,
        "duration_min": 0,
        "traffic": 1,
        "weather": 0,
        "event": 0,
        "demand_score": 0,
        "drivers_available": 1,
        "demand_supply_ratio": 1,
        "surge_multiplier": 1,
        "estimated_fare": 0
    }
```

# ================= GEOCODE =================

@app.get("/geocode")
def geocode(q: str):

```
url = "https://nominatim.openstreetmap.org/search"

params = {
    "q": q,
    "format": "json",
    "limit": 5,
    "addressdetails": 1,
    "countrycodes": "in",
    "viewbox": "77.2,18.2,79.2,16.7",
    "bounded": 1
}

headers = {
    "User-Agent": "surge-ai-app"
}

try:
    r = requests.get(url, params=params, headers=headers, timeout=5)

    if r.status_code != 200:
        return []

    text = r.text.strip()
    if not text:
        return []

    try:
        data = r.json()
    except:
        return []

    if not isinstance(data, list):
        return []

    return data

except Exception as e:
    print("Geocode error:", e)
    return []
```

# ================= REVERSE =================

@app.get("/reverse")
def reverse_geocode(lat: float, lon: float):

```
url = "https://nominatim.openstreetmap.org/reverse"

params = {
    "lat": lat,
    "lon": lon,
    "format": "json"
}

headers = {
    "User-Agent": "surge-ai-app"
}

try:
    r = requests.get(url, params=params, headers=headers, timeout=5)

    if r.status_code != 200:
        return {}

    return r.json()

except Exception as e:
    print("Reverse error:", e)
    return {}
```

# ================= DRIVER ZONES =================

@app.get("/driver/zones")
def get_driver_zones():
 return [
  {"area": "Hitech City", "ratio": 2.1, "surge": 2.0},
  {"area": "Gachibowli", "ratio": 1.8, "surge": 1.7},
  {"area": "Secunderabad", "ratio": 1.6, "surge": 1.5}
  ]
