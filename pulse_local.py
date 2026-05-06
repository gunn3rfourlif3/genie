import json
import time
import random
from datetime import datetime
from kafka import KafkaProducer

class GeniePulseGenerator:
    def __init__(self):
        self.topic = 'predictive-maintenance'
        self.broker = '127.0.0.1:9092'
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.broker,
                value_serializer=lambda x: json.dumps(x).encode('utf-8'),
                # Add this line to fix the NoBrokersAvailable crash locally
                api_version=(0, 10, 1) 
            )
            print(f"[{datetime.now()}] Connected to Kafka at {self.broker}")
        except Exception as e:
            print(f"[{datetime.now()}] Kafka Connection Error: {e}")
            self.producer = None
    def generate_pulse(self):
        health = random.randint(30, 95) # Generate health first to determine urgency
        device_id = f"ZAAKA-{random.randint(10, 99)}"
        
        # Logic to fill the previously blank columns in brave_screenshot_localhost_10.png
        urgency = "URGENT" if health < 45 else "POTENTIAL" if health < 65 else "NONE"
        indicators = ["Voltage Spike", "Thermal Drift", "Bearing Wear", "Signal Noise", "OS Latency"]
        
        data = {
            "device_id": device_id,
            "metric1": round(random.uniform(20.0, 100.0), 2),
            "metric2": round(random.uniform(0.1, 5.0), 2),
            "metric3": round(random.uniform(10.0, 50.0), 2),
            "metric4": round(random.uniform(100, 500), 2),
            "metric5": round(random.uniform(0, 100), 2),
            "metric6": round(random.uniform(50, 150), 2),
            "metric7": round(random.uniform(1, 10), 2),
            "metric8": round(random.uniform(0.5, 2.5), 2),
            "metric9": round(random.uniform(10, 30), 2),
            "health_score": health,
            # New keys to populate SupportQueue.js columns
            "urgency": urgency,
            "leading_indicator": random.choice(indicators) if health < 65 else "N/A",
            "mttr": f"{round(random.uniform(0.5, 4.0), 1)}h" if health < 65 else "0h",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        return data

    def run(self, once=False):
        print(f"[{datetime.now()}] Pulser Active. Sending 9-metric pulses...")
        while True:
            if self.producer:
                pulse = self.generate_pulse()
                future = self.producer.send(self.topic, value=pulse)
                # Force the script to wait for Kafka to say "Got it!"
                future.get(timeout=10) 
                print(f"Pulse Sent: {pulse['device_id']} | Health: {pulse['health_score']}")

            if once: 
                self.producer.flush() # Ensure buffer is empty before exiting
                break
            time.sleep(1)
if __name__ == "__main__":
    import sys
    pulser = GeniePulseGenerator()
    pulser.run(once='--once' in sys.argv)