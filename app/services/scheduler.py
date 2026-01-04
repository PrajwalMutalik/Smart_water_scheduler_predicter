def generate_schedule(predicted_mm, plot_area_m2, pump_flow_lpm):
    water_liters = predicted_mm * plot_area_m2
    duration_minutes = water_liters / pump_flow_lpm

    return {
        "water_required_liters": round(water_liters, 2),
        "duration_minutes": round(duration_minutes, 1)
    }
