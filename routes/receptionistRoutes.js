const express = require("express");
const auth = require("../middleware/auth");
const receptionistController = require("../controllers/receptionistController");

const receptionistRouter = express.Router();

// Add a new receptionist
receptionistRouter.post("/add-receptionist", auth, receptionistController.addReceptionist);

// Get all receptionists for a clinic
receptionistRouter.get("/get-receptionists", auth, receptionistController.getReceptionists);

// Get a specific receptionist by ID
receptionistRouter.get("/get-receptionist/:id", auth, receptionistController.getReceptionistById);

// Check patient
receptionistRouter.post("/check-patient", auth, receptionistController.checkPatient);

// Update a receptionist
receptionistRouter.put("/update-receptionist/:id", auth, receptionistController.updateReceptionist);

// Delete a receptionist
receptionistRouter.delete("/delete-receptionist/:id", auth, receptionistController.deleteReceptionist);

module.exports = receptionistRouter;