const express = require("express");
const medicineRouter = express.Router();
const auth = require("../middleware/auth");
const medicineController = require("../controllers/medicineController");

// Add new medicine (admin or pharmacy receptionist only)
medicineRouter.post("/create/:id", auth, medicineController.addMedicine);

// Get all active medicines for a pharmacy (public)
medicineRouter.get("/all/:pharmacyId", medicineController.getAllMedicines);

medicineRouter.get("/all",auth,medicineController.allMedicines);

// Get specific medicine
medicineRouter.get("/:id", medicineController.getMedicineById);

// Update medicine details (admin or pharmacy receptionist only)
medicineRouter.patch("/update/:id", auth, medicineController.updateMedicine);

// Delete medicine (set status to inactive - admin or pharmacy receptionist only)
medicineRouter.delete("/delete/:id", auth, medicineController.deleteMedicine);

module.exports = medicineRouter;