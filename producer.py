import pandas as pd
import json, time, os
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from dotenv import load_dotenv

load_dotenv()

BOOTSTRAP_SERVERS = [os.getenv('KAFKA_BROKER')]
TOPIC_NAME = 'predictive-maintenance'
CSV_FILE = os.getenv('CSV_FILE')

def json_serializer(data):
    return json.dumps(data).encode('utf-8')

def run_producer():
    print(f"--- Project Genie: Streaming from {CSV_FILE} ---")
    
    try:
        producer = KafkaProducer(
            bootstrap_servers=BOOTSTRAP_SERVERS,
            value_serializer=json_serializer,
            api_version=(0, 10, 1),
            request_timeout_ms=10000,
            retries=5
        )
        print("Connected to Kafka.")
    except Exception as e:
        print(f"Connection Failed: {e}")
        return

    try:
        df = pd.read_csv(CSV_FILE)
        records = df.to_dict(orient='records')
        for i, record in enumerate(records):
            producer.send(TOPIC_NAME, value=record)
            if i % 10 == 0:
                print(f"Sent {i} records...")
                producer.flush()
            time.sleep(0.1)
    except Exception as e:
        print(f"Stream Error: {e}")
    finally:
        producer.close()

if __name__ == "__main__":
    run_producer()