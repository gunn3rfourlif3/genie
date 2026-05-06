import json, os, requests, time, joblib
import pandas as pd
from datetime import datetime
from kafka import KafkaConsumer
from dotenv import load_dotenv

load_dotenv()

class GenieSupportEngine:
    def __init__(self):
        self.model_path = os.getenv('MODEL_PATH', './xgb_model.pkl')
        self.bridge_url = os.getenv('BRIDGE_URL', 'http://127.0.0.1:4001/event')
        self.broker = os.getenv('KAFKA_BROKER', 'localhost:9092')
        self.topic = os.getenv('KAFKA_TOPIC', 'predictive-maintenance')
        
        try:
            self.model = joblib.load(self.model_path)
            print(f"[{datetime.now()}] Local Model loaded successfully.")
        except Exception as e:
            print(f"[{datetime.now()}] Model Load Error: {e}")
            self.model = None

        # DEBUG UPDATE: Changed group_id and offset to force-read existing pulses[cite: 3]
        self.consumer = KafkaConsumer(
            self.topic,
            bootstrap_servers=self.broker,
            auto_offset_reset='earliest', 
            group_id='genie_debug_session_unique', 
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )

    def process_message(self, data):
        try:
            features = pd.DataFrame([{
                'metric1': data.get('metric1', 0),
                'metric2': data.get('metric2', 0),
                'metric3': data.get('metric3', 0),
                'metric4': data.get('metric4', 0),
                'metric5': data.get('metric5', 0),
                'metric6': data.get('metric6', 0),
                'metric7': data.get('metric7', 0),
                'metric8': data.get('metric8', 0),
                'metric9': data.get('metric9', 0)
            }])
            
            if self.model:
                pred = self.model.predict(features)[0]
                status = {0: "STABLE", 1: "WARNING", 2: "CRITICAL"}.get(pred, "UNKNOWN")
            else:
                status = "MODEL_OFFLINE"
        except Exception as e:
            status = "ERROR" 

        return {
            "device_id": data.get('device_id', 'Unknown'),
            "health_score": data.get('health_score', 0), 
            "prediction": status,
            "urgency": data.get('urgency', 'NONE'),
            "leading_indicator": data.get('leading_indicator', 'N/A'),
            "mttr": data.get('mttr', '0h'),
            "timestamp": datetime.now().strftime('%H:%M:%S')
        }

    def run(self):
        print(f"[{datetime.now()}] Engine listening for pulses on {self.topic}...")
        for msg in self.consumer:
            print(f"[{datetime.now()}] Pulse received for: {msg.value.get('device_id')}")
            payload = self.process_message(msg.value)
            
            try:
                # Forward to Bridge[cite: 1, 3]
                resp = requests.post(self.bridge_url, json=payload)
                print(f"[{datetime.now()}] Forwarded to Bridge: {resp.status_code}")
            except Exception as e:
                print(f"[{datetime.now()}] Bridge POST failed: {e}")

if __name__ == "__main__":
    GenieSupportEngine().run()