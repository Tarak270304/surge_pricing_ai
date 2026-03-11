import joblib
import numpy as np

model = joblib.load("ml/surge_model.pkl")

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