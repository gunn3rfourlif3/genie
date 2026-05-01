import requests
import time
import random

BRIDGE_URL = 'http://127.0.0.1:4001/event'

def pump_direct():
    devices = ['ZAAKA-001', 'ZAAKA-002', 'ZAAKA-003', 'ZAAKA-004', 'ZAAKA-005']
    print("--- Zaaka Genie: Direct Bridge Pump Starting ---")
    
    while True:
        device = random.choice(devices)
        # Mocking the payload the Dashboard expects
        payload = {
            "device": device,
            "prob": round(random.uniform(0.1, 0.95), 2),
            "actual": random.choice([0, 0, 0, 1]),
            "timestamp": time.strftime('%H:%M:%S')
        }
        
        try:
            # Bypass proxies to ensure it hits the local node process
            response = requests.post(
                BRIDGE_URL, 
                json=payload, 
                timeout=0.5,
                proxies={"http": None, "https": None}
            )
            print(f"Sent {device} | Bridge Response: {response.status_code}")
        except Exception as e:
            print(f"Error hitting Bridge: {e}")
            
        time.sleep(0.3) # Fast updates to see UI performance

if __name__ == "__main__":
    pump_direct()