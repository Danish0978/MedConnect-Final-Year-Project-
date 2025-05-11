# python_scripts/predict_diabetes.py
import joblib
import sys
import json

def predict_diabetes(input_data):
    model = joblib.load('models/optimized_diabetes_model.pkl')
    feature_names = joblib.load('models/feature_names.pkl')
    
    # Prepare features in correct order
    features = [
        float(input_data.get('pregnancies', 0)),
        float(input_data.get('glucose', 0)),
        float(input_data.get('bloodPressure', 0)),
        float(input_data.get('skinThickness', 0)),
        float(input_data.get('insulin', 0)),
        float(input_data.get('bmi', 0)),
        float(input_data.get('diabetesPedigreeFunction', 0)),
        float(input_data.get('age', 0)),
        1 if input_data.get('outcome', False) else 0
    ]
    
    prediction = model.predict_proba([features])[0][1]
    return {
        "prediction": float(prediction),
        "result": 1 if prediction >= 0.5 else 0
    }

if __name__ == '__main__':
    input_data = json.loads(sys.argv[1])
    result = predict_diabetes(input_data)
    print(json.dumps(result))