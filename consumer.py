import json, time, math, requests, os
import pandas as pd
import numpy as np
import joblib
from kafka import KafkaConsumer
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

# Load environment-specific configs
load_dotenv()

# Global state for stateful metrics
history = [] 
failure_timestamps = {} 
stats = {"total": 0, "critical": 0}

class GenieSupportEngine:
    def __init__(self):
        # Dynamically load the model and broker from .env
        self.model = joblib.load(os.getenv('MODEL_PATH', 'xgb_model.pkl'))
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.bridge_url = os.getenv('BRIDGE_URL')
        
        self.consumer = KafkaConsumer(
            'predictive-maintenance',
            bootstrap_servers=[os.getenv('KAFKA_BROKER')],
            group_id='genie_v1',
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            api_version=(0, 10, 1)
        )

    def get_metrics(self, record, prob):
        global history, failure_timestamps, stats
        
        stats["total"] += 1
        if prob > 0.5: stats["critical"] += 1
        health = math.floor((1 - prob) * 100)
        reliability = f"{round(((stats['total'] - stats['critical']) / stats['total']) * 100, 2)}%"

        if health < 40: urgency = "URGENT"
        elif health < 75: urgency = "WARNING"
        else: urgency = "NORMAL"

        sensor_cols = [f'metric{i}' for i in range(1, 10)]
        history.append([record.get(c, 0) for c in sensor_cols])
        if len(history) > 100: history.pop(0)
        
        indicator = "Calculating..."
        if len(history) > 10:
            current = np.array([record.get(c, 0) for c in sensor_cols])
            z = np.abs((current - np.mean(history, axis=0)) / (np.std(history, axis=0) + 1e-6))
            indicator = sensor_cols[np.argmax(z)]

        dev_id = record.get('device', 'Unknown')
        mttr = "N/A"
        if prob > 0.5 and dev_id not in failure_timestamps:
            failure_timestamps[dev_id] = time.time()
        elif prob <= 0.5 and dev_id in failure_timestamps:
            mttr = f"{round((time.time() - failure_timestamps.pop(dev_id))/60, 2)}m"

        return {
            "device_id": dev_id,
            "health": f"{health}%",
            "prediction": "CRITICAL" if prob > 0.5 else "STABLE",
            "urgency": urgency,
            "leading_indicator": indicator,
            "mttr": mttr,
            "reliability": reliability,
            "window": "Immediate" if health < 40 else "24h" if health < 75 else "Routine",
            "timestamp": time.strftime('%H:%M:%S')
        }

    def run(self):
        print(f"Genie Engine Running. Bridge: {self.bridge_url}")
        for msg in self.consumer:
            record = msg.value
            # Clean record for XGBoost prediction[cite: 1]
            df = pd.DataFrame([record]).drop(columns=['date', 'device', 'failure'], errors='ignore')
            prob = self.model.predict_proba(df)[0][1]
            payload = self.get_metrics(record, prob)
            # Submit to Bridge
            self.executor.submit(requests.post, self.bridge_url, json=payload)

if __name__ == "__main__":
    GenieSupportEngine().run()