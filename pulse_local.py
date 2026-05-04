import json, time, random, os
from datetime import datetime
from kafka import KafkaProducer
from dotenv import load_dotenv

load_dotenv()

TOPIC_NAME = "predictive-maintenance"
BOOTSTRAP_SERVERS = [os.getenv('KAFKA_BROKER')]

producer = KafkaProducer(
    bootstrap_servers=BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    api_version=(0, 10, 1) 
)

def generate_csv_style_event():
    payload = {
        "device": f"ZAAKA-{random.randint(10, 99)}",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "failure": 0 
    }
    for i in range(1, 10):
        payload[f"metric{i}"] = round(random.uniform(10.0, 50.0), 4)
    return payload

print(f"Feeding pulses to {TOPIC_NAME} at {BOOTSTRAP_SERVERS}...")

try:
    while True:
        data = generate_csv_style_event()
        producer.send(TOPIC_NAME, value=data)
        print(f"Pulse Sent: {data['device']}")
        time.sleep(3)
except KeyboardInterrupt:
    print("Stopped.")
finally:
    producer.close()