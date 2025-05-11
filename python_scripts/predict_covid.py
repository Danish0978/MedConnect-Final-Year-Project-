# python_scripts/predict_covid.py
import joblib
import sys
import json

def predict_covid(input_data):
    model_data = joblib.load('models/covid19_model_final.pkl')
    model = model_data['model']
    feature_names = model_data['feature_names']
    threshold = model_data.get('optimal_threshold', 0.5)
    
    # Map input data to model features
    features = []
    for feature in feature_names:
        # Convert feature names to match form data keys
        form_key = feature.lower().replace(' ', '')
        features.append(1 if input_data.get(form_key, False) else 0)
    
    prediction = model.predict_proba([features])[0][1]
    return {
        "prediction": float(prediction),
        "result": 1 if prediction >= threshold else 0
    }

if __name__ == '__main__':
    input_data = json.loads(sys.argv[1])
    result = predict_covid(input_data)
    print(json.dumps(result))