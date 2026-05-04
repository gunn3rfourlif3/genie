import json
import time
import random
from datetime import datetime
from kafka import KafkaProducer

TOPIC_NAME = "predictive-maintenance"
BOOTSTRAP_SERVERS = ['127.0.0.1:9092']

producer = KafkaProducer(
    bootstrap_servers=BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    api_version=(7, 4, 0) 
)

def generate_csv_style_event():
    device_name = f"ZAAKA-{random.randint(10, 99)}"
    payload = {
        "id": device_name,  # Add this! This is what the Bridge/UI wants.
        "device": device_name, 
        "date": datetime.now().strftime("%Y-%m-%d"),
        "failure": 0 
    }


   # 3. Generate metric1 through metric9 as floats
    # We simulate a "pulse" by oscillating these values
    for i in range(1, 10):
        payload[f"metric{i}"] = round(random.uniform(10.0, 50.0), 4)

    return payload

print(f"Feeding CSV-formatted pulses to {TOPIC_NAME}...")

try:
    while True:
        data = generate_csv_style_event()
        producer.send(TOPIC_NAME, value=data)
        print(f"Pulse Sent: {data['device']} | Metrics: {data['metric1']}...")
        time.sleep(3)
except KeyboardInterrupt:
    print("Stopped.")
finally:
    producer.close()
