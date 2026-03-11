def calculate_fare(distance_km, duration_min, surge):

    base_fare = 35
    cost_per_km = 10
    cost_per_min = 1.5
    booking_fee = 20

    fare = base_fare + (distance_km * cost_per_km) + (duration_min * cost_per_min) + booking_fee

    final_price = fare * surge

    return round(final_price,2)