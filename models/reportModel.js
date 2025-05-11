// models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    type: {
        type: String,
        enum: ['diabetes', 'covid'],
        required: true
    },
    // Structured data fields for both types
    features: {
        // Common fields could go here if any
        // Diabetes-specific fields
        diabetes: {
            pregnancies: Number,
            glucose: Number,
            bloodPressure: Number,
            skinThickness: Number,
            insulin: Number,
            bmi: Number,
            diabetesPedigreeFunction: Number,
            age: Number
        },
        // COVID-specific fields
        covid: {
            breathingProblem: Boolean,
            fever: Boolean,
            dryCough: Boolean,
            soreThroat: Boolean,
            runningNose: Boolean,
            asthma: Boolean,
            chronicLungDisease: Boolean,
            headache: Boolean,
            heartDisease: Boolean,
            diabetes: Boolean,
            hyperTension: Boolean,
            fatigue: Boolean,
            gastrointestinal: Boolean,
            abroadTravel: Boolean,
            contactWithCovidPatient: Boolean,
            attendedLargeGathering: Boolean,
            visitedPublicExposedPlaces: Boolean,
            familyWorkingInPublicExposedPlaces: Boolean,
            wearingMasks: Boolean,
            sanitizationFromMarket: Boolean
        }
    },
    prediction: {
        type: Number,  // Probability score
        required: true
    },
    predictionResult: {
        type: Number,  // Binary prediction (0 or 1)
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Add a virtual for easy access to type-specific features
ReportSchema.virtual('typeFeatures').get(function() {
    return this.features[this.type];
});

const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;