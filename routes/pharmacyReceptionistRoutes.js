const express = require("express");
const auth = require("../middleware/auth");
const pharmacyReceptionistController = require("../controllers/pharmacyReceptionistController");

const router = express.Router();

router.post("/add-receptionist", auth, pharmacyReceptionistController.addPharmacyReceptionist);
router.get("/receptionists", auth, pharmacyReceptionistController.getPharmacyReceptionists);
router.get("/receptionist/:id", auth, pharmacyReceptionistController.getPharmacyReceptionistById);
router.put("/update/:id", auth, pharmacyReceptionistController.updatePharmacyReceptionist);
router.delete("/delete/:id", auth, pharmacyReceptionistController.deletePharmacyReceptionist);

module.exports = router;