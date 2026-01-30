import requests
import json
from datetime import datetime, timedelta

def fetch_and_debug_tides():
    url = "https://erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.json?time,Water_Level&stationID=%22Kilrush%22&time%3E=now-6hours&time%3C=now%2B2days"
    print(f"Fetching: {url}")
    
    try:
        res = requests.get(url)
        data = res.json()
        rows = data['table']['rows']
        
        # Parse data
        tide_data = []
        for r in rows:
            tide_data.append({
                'time': r[0],
                'level': r[1]
            })
            
        print(f"Got {len(tide_data)} data points for next 2 days")
        
        # Run the detection logic
        flow_events = []
        for i in range(1, len(tide_data) - 1):
            prev_val = tide_data[i-1]['level']
            curr_val = tide_data[i]['level']
            next_val = tide_data[i+1]['level']
            
            curr_time = tide_data[i]['time']
            
            if curr_val >= prev_val and curr_val > next_val:
                flow_events.append({'time': curr_time, 'level': curr_val, 'type': 'High'})
            elif curr_val <= prev_val and curr_val < next_val:
                flow_events.append({'time': curr_time, 'level': curr_val, 'type': 'Low'})
                
        print(f"Found {len(flow_events)} raw events")
        
        # Run cleanup logic
        clean_events = []
        if flow_events:
            clean_events.append(flow_events[0])
            for i in range(1, len(flow_events)):
                last_event = clean_events[-1]
                current_event = flow_events[i]
                
                # Simple time diff parsing
                t1 = datetime.strptime(last_event['time'], "%Y-%m-%dT%H:%M:%SZ")
                t2 = datetime.strptime(current_event['time'], "%Y-%m-%dT%H:%M:%SZ")
                diff_hours = (t2 - t1).total_seconds() / 3600.0
                
                if diff_hours >= 3:
                     clean_events.append(current_event)
                else:
                    # Collision logic
                    if current_event['type'] == last_event['type']:
                        if current_event['type'] == 'High' and current_event['level'] > last_event['level']:
                            clean_events.pop()
                            clean_events.append(current_event)
                        elif current_event['type'] == 'Low' and current_event['level'] < last_event['level']:
                            clean_events.pop()
                            clean_events.append(current_event)
        
        print("\nClean Events:")
        for e in clean_events[:20]:
            print(f"{e['time']} - {e['type']} ({e['level']}m)")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_and_debug_tides()
