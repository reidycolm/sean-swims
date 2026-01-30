import json
import urllib.request
import datetime
from datetime import datetime, timedelta

def fetch_and_debug_tides():
    # Fetch data
    url = "https://erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.json?time,Water_Level&stationID=%22Kilrush%22&time%3E=now-6hours&time%3C=now%2B7days"
    print(f"Fetching: {url}")
    
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
        rows = data['table']['rows']
        
        # Parse data
        tide_data = []
        for r in rows:
            tide_data.append({
                'time': r[0],
                'level': r[1]
            })
            
        print(f"Got {len(tide_data)} data points")
        
        # Smoothing (Simple Moving Average - 3 points)
        smoothed_data = []
        for i in range(len(tide_data)):
            val = tide_data[i]['level']
            # Window: i-1, i, i+1
            start = max(0, i-2)
            end = min(len(tide_data), i+3)
            window = [x['level'] for x in tide_data[start:end]]
            avg = sum(window) / len(window)
            smoothed_data.append({
                'time': tide_data[i]['time'],
                'level': avg,
                'orig_level': tide_data[i]['level']
            })
            
        # Use smoothed data for detection
        detect_source = smoothed_data
        
        # Run the detection logic (Corrected to use smoothed data)
        flow_events = []
        for i in range(1, len(detect_source) - 1):
            prev_val = detect_source[i-1]['level']
            curr_val = detect_source[i]['level']
            next_val = detect_source[i+1]['level']
            
            curr_time = detect_source[i]['time']
            orig_level = detect_source[i]['orig_level'] # Use original level for display? Or smooth? usually orig.
            
            if curr_val >= prev_val and curr_val > next_val:
                flow_events.append({'time': curr_time, 'level': orig_level, 'type': 'High'})
            elif curr_val <= prev_val and curr_val < next_val:
                flow_events.append({'time': curr_time, 'level': orig_level, 'type': 'Low'})
                
        print(f"Found {len(flow_events)} raw events after smoothing")
        
        # Run cleanup logic
        clean_events = []
        if flow_events:
            clean_events.append(flow_events[0])
            for i in range(1, len(flow_events)):
                last_event = clean_events[-1]
                current_event = flow_events[i]
                
                # Simple time diff parsing
                # JS: (new Date(current) - new Date(last)) / 36e5
                t1 = datetime.strptime(last_event['time'], "%Y-%m-%dT%H:%M:%SZ")
                t2 = datetime.strptime(current_event['time'], "%Y-%m-%dT%H:%M:%SZ")
                diff_hours = (t2 - t1).total_seconds() / 3600.0
                
                if diff_hours >= 3:
                     # print(f"Valid Gap {diff_hours:.2f}h: Keeping {current_event['type']} at {current_event['time']}")
                     clean_events.append(current_event)
                else:
                    # Collision logic
                    if current_event['type'] == last_event['type']:
                        # print(f"Collision SAME {diff_hours:.2f}h: {last_event['type']} vs {current_event['type']}")
                        if current_event['type'] == 'High' and current_event['level'] > last_event['level']:
                            clean_events.pop()
                            clean_events.append(current_event)
                        elif current_event['type'] == 'Low' and current_event['level'] < last_event['level']:
                            clean_events.pop()
                            clean_events.append(current_event)
                    else:
                        # Different types < 3h -> Skip Check
                        # print(f"Collision DIFF {diff_hours:.2f}h: {last_event['type']} vs {current_event['type']} -> SKIPPING {current_event['time']}")
                        pass
        
        print("\nClean Events (Next 4 days):")
        # Print next 4 days
        seen_days = set()
        for e in clean_events:
            dt = datetime.strptime(e['time'], "%Y-%m-%dT%H:%M:%SZ")
            day_str = dt.strftime("%a %d")
            print(f"{day_str}: {e['type']} {dt.strftime('%H:%M')} ({e['level']}m)")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_and_debug_tides()
