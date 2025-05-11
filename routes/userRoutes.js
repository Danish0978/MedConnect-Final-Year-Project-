const express = require("express");
const User = require("../models/userModel");
const auth = require("../middleware/auth");
const Clinic = require("../models/clinicModel");
const Pharmacy = require("../models/pharmacyModel");
const userController = require("../controllers/userController");

const userRouter = express.Router();

userRouter.get("/getallusers", auth, userController.getallusers);

userRouter.get("/getuser", auth, userController.getuser);

userRouter.get("/getuserbyid/:id", auth, userController.getUserById);

userRouter.post("/register", userController.register);

userRouter.post("/login", userController.login);

userRouter.put("/updateprofile", auth, userController.updateprofile);

userRouter.put("/updateuser/:id", auth, userController.updateUser);

userRouter.delete("/deleteuser", auth, userController.deleteuser);

userRouter.get("/getalluserswithownerinfo", auth, userController.getAllUsersWithOwnerInfo);

userRouter.get("/getalldoctors", auth, userController.getAllDoctors);

userRouter.get("/getallpharmacyowners", auth, userController.getAllPharmacyOwners);

userRouter.get("/getallclinicowners", auth, userController.getAllClinicOwners);

userRouter.put("/toggleadmin", auth, userController.toggleAdminStatus);

userRouter.get("/check-clinic", auth, async (req, res) => {
  try {
    // Step 1: Find the user by userId
    const { userId, isAdmin } = req.user;

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 2: Find the clinic where the user is the admin
    const clinic = await Clinic.findOne({ adminId: userId });
    
    res.status(200).json({
      success: true,
      hasClinic: Boolean(clinic),
      clinicId: clinic ? clinic._id : null
    });
  } catch (error) {
    console.error("Error checking clinic association:", error);
    res.status(500).json({
      success: false,
      message: "Error checking clinic association"
    });
  }
});

userRouter.get("/check-pharmacy", auth, async (req, res) => {
  try {
    // Step 1: Find the user by userId
    const { userId, isAdmin } = req.user;

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 2: Find the pharmacy where the user is the admin
    const pharmacy = await Pharmacy.findOne({ adminId: userId });
    
    res.status(200).json({
      success: true,
      hasPharmacy: Boolean(pharmacy),
      pharmacyId: pharmacy ? pharmacy._id : null
    });
  } catch (error) {
    console.error("Error checking pharmacy association:", error);
    res.status(500).json({
      success: false,
      message: "Error checking pharmacy association"
    });
  }
});

module.exports = userRouter;
