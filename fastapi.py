# -*- coding: utf-8 -*-
"""FastAPI.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/18nV2lpE2vw3k1ncwoB9iNtyPXTXSU7zJ
"""

# Install required packages
!pip install fastapi uvicorn python-multipart scikit-learn pandas joblib pyngrok nest-asyncio

# Import libraries
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel,Field
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
import nest_asyncio
from fastapi.responses import JSONResponse
import uvicorn

# Required for Colab
nest_asyncio.apply()

# Authenticate ngrok (replaced with actual token)
ngrok.set_auth_token("2ojpOBxNdR1i6mWbzJT4JTxbNNp_5uL38d3RLJi6U6qjtj18X")  # Get from https://dashboard.ngrok.com/

# Create the FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models from Google Drive
try:
    covid_model = joblib.load('/content/drive/MyDrive/covid19_model_final.pkl')
    print("COVID model features:", covid_model['model'].feature_names_in_)
    diabetes_model = joblib.load('/content/drive/MyDrive/optimized_diabetes_model.pkl')
    print("Diabetes model features:", diabetes_model.feature_names_in_)
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    raise

# Request models
# Replace your DiabetesFeatures class with:
class DiabetesFeatures(BaseModel):
    Pregnancies: float
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: float
    Outcome: bool = False

# Replace your CovidFeatures class with:
class CovidFeatures(BaseModel):
    Breathing_Problem: bool = Field(..., alias="Breathing Problem")
    Fever: bool
    Dry_Cough: bool = Field(..., alias="Dry Cough")
    Sore_throat: bool = Field(..., alias="Sore throat")
    Running_Nose: bool = Field(..., alias="Running Nose")
    Asthma: bool
    Chronic_Lung_Disease: bool = Field(..., alias="Chronic Lung Disease")
    Headache: bool
    Heart_Disease: bool = Field(..., alias="Heart Disease")
    Diabetes: bool
    Hyper_Tension: bool = Field(..., alias="Hyper Tension")
    Fatigue: bool
    Gastrointestinal: bool
    Abroad_travel: bool = Field(..., alias="Abroad travel")
    Contact_with_COVID_Patient: bool = Field(..., alias="Contact with COVID Patient")
    Attended_Large_Gathering: bool = Field(..., alias="Attended Large Gathering")
    Visited_Public_Exposed_Places: bool = Field(..., alias="Visited Public Exposed Places")
    Family_working_in_Public_Exposed_Places: bool = Field(..., alias="Family working in Public Exposed Places")
    Wearing_Masks: bool = Field(..., alias="Wearing Masks")
    Sanitization_from_Market: bool = Field(..., alias="Sanitization from Market")

    class Config:
        allow_population_by_field_name = True


# Prediction endpoints with improved error handling
@app.post("/predict/diabetes")
async def predict_diabetes(features: DiabetesFeatures):
    try:
        # Convert to dict and remove any unwanted fields
        features_dict = features.dict()

        # Get only the features the model expects
        expected_features = diabetes_model.feature_names_in_
        input_dict = {k: features_dict[k] for k in expected_features}

        input_data = pd.DataFrame([input_dict])
        probability = diabetes_model.predict_proba(input_data)[0][1]
        return {
            "probability": float(probability),
            "prediction": int(probability >= 0.5),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/predict/covid")
async def predict_covid(features: CovidFeatures):
    try:
        # Create input dictionary with EXACT feature names
        input_dict = {
            'Breathing Problem': int(features.Breathing_Problem),
            'Fever': int(features.Fever),
            'Dry Cough': int(features.Dry_Cough),
            'Sore throat': int(features.Sore_throat),
            'Running Nose': int(features.Running_Nose),
            'Asthma': int(features.Asthma),
            'Chronic Lung Disease': int(features.Chronic_Lung_Disease),
            'Headache': int(features.Headache),
            'Heart Disease': int(features.Heart_Disease),
            'Diabetes': int(features.Diabetes),
            'Hyper Tension': int(features.Hyper_Tension),
            'Fatigue': int(features.Fatigue),
            'Gastrointestinal': int(features.Gastrointestinal),
            'Abroad travel': int(features.Abroad_travel),
            'Contact with COVID Patient': int(features.Contact_with_COVID_Patient),
            'Attended Large Gathering': int(features.Attended_Large_Gathering),
            'Visited Public Exposed Places': int(features.Visited_Public_Exposed_Places),
            'Family working in Public Exposed Places': int(features.Family_working_in_Public_Exposed_Places),
            'Wearing Masks': int(features.Wearing_Masks),
            'Sanitization from Market': int(features.Sanitization_from_Market)
        }

        input_data = pd.DataFrame([input_dict])
        probability = covid_model['model'].predict_proba(input_data)[0][1]

        return JSONResponse({
            "probability": float(probability),
            "prediction": int(probability >= covid_model['optimal_threshold']),
            "status": "success"
        })
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Prediction failed: {str(e)}"
        )

# Health check endpoint
@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "ML API is running"}

# Start ngrok tunnel and server
try:
    # Start ngrok tunnel (HTTPS)
    ngrok_tunnel = ngrok.connect(8000, bind_tls=True)
    public_url = ngrok_tunnel.public_url
    print(f"🚀 Public URL: {public_url}")
    print(f"🔌 Local URL: http://localhost:8000")

    # Start FastAPI server
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()
except Exception as e:
    print(f"❌ Failed to start server: {e}")
finally:
    # Clean up ngrok connection when stopped
    if 'ngrok_tunnel' in locals():
        ngrok.disconnect(ngrok_tunnel.public_url)