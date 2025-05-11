const express = require("express");
const doctorController = require("../controllers/doctorController");
const auth = require("../middleware/auth");

const doctorRouter = express.Router();

// Public routes
doctorRouter.get("/all", doctorController.getAllDoctorsNew);

// Protected routes
doctorRouter.post("/register", auth, doctorController.registerDoctor);
doctorRouter.get("/applications", auth, doctorController.getDoctorApplications);
doctorRouter.post("/update-status", auth, doctorController.updateDoctorStatusNew);
doctorRouter.get("/profile", auth, doctorController.getDoctorByUserId);

// Legacy routes (kept for backward compatibility)
doctorRouter.get("/getnotdoctors", auth, doctorController.getnotdoctors);
doctorRouter.get("/getalldoctors", doctorController.getalldoctors);
doctorRouter.get("/getallmydoctors", auth, doctorController.getallmydoctors);
doctorRouter.get("/getdoctor/:doctorId", auth, doctorController.getDoctorById);
doctorRouter.put("/admin/update-doctor/:doctorId", auth, doctorController.updateDoctorInfo);
doctorRouter.post("/updatedoctorinfo", auth, doctorController.updateDoctorInfo);
doctorRouter.delete("/deletedoctor/:doctorId", auth, doctorController.deletedoctor);

// Admin routes for direct doctor management
doctorRouter.post("/admin/add-doctor", auth, doctorController.addDoctorByAdmin);
doctorRouter.put("/acceptdoctor", auth, doctorController.acceptdoctor);
doctorRouter.put("/rejectdoctor", auth, doctorController.rejectdoctor);


module.exports = doctorRouter;
