import pandas as pd
import xgboost as xgb
import joblib, os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from dotenv import load_dotenv

load_dotenv()
CSV_FILE = os.getenv('CSV_FILE', 'predictive_maintenance_dataset.csv')
MODEL_PATH = os.getenv('MODEL_PATH', 'xgb_model.pkl')

print(f"Loading {CSV_FILE} for training...")
df = pd.read_csv(CSV_FILE)

features = [f'metric{i}' for i in range(1, 10)]
X = df[features]
y = df['failure']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X_train, y_train)
joblib.dump(model, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")