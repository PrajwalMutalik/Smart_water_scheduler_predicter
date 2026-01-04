def temperature_bucket(temp):
    if temp < 20:
        return "0-20"
    elif temp < 30:
        return "20-30"
    elif temp < 40:
        return "30-40"
    else:
        return "40+"
