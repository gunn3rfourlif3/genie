
### **Health Checks**

| To Check... | Run This Command |
| :--- | :--- |
| **Port 4001 (Bridge)** | `netstat -tuln | grep :4001` |
| **Consumer Process** | `ps aux | grep consumer.py` |
| **Watchdog Logs** | `tail -f ~/genie/watchdog.log` |
| **Kafka Status** | `docker ps` (ensure `genie-kafka-1` is Up)[cite: 3, 6] |

Now that your bridge and consumer have a "safety net," would you like to verify the data flow by checking the logs for successful `POST` requests to the bridge?
```