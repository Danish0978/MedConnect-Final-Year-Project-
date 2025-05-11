// routes/prescriptionRoutes.js
const express = require("express");
const auth = require("../middleware/auth");
const prescriptionController = require("../controllers/prescriptionController");

const prescriptionRouter = express.Router();

prescriptionRouter.post("/add-prescription",auth, prescriptionController.addPrescription);

// Get prescriptions by doctorId
prescriptionRouter.get("/getPrescriptions",auth, prescriptionController.getPrescriptions);

prescriptionRouter.put("/update/:id", auth, prescriptionController.updatePrescription);

module.exports = prescriptionRouter;