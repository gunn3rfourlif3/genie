import json, os, requests, time, joblib
import pandas as pd
from datetime import datetime
from kafka import KafkaConsumer
from dotenv import load_dotenv

load_dotenv()

class GenieSupportEngine:
    def __init__(self):
        # Local paths - ensure xgb_model.pkl is in your local folder
        self.model_path = os.getenv('MODEL_PATH', './xgb_model.pkl')
        self.bridge_url = os.getenv('BRIDGE_URL', 'http://127.0.0.1:4001/event')
        self.broker = os.getenv('KAFKA_BROKER', 'localhost:9092')
        self.topic = os.getenv('KAFKA_TOPIC', 'predictive-maintenance')
        
        try:
            self.model = joblib.load(self.model_path)
            print(f"[{datetime.now()}] Local Model loaded.")
        except Exception as e:
            print(f"[{datetime.now()}] Error: {e}")
            self.model = None

        self.consumer = KafkaConsumer(
            self.topic,
            bootstrap_servers=self.broker,
            auto_offset_reset='latest',
            group_id='genie_local_dev_v1', 
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )

    def process_message(self, data):
        try:
            # Map metrics to satisfy the XGBoost schema
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
            print(f"Prediction Mismatch: {e}")
            status = "ERROR" 

        # Build the full payload for the dashboard
        return {
            "device_id": data.get('device_id', 'Unknown'),
            "health": data.get('health_score', 0), 
            "prediction": status,
            # Pull the new keys from data to populate the Support Queue columns
            "urgency": data.get('urgency', 'NONE'),
            "leading_indicator": data.get('leading_indicator', 'N/A'),
            "mttr": data.get('mttr', '0h'),
            "timestamp": datetime.now().strftime('%H:%M:%S')
        }

    def run(self):
        for msg in self.consumer:
            payload = self.process_message(msg.value)
            requests.post(self.bridge_url, json=payload)

if __name__ == "__main__":
    GenieSupportEngine().run()