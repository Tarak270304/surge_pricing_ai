import joblib
import numpy as np
import os

# Get current file directory (app/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Correct path to ml/surge_model.pkl
model_path = os.path.join(BASE_DIR, "..", "ml", "surge_model.pkl")
model_path = os.path.abspath(model_path)

print("Loading model from:", model_path)
print("File exists:", os.path.exists(model_path))

# Load model
model = joblib.load(model_path)

def predict_surge(features):

    ratio = features["ratio"]

    if ratio < 1:
        surge = 1.0

    elif ratio < 1.5:
        surge = 1.2

    elif ratio < 2:
        surge = 1.5

    elif ratio < 3:
        surge = 1.9

    else:
        surge = 2.5

    return surge
