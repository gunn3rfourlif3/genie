import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. Load the dataset
print("Loading dataset for training...")
df = pd.read_csv('predictive_maintenance_dataset.csv') # Replace with your actual filename

# 2. Feature Selection
# We use the metrics to predict the 'failure' column
features = ['metric1', 'metric2', 'metric3', 'metric4', 'metric5', 'metric6', 'metric7', 'metric8', 'metric9']
X = df[features]
y = df['failure']

# 3. Split data (80% to learn, 20% to test its knowledge)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Initialize and Train XGBoost
print("Training the XGBoost model... this may take a moment.")
model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X_train, y_train)

# 5. Verify Accuracy
predictions = model.predict(X_test)
print(f"Training Complete! Model Accuracy: {accuracy_score(y_test, predictions):.2%}")
print("\nClassification Report:")
print(classification_report(y_test, predictions))

# 6. Save the 'Brain'
joblib.dump(model, 'xgb_model.pkl')
print("Model saved as 'xgb_model.pkl'. You can now run the consumer!")