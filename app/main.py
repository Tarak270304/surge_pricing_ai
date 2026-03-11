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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return FileResponse("static/index.html")

@app.get("/estimate")
def estimate(start_lat: float, start_lon: float, end_lat: float, end_lon: float):

    try:

        distance, duration = get_route(start_lat, start_lon, end_lat, end_lon)

        features = build_features(start_lat, start_lon)

        traffic = features["traffic"]
        weather = features["weather"]
        event = features["event"]

        surge = predict_surge(features)

        fare = calculate_fare(distance, duration, surge)

        return {
            "distance_km": round(distance, 2),
            "duration_min": round(duration, 2),

            "traffic": traffic,
            "weather": weather,
            "event": event,

            "demand_score": features["demand"],
            "drivers_available": features["supply"],
            "demand_supply_ratio": features["ratio"],

            "surge_multiplier": surge,
            "estimated_fare": fare
        }

    except Exception as e:
        return {"error": str(e)}
    

@app.get("/geocode")
def geocode(q: str):

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": q,
        "format": "json",
        "limit": 5,
        "addressdetails": 1
    }

    headers = {
        "User-Agent": "surge-prediction-app"
    }

    try:
        r = requests.get(url, params=params, headers=headers, timeout=5)
        return r.json()
    except Exception as e:
        return {"error": str(e)}


@app.get("/driver/zones")
def get_driver_zones():

    zones = [
        {
            "area": "Hitech City",
            "ratio": 2.1,
            "surge": 2.0
        },
        {
            "area": "Gachibowli",
            "ratio": 1.8,
            "surge": 1.7
        },
        {
            "area": "Secunderabad",
            "ratio": 1.6,
            "surge": 1.5
        }
    ]

    return zones