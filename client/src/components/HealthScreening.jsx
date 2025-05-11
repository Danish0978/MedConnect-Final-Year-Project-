import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/healthscreening.css';

const HealthScreening = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctor, appointmentDetails, fromBooking } = location.state || {};
  const token = localStorage.getItem("token");
  
  const [activeForm, setActiveForm] = useState('diabetes');
  const [screeningData, setScreeningData] = useState({
    diabetes: null,
    covid: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionResults, setPredictionResults] = useState({
    diabetes: null,
    covid: null
  });

  // Validate initial state
  useEffect(() => {
    if (!doctor || !appointmentDetails || !fromBooking) {
      console.error('Missing required state:', {
        hasDoctor: !!doctor,
        hasAppointmentDetails: !!appointmentDetails,
        fromBooking
      });
      navigate('/doctors', { replace: true });
    }
  }, [doctor, appointmentDetails, fromBooking, navigate]);

  const handleFormComplete = async (formName, data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `/predict/${formName}`,
        {
          ...data,
          appointmentId: appointmentDetails._id,
          doctorId: doctor._id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        console.log("Full API response:", response);
        setPredictionResults(prev => ({
          ...prev,
          [formName]: {
            probability: response.data.prediction, // The decimal probability (0.119...)
            prediction: response.data.binaryPrediction, // 0 or 1
            result: response.data.binaryPrediction ? "High Risk" : "Low Risk" // Text description
          }
        }));
    
        // Show result to user
        if(formName === 'diabetes'){
        alert(`Diabetes Prediction: ${response.data.binaryPrediction ? "High Risk" : "Low Risk"} (${(response.data.prediction * 100).toFixed(1)}% probability)`);
        }else{
          alert(`COVID-19 Prediction: ${response.data.binaryPrediction ? "High Risk" : "Low Risk"} (${(response.data.prediction * 100).toFixed(1)}% probability)`);
        }
        setScreeningData(prev => ({
          ...prev,
          [formName]: data
        }));

        
        if (formName === 'diabetes') {
          setActiveForm('covid');
        } else {
          proceedToPayment();
        }
      } else {
        throw new Error(response.data.message || 'Prediction failed');
      }
    } catch (err) {
      console.error(`${formName} prediction error:`, err);
      setError({
        message: err.response?.data?.error || err.message,
        details: err.response?.data?.details || 'Please try again later'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = (currentForm) => {
    if (currentForm === 'diabetes') {
      setActiveForm('covid');
    } else {
      proceedToPayment();
    }
  };

  const handleSkipAll = () => {
    proceedToPayment();
  };

  const proceedToPayment = () => {
    navigate('/payment', {
      state: {
        doctor,
        appointmentDetails,
        screeningData,
        predictionResults
      }
    });
  };

  const DiabetesForm = () => {
    const [formData, setFormData] = useState({
      pregnancies: '',
      glucose: '',
      bloodPressure: '',
      skinThickness: '',
      insulin: '',
      bmi: '',
      diabetesPedigreeFunction: '',
      age: '',
      outcome: false
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateField = (name, value) => {
      const errors = {};
      
      if (name === 'pregnancies' && (value === '' || value < 0 || value > 20)) {
        errors.pregnancies = 'Must be between 0 and 20';
      }
      
      if (name === 'glucose' && (value === '' || value < 0 || value > 500)) {
        errors.glucose = 'Must be between 0 and 500 mg/dL';
      }
      
      if (name === 'bloodPressure' && (value === '' || value < 0 || value > 200)) {
        errors.bloodPressure = 'Must be between 0 and 200 mm Hg';
      }
      
      if (name === 'skinThickness' && (value === '' || value < 0 || value > 100)) {
        errors.skinThickness = 'Must be between 0 and 100 mm';
      }
      
      if (name === 'insulin' && (value === '' || value < 0 || value > 1000)) {
        errors.insulin = 'Must be between 0 and 1000 μU/ml';
      }
      
      if (name === 'bmi' && (value === '' || value < 0 || value > 100)) {
        errors.bmi = 'Must be between 0 and 100 kg/m²';
      }
      
      if (name === 'diabetesPedigreeFunction' && (value === '' || value < 0 || value > 2.5)) {
        errors.diabetesPedigreeFunction = 'Must be between 0 and 2.5';
      }
      
      if (name === 'age' && (value === '' || value < 0 || value > 120)) {
        errors.age = 'Must be between 0 and 120 years';
      }
      
      return errors;
    };

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;
      
      setFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));
      
      if (type !== 'checkbox') {
        setFormErrors(prev => ({
          ...prev,
          ...validateField(name, fieldValue)
        }));
      }
    };

    const validateForm = () => {
      const errors = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value !== 'boolean') {
          Object.assign(errors, validateField(key, value));
        }
      });
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      setIsSubmitted(true);
      
      if (validateForm()) {
        handleFormComplete('diabetes', formData);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="screening-form">
        <h3>Diabetes Risk Assessment</h3>
        <p className="form-subtitle">(Optional - You may skip this assessment)</p>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error.message}
            {error.details && <p>{error.details}</p>}
          </div>
        )}
        
        <div className="form-row">
          <div className="form-group">
            <label>Pregnancies</label>
            <input
              type="number"
              name="pregnancies"
              value={formData.pregnancies}
              onChange={handleChange}
              min="0"
              max="20"
              placeholder="0-20"
              className={formErrors.pregnancies ? 'error' : ''}
            />
            {formErrors.pregnancies && (
              <span className="error-text">{formErrors.pregnancies}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Glucose (mg/dL)</label>
            <input
              type="number"
              name="glucose"
              value={formData.glucose}
              onChange={handleChange}
              min="0"
              max="500"
              placeholder="0-500"
              className={formErrors.glucose ? 'error' : ''}
            />
            {formErrors.glucose && (
              <span className="error-text">{formErrors.glucose}</span>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Blood Pressure (mm Hg)</label>
            <input
              type="number"
              name="bloodPressure"
              value={formData.bloodPressure}
              onChange={handleChange}
              min="0"
              max="200"
              placeholder="0-200"
              className={formErrors.bloodPressure ? 'error' : ''}
            />
            {formErrors.bloodPressure && (
              <span className="error-text">{formErrors.bloodPressure}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Skin Thickness (mm)</label>
            <input
              type="number"
              name="skinThickness"
              value={formData.skinThickness}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="0-100"
              className={formErrors.skinThickness ? 'error' : ''}
            />
            {formErrors.skinThickness && (
              <span className="error-text">{formErrors.skinThickness}</span>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Insulin (μU/ml)</label>
            <input
              type="number"
              name="insulin"
              value={formData.insulin}
              onChange={handleChange}
              min="0"
              max="1000"
              placeholder="0-1000"
              className={formErrors.insulin ? 'error' : ''}
            />
            {formErrors.insulin && (
              <span className="error-text">{formErrors.insulin}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>BMI (kg/m²)</label>
            <input
              type="number"
              name="bmi"
              value={formData.bmi}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="100"
              placeholder="0-100"
              className={formErrors.bmi ? 'error' : ''}
            />
            {formErrors.bmi && (
              <span className="error-text">{formErrors.bmi}</span>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Diabetes Pedigree</label>
            <input
              type="number"
              name="diabetesPedigreeFunction"
              value={formData.diabetesPedigreeFunction}
              onChange={handleChange}
              step="0.001"
              min="0"
              max="2.5"
              placeholder="0-2.5"
              className={formErrors.diabetesPedigreeFunction ? 'error' : ''}
            />
            {formErrors.diabetesPedigreeFunction && (
              <span className="error-text">{formErrors.diabetesPedigreeFunction}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              max="120"
              placeholder="0-120"
              className={formErrors.age ? 'error' : ''}
            />
            {formErrors.age && (
              <span className="error-text">{formErrors.age}</span>
            )}
          </div>
        </div>
        
        <div className="form-navigation">
          <button 
            type="button" 
            className="skip-btn" 
            onClick={() => handleSkip('diabetes')}
            disabled={loading}
          >
            Skip Assessment
          </button>
          <div>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Next: COVID Screening'}
            </button>
          </div>
        </div>
      </form>
    );
  };

  const CovidForm = () => {
    const [formData, setFormData] = useState({
      breathingProblem: false,
      fever: false,
      dryCough: false,
      soreThroat: false,
      runningNose: false,
      asthma: false,
      chronicLungDisease: false,
      headache: false,
      heartDisease: false,
      diabetes: false,
      hyperTension: false,
      fatigue: false,
      gastrointestinal: false,
      abroadTravel: false,
      contactWithCovidPatient: false,
      attendedLargeGathering: false,
      visitedPublicExposedPlaces: false,
      familyWorkingInPublicExposedPlaces: false,
      wearingMasks: false,
      sanitizationFromMarket: false,
      covid19: false
    });

    const handleChange = (e) => {
      const { name, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      handleFormComplete('covid', formData);
    };

    return (
      <form onSubmit={handleSubmit} className="screening-form">
        <h3>COVID-19 Risk Assessment</h3>
        <p className="form-subtitle">(Optional - You may skip this assessment)</p>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error.message}
            {error.details && <p>{error.details}</p>}
          </div>
        )}
        
        <div className="form-columns">
          <div className="form-column">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="breathingProblem"
                  checked={formData.breathingProblem}
                  onChange={handleChange}
                />
                Breathing Problem
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="fever"
                  checked={formData.fever}
                  onChange={handleChange}
                />
                Fever
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="dryCough"
                  checked={formData.dryCough}
                  onChange={handleChange}
                />
                Dry Cough
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="soreThroat"
                  checked={formData.soreThroat}
                  onChange={handleChange}
                />
                Sore Throat
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="runningNose"
                  checked={formData.runningNose}
                  onChange={handleChange}
                />
                Running Nose
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="asthma"
                  checked={formData.asthma}
                  onChange={handleChange}
                />
                Asthma
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="chronicLungDisease"
                  checked={formData.chronicLungDisease}
                  onChange={handleChange}
                />
                Chronic Lung Disease
              </label>
            </div>
          </div>
          
          <div className="form-column">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="headache"
                  checked={formData.headache}
                  onChange={handleChange}
                />
                Headache
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="heartDisease"
                  checked={formData.heartDisease}
                  onChange={handleChange}
                />
                Heart Disease
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="diabetes"
                  checked={formData.diabetes}
                  onChange={handleChange}
                />
                Diabetes
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="hyperTension"
                  checked={formData.hyperTension}
                  onChange={handleChange}
                />
                Hypertension
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="fatigue"
                  checked={formData.fatigue}
                  onChange={handleChange}
                />
                Fatigue
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="gastrointestinal"
                  checked={formData.gastrointestinal}
                  onChange={handleChange}
                />
                Gastrointestinal Issues
              </label>
            </div>
          </div>
          
          <div className="form-column">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="abroadTravel"
                  checked={formData.abroadTravel}
                  onChange={handleChange}
                />
                Traveled Abroad Recently
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="contactWithCovidPatient"
                  checked={formData.contactWithCovidPatient}
                  onChange={handleChange}
                />
                Contact with COVID Patient
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="attendedLargeGathering"
                  checked={formData.attendedLargeGathering}
                  onChange={handleChange}
                />
                Attended Large Gathering
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="visitedPublicExposedPlaces"
                  checked={formData.visitedPublicExposedPlaces}
                  onChange={handleChange}
                />
                Visited Public Exposed Places
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="familyWorkingInPublicExposedPlaces"
                  checked={formData.familyWorkingInPublicExposedPlaces}
                  onChange={handleChange}
                />
                Family Works in Public Exposed Places
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="wearingMasks"
                  checked={formData.wearingMasks}
                  onChange={handleChange}
                />
                Regularly Wears Masks
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="sanitizationFromMarket"
                  checked={formData.sanitizationFromMarket}
                  onChange={handleChange}
                />
                Uses Market Sanitization
              </label>
            </div>
          </div>
        </div>

        <div className="form-navigation">
          <button 
            type="button" 
            className="skip-btn" 
            onClick={() => handleSkip('covid')}
            disabled={loading}
          >
            Skip Assessment
          </button>
          <div>
            <button 
              type="button" 
              onClick={() => setActiveForm('diabetes')}
              disabled={loading}
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="screening-container">
      <div className="screening-header">
        <h2>Health Screening</h2>
        <p>Complete these optional health assessments to help your doctor prepare for your appointment</p>
        <button 
          className="skip-all-btn" 
          onClick={handleSkipAll}
          disabled={loading}
        >
          Skip All Assessments
        </button>
      </div>
      
      {activeForm === 'diabetes' && <DiabetesForm />}
      {activeForm === 'covid' && <CovidForm />}
      
      {predictionResults.diabetes && (
        <div className="prediction-result">
          <h4>Diabetes Prediction Result:</h4>
          <p>{predictionResults.diabetes.result}</p>
        </div>
      )}
      
      {predictionResults.covid && (
        <div className="prediction-result">
          <h4>COVID-19 Prediction Result:</h4>
          <p>{predictionResults.covid.result}</p>
        </div>
      )}
    </div>
  );
};

export default HealthScreening;