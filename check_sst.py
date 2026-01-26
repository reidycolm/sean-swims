
import requests

points = [
    (52.5718, -9.3703), # Tarbert
    (52.58, -9.5),      # Further West in Estuary
    (52.60, -9.7),      # Mouth
    (52.50, -9.5)       # Ballybunion ish
]

for lat, lon in points:
    url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&current=sea_surface_temperature"
    try:
        r = requests.get(url)
        data = r.json()
        sst = data.get('current', {}).get('sea_surface_temperature')
        print(f"Point {lat}, {lon} -> SST: {sst}")
    except Exception as e:
        print(f"Point {lat}, {lon} -> Error: {e}")
