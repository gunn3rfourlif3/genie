import pandas as pd
import json
import time
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

# --- Configuration ---
# Use 127.0.0.1 to avoid IPv6 'localhost' resolution issues on Windows
BOOTSTRAP_SERVERS = ['127.0.0.1:9092']
TOPIC_NAME = 'predictive-maintenance'
CSV_FILE = 'predictive_maintenance_dataset.csv'

def json_serializer(data):
    return json.dumps(data).encode('utf-8')

def run_producer():
    print("--- Project Genie: Starting Data Stream ---")
    
    # 1. Initialize Producer with explicit API versioning
    try:
        producer = KafkaProducer(
            bootstrap_servers=BOOTSTRAP_SERVERS,
            value_serializer=json_serializer,
            # Explicitly setting API version solves the NoBrokersAvailable error 
            # for Confluent 7.x brokers on Python 3.11+
            api_version=(0, 10, 1),
            request_timeout_ms=10000,
            retries=5
        )
        print("Connected to Kafka successfully.")
    except NoBrokersAvailable:
        print(f"Error: Could not connect to Kafka at {BOOTSTRAP_SERVERS}.")
        print("Check if genie-kafka-1 is running (docker ps) and port 9092 is mapped.")
        return
    except Exception as e:
        print(f"An unexpected error occurred during initialization: {e}")
        return

    # 2. Load Dataset
    try:
        df = pd.read_csv(CSV_FILE)
        records = df.to_dict(orient='records')
        print(f"Loaded {len(records)} records from {CSV_FILE}.")
    except PermissionError:
        print(f"Permission Denied: Please close {CSV_FILE} if it is open in Excel.")
        return
    except FileNotFoundError:
        print(f"Error: {CSV_FILE} not found in the current directory.")
        return

    # 3. Streaming Loop
    try:
        for i, record in enumerate(records):
            # Send message
            producer.send(TOPIC_NAME, value=record)
            
            # Print progress every 10 records to keep console clean
            if i % 10 == 0:
                print(f"Sent {i} records...")
                producer.flush() # Force delivery of the batch
            
            time.sleep(0.1) # Faster stream for testing

    except KeyboardInterrupt:
        print("\nStream interrupted by user.")
    finally:
        print("Closing connection...")
        producer.flush()
        producer.close()
        print("Done.")

if __name__ == "__main__":
    run_producer()