const Clinic = require("../models/clinicModel");
const User = require("../models/userModel");

// Create a new clinic
const createClinic = async (req, res) => {
  try {
    // ✅ Extract userId and isAdmin from the token
    const { userId, isAdmin } = req.user;
    console.log("Admin ID: ", userId, "Is Admin: ", isAdmin);

    // Ensure only admins can create clinics
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const { name, address, contact } = req.body;

    const clinic = new Clinic({
      name,
      address,
      contact,
      adminId: userId, // Store admin ID in clinic
    });

    // Save clinic and associate with the user
    await clinic.save();
    await User.findByIdAndUpdate(userId, { clinicId: clinic._id });

    res.status(201).json({
      success: true,
      message: "Clinic registered successfully",
      clinic,
    });
  } catch (error) {
    console.error("Error in createClinic:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Get all clinics
const getAllClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find({ status: "active" });
    res.status(200).json({ success: true, data: clinics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get clinic by ID
const getClinicById = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }
    res.status(200).json({ success: true, data: clinic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createClinic,
  getAllClinics,
  getClinicById
};
