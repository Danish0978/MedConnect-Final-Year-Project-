// controllers/predictionController.js
const axios = require('axios');
const Report = require('../models/reportModel');
const Doctor = require('../models/doctorModel');
const User = require('../models/userModel');

// Configure your FastAPI endpoint (replace with your ngrok URL)
const FAST_API_URL = 'https://da09-34-123-193-162.ngrok-free.app';  // For local testing

const makePrediction = async (req, res, type) => {
  try {
    console.log("Received data:", req.body);
      const formData = req.body;
      
      if (!formData || Object.keys(formData).length === 0) {
          return res.status(400).json({ 
              success: false,
              message: `No ${type} data provided` 
          });
      }

      // Transform data to match FastAPI expected format and prepare for storage
      let transformedData;
      let featuresToStore = {};
      
      if (type === 'diabetes') {
          transformedData = {
              Pregnancies: parseFloat(formData.pregnancies),
              Glucose: parseFloat(formData.glucose),
              BloodPressure: parseFloat(formData.bloodPressure),
              SkinThickness: parseFloat(formData.skinThickness),
              Insulin: parseFloat(formData.insulin),
              BMI: parseFloat(formData.bmi),
              DiabetesPedigreeFunction: parseFloat(formData.diabetesPedigreeFunction),
              Age: parseFloat(formData.age),
              Outcome: Boolean(formData.outcome)
          };
          
          featuresToStore.diabetes = {
              pregnancies: parseFloat(formData.pregnancies),
              glucose: parseFloat(formData.glucose),
              bloodPressure: parseFloat(formData.bloodPressure),
              skinThickness: parseFloat(formData.skinThickness),
              insulin: parseFloat(formData.insulin),
              bmi: parseFloat(formData.bmi),
              diabetesPedigreeFunction: parseFloat(formData.diabetesPedigreeFunction),
              age: parseFloat(formData.age)
          };
      } else { // covid
          transformedData = {
              "Breathing Problem": Boolean(formData.breathingProblem),
              "Fever": Boolean(formData.fever),
              "Dry Cough": Boolean(formData.dryCough),
              "Sore throat": Boolean(formData.soreThroat),
              "Running Nose": Boolean(formData.runningNose),
              "Asthma": Boolean(formData.asthma),
              "Chronic Lung Disease": Boolean(formData.chronicLungDisease),
              "Headache": Boolean(formData.headache),
              "Heart Disease": Boolean(formData.heartDisease),
              "Diabetes": Boolean(formData.diabetes),
              "Hyper Tension": Boolean(formData.hyperTension),
              "Fatigue": Boolean(formData.fatigue),
              "Gastrointestinal": Boolean(formData.gastrointestinal),
              "Abroad travel": Boolean(formData.abroadTravel),
              "Contact with COVID Patient": Boolean(formData.contactWithCovidPatient),
              "Attended Large Gathering": Boolean(formData.attendedLargeGathering),
              "Visited Public Exposed Places": Boolean(formData.visitedPublicExposedPlaces),
              "Family working in Public Exposed Places": Boolean(formData.familyWorkingInPublicExposedPlaces),
              "Wearing Masks": Boolean(formData.wearingMasks),
              "Sanitization from Market": Boolean(formData.sanitizationFromMarket)
          };
          
          featuresToStore.covid = {
              breathingProblem: Boolean(formData.breathingProblem),
              fever: Boolean(formData.fever),
              dryCough: Boolean(formData.dryCough),
              soreThroat: Boolean(formData.soreThroat),
              runningNose: Boolean(formData.runningNose),
              asthma: Boolean(formData.asthma),
              chronicLungDisease: Boolean(formData.chronicLungDisease),
              headache: Boolean(formData.headache),
              heartDisease: Boolean(formData.heartDisease),
              diabetes: Boolean(formData.diabetes),
              hyperTension: Boolean(formData.hyperTension),
              fatigue: Boolean(formData.fatigue),
              gastrointestinal: Boolean(formData.gastrointestinal),
              abroadTravel: Boolean(formData.abroadTravel),
              contactWithCovidPatient: Boolean(formData.contactWithCovidPatient),
              attendedLargeGathering: Boolean(formData.attendedLargeGathering),
              visitedPublicExposedPlaces: Boolean(formData.visitedPublicExposedPlaces),
              familyWorkingInPublicExposedPlaces: Boolean(formData.familyWorkingInPublicExposedPlaces),
              wearingMasks: Boolean(formData.wearingMasks),
              sanitizationFromMarket: Boolean(formData.sanitizationFromMarket)
          };
      }

      // Call FastAPI endpoint
      const response = await axios.post(
          `${FAST_API_URL}/predict/${type}`,
          transformedData,
          {
              headers: {
                  'Content-Type': 'application/json'
              }
          }
      );

      const { prediction, probability } = response.data;
      const doctor = await Doctor.findById(req.body.doctorId)
      .select('userId') // Only get the userId field
      .lean();
      // Save to reports
      const report = new Report({
          userId: req.userId,
          appointmentId: req.body.appointmentId,
          doctorId: doctor.userId,
          type,
          features: featuresToStore,
          prediction: probability,
          predictionResult: prediction,
          date: new Date()
      });

      await report.save();
      
      res.json({
          success: true,
          prediction: probability,
          binaryPrediction: prediction,
          message: `${type} prediction completed successfully`,
          features: featuresToStore[type] // Include the features in response if needed
      });

  } catch (err) {
      console.error(`${type} prediction error:`, err.response?.data || err.message);
      
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          `${type} prediction failed`;
      
      res.status(err.response?.status || 500).json({
          success: false,
          error: errorMessage
      });
  }
};

const predictDiabetes = async (req, res) => {
  await makePrediction(req, res, 'diabetes');
};

const predictCovid = async (req, res) => {
  await makePrediction(req, res, 'covid');
};

// Get prediction history for user
const getPredictionHistory = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .sort({ date: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    console.error('Prediction history error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch prediction history'
    });
  }
};

const getMyReports = async (req, res) => {
  try {
    const {isDoctor, userId} = req.user;
    console.log('User:', req.user);
    const matchCondition = isDoctor 
      ? { doctorId: userId } 
      : { userId };

    const reports = await Report.find(matchCondition)
      .populate({
        path: 'userId',
        select: 'firstname lastname email phone',
        model: User  // Explicitly specify the model
      })
      .populate({
        path: 'doctorId',
        select: 'firstname lastname email phone',
        model: User  // Explicitly specify the model
      })
      .sort({ date: -1 })
      .lean();



    // Format response with detailed info
    const formattedReports = reports.map(report => ({
      _id: report._id,
      type: report.type,
      prediction: report.prediction,
      predictionResult: report.predictionResult,
      date: report.date.toISOString().split('T')[0],
      time: report.date.toTimeString().split(' ')[0],
      patient: isDoctor ? {
        id: report.userId._id,
        name: `${report.userId.firstname} ${report.userId.lastname}`,
        contact: {
          email: report.userId.email,
          phone: report.userId.phone
        }
      } : null,
      doctor: !isDoctor ? {
        id: report.doctorId._id,
        name: `${report.doctorId.firstname} ${report.doctorId.lastname}`,
        specialization: report.doctorId.specialization,
        contact: {
          email: report.doctorId.email,
          phone: report.doctorId.phone
        }
      } : null,
      features: report.features[report.type] // Type-specific features
    }));


    res.json({
      success: true,
      count: reports.length,
      data: formattedReports
    });

  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
};


module.exports = {
  predictDiabetes,
  predictCovid,
  getPredictionHistory,
  getMyReports
};