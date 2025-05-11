const express = require("express");
const pharmacyRouter = express.Router();
const auth = require("../middleware/auth");
const pharmacyController = require("../controllers/pharmacyController");

// Create a new pharmacy (admin only)
pharmacyRouter.post("/create", auth, pharmacyController.createPharmacy);

// Get all active pharmacies (public)
pharmacyRouter.get("/all", pharmacyController.getAllPharmacies);

// Get specific pharmacy
// pharmacyRouter.get("/:id", pharmacyController.getPharmacyById);

// Update pharmacy details (admin only)
pharmacyRouter.patch("/update/:id", auth, pharmacyController.updatePharmacy);

// Delete pharmacy (set status to inactive - admin only)
pharmacyRouter.delete("/delete/:id", auth, pharmacyController.deletePharmacy);

// Get all medicines for a specific pharmacy
pharmacyRouter.get("/medicines/:id", pharmacyController.getPharmacyMedicines);

// Get pharmacy ID for current user
pharmacyRouter.get("/my-pharmacy", auth, pharmacyController.getMyPharmacy);

// Get multiple pharmacies by IDs
pharmacyRouter.post("/getmultiple", auth, pharmacyController.getMultiplePharmacies);

pharmacyRouter.get('/reviews', auth, pharmacyController.getPharmacyReviews);

module.exports = pharmacyRouter;