// routes/predictionRoutes.js
const express = require('express');
const predictionRouter = express.Router();
const predictionController = require('../controllers/predictionController');
const auth = require('../middleware/auth');

predictionRouter.get('/report', auth, predictionController.getMyReports);
predictionRouter.post('/diabetes', auth, predictionController.predictDiabetes);
predictionRouter.post('/covid', auth, predictionController.predictCovid);

module.exports = predictionRouter;