import requests, time, random, os
from dotenv import load_dotenv

load_dotenv()
BRIDGE_URL = os.getenv('BRIDGE_URL')

def pump_direct():
    devices = ['ZAAKA-001', 'ZAAKA-002', 'ZAAKA-003', 'ZAAKA-004', 'ZAAKA-005']
    print(f"--- Zaaka Genie: Direct Bridge Pump Starting to {BRIDGE_URL} ---")
    
    while True:
        device = random.choice(devices)
        payload = {
            "device": device,
            "prob": round(random.uniform(0.1, 0.95), 2),
            "actual": random.choice([0, 0, 0, 1]),
            "timestamp": time.strftime('%H:%M:%S')
        }
        
        try:
            response = requests.post(
                BRIDGE_URL, 
                json=payload, 
                timeout=0.5,
                proxies={"http": None, "https": None}
            )
            print(f"Sent {device} | Bridge Response: {response.status_code}")
        except Exception as e:
            print(f"Error hitting Bridge: {e}")
            
        time.sleep(0.3)

if __name__ == "__main__":
    pump_direct()