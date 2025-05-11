const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createClinic,
  getAllClinics,
  getClinicById,
} = require("../controllers/clinicController");

// Create a new clinic (admin only)
router.post("/create", auth, createClinic);

// Get all active clinics (public)
router.get("/all", getAllClinics);

// Get specific clinic
router.get("/:id", getClinicById);

module.exports = router;
