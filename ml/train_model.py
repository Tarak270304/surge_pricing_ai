import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

np.random.seed(42)

data_size = 5000

data = pd.DataFrame({
    "hour": np.random.randint(0,24,data_size),
    "traffic_level": np.random.randint(1,4,data_size),
    "weather": np.random.randint(0,3,data_size),
    "events": np.random.randint(0,2,data_size),
    "demand_index": np.random.uniform(0,1,data_size),
    "supply_index": np.random.uniform(0,1,data_size)
})

data["surge_multiplier"] = (
    1 +
    (data["demand_index"] - data["supply_index"]) * 2 +
    data["traffic_level"] * 0.2 +
    data["weather"] * 0.3 +
    data["events"] * 0.5
)

X = data.drop("surge_multiplier",axis=1)
y = data["surge_multiplier"]

model = RandomForestRegressor()
model.fit(X,y)

joblib.dump(model,"surge_model.pkl")

print("Model trained successfully")