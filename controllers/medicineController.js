const Medicine = require("../models/medicineModel");
const Pharmacy = require("../models/pharmacyModel");
const User = require("../models/userModel");

// Add new medicine
const addMedicine = async (req, res) => {
  try {
    // Extract userId and check if user is admin or pharmacy receptionist
    const { userId, isAdmin, isPharmacyReceptionist } = req.user;
    console.log("User ID: ", userId, "Is Admin: ", isAdmin, "Is Receptionist: ", isPharmacyReceptionist);

    // Ensure only admin or pharmacy receptionist can add medicines
    if (!isAdmin && !isPharmacyReceptionist) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Pharmacy Receptionists only.",
      });
    }

    const { name, genericName, formula, manufacturer, dosage, price, quantity, prescriptionRequired } = req.body;

    // Check if medicine with same name already exists in this pharmacy
    const existingMedicine = await Medicine.findOne({ 
      name,
      pharmacyId: req.params.id 
    });
    
    if (existingMedicine) {
      return res.status(400).json({
        success: false,
        message: "Medicine with this name already exists in your pharmacy",
      });
    }

    const medicine = new Medicine({
      name,
      genericName,
      formula,
      manufacturer,
      dosage,
      price,
      quantity,
      prescriptionRequired,
      pharmacyId: req.params.id
    });

    await medicine.save();

    res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      medicine,
    });
  } catch (error) {
    console.error("Error in addMedicine:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all medicines for a pharmacy
const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      pharmacyId: req.params.pharmacyId,
      status: "active"
    }).sort({ name: 1 });

    res.status(200).json({ 
      success: true, 
      count: medicines.length,
      data: medicines 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const allMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      status: "active"
    }).sort({ name: 1 }).populate("pharmacyId", "name address");

    res.status(200).json({ 
      success: true, 
      count: medicines.length,
      data: medicines 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


// Get single medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id
    });

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: "Medicine not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: medicine 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update medicine details
const updateMedicine = async (req, res) => {
  try {
    const { userId, isAdmin, isPharmacyReceptionist } = req.user;
    
    if (!isAdmin && !isPharmacyReceptionist) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Pharmacy Receptionists only.",
      });
    }

    // First find the medicine to verify ownership
    const existingMedicine = await Medicine.findOne({
      _id: req.params.id
    });

    if (!existingMedicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found or you don't have permission",
      });
    }

    // Now update the medicine
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,  // Changed from medicineId to id
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Delete medicine (set status to inactive)
const deleteMedicine = async (req, res) => {
  try {
    const { userId, isAdmin, isPharmacyReceptionist } = req.user;
    
    if (!isAdmin && !isPharmacyReceptionist) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Pharmacy Receptionists only.",
      });
    }

    const medicine = await Medicine.findOneAndDelete(
      { 
        _id: req.params.id
      }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found or you don't have permission",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine deactivated successfully",
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  addMedicine,
  allMedicines,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
};