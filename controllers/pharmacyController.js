const Pharmacy = require("../models/pharmacyModel");
const User = require("../models/userModel");
const pharmacyReceptionist=require("../models/pharmacyReceptionistModel");
const mongoose = require("mongoose");
// const Medicine = require("../models/medicineModel");
const Feedback = require('../models/feedbackModel');


// Create a new pharmacy
const createPharmacy = async (req, res) => {
  try {
    //  Extract userId and isAdmin from the token
    const { userId, isAdmin } = req.user;
    console.log("Admin ID: ", userId, "Is Admin: ", isAdmin);

    // Ensure only admins can create pharmacies
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const { name, address, contact, licenseNumber } = req.body;

    // Check if license number is already registered
    const existingPharmacy = await Pharmacy.findOne({ licenseNumber });
    if (existingPharmacy) {
      return res.status(400).json({
        success: false,
        message: "License number already registered",
      });
    }

    const pharmacy = new Pharmacy({
      name,
      address,
      contact,
      licenseNumber,
      adminId: userId, // Store admin ID in pharmacy
    });

    // Save pharmacy and associate with the user
    await pharmacy.save();
    await User.findByIdAndUpdate(userId, { pharmacyId: pharmacy._id });

    res.status(201).json({
      success: true,
      message: "Pharmacy registered successfully",
      pharmacy,
    });
  } catch (error) {
    console.error("Error in createPharmacy:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all pharmacies
const getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ status: "active" });
    res.status(200).json({ success: true, data: pharmacies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Update pharmacy details
const updatePharmacy = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { _id: req.params.id, adminId: userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found or you don't have permission",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pharmacy updated successfully",
      data: pharmacy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete pharmacy (set status to inactive)
const deletePharmacy = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { _id: req.params.id, adminId: userId },
      { status: "inactive" },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found or you don't have permission",
      });
    }

    // Remove pharmacy reference from user
    await User.findByIdAndUpdate(userId, { pharmacyId: null });

    res.status(200).json({
      success: true,
      message: "Pharmacy deactivated successfully",
      data: pharmacy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get medicines for a pharmacy
const getPharmacyMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      pharmacyId: req.params.id,
      quantity: { $gt: 0 } // Only show medicines with available stock
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pharmacy ID for current user
const getMyPharmacy = async (req, res) => {
  try {
    const { userId, isPharmacyReceptionist } = req.user;

    if (isPharmacyReceptionist) {
      // Handle pharmacy receptionist case
      const receptionist = await pharmacyReceptionist.findOne({ 
        userId: userId,
        status: "approved"
      }).select('pharmacyId');

      if (!receptionist) {
        return res.status(404).json({
          success: false,
          message: "No active pharmacy receptionist record found",
        });
      }

      return res.status(200).json({
        success: true,
        pharmacyId: receptionist.pharmacyId,
      });
    }

    // Original admin case
    const pharmacy = await Pharmacy.findOne({ 
      adminId: userId,
      status: "active"
    }).select('_id');

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "No active pharmacy found for this user",
      });
    }

    res.status(200).json({
      success: true,
      pharmacyId: pharmacy._id,
    });
  } catch (error) {
    console.error("Error fetching pharmacy:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get multiple pharmacies by IDs
const getMultiplePharmacies = async (req, res) => {
  try {
    const { ids } = req.body;
    
    // Validate input
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Please provide an array of pharmacy IDs"
      });
    }

    // Convert strings to ObjectId and remove duplicates
    const uniqueIds = [...new Set(ids)];
    const objectIds = uniqueIds.map(id =>new mongoose.Types.ObjectId(id));

    // Fetch pharmacies with basic info
    const pharmacies = await Pharmacy.find(
      { _id: { $in: objectIds } },
      { 
        name: 1,
        address: 1,
        licenseNumber: 1
      }
    );

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      pharmacies
    });

  } catch (error) {
    console.error("Error fetching multiple pharmacies:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pharmacies"
    });
  }
};




const getPharmacyReviews = async (req, res) => {
  try {
    // First get the pharmacy ID for the current user
    const { userId, isPharmacyReceptionist } = req.user;
    let pharmacyId;

    if (isPharmacyReceptionist) {
      const receptionist = await PharmacyReceptionist.findOne({ 
        userId: userId,
        status: "approved"
      }).select('pharmacyId');

      if (!receptionist) {
        return res.status(404).json({
          success: false,
          message: "No active pharmacy receptionist record found",
        });
      }
      pharmacyId = receptionist.pharmacyId;
    } else {
      const pharmacy = await Pharmacy.findOne({ 
        adminId: userId,
        status: "active"
      }).select('_id');

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: "No active pharmacy found for this user",
        });
      }
      pharmacyId = pharmacy._id;
    }

    const reviews = await Feedback.find({ pharmacy: pharmacyId })
      .populate('patient', 'firstname lastname pic')
      .populate('order', 'orderNumber createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Pharmacy reviews fetched successfully",
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch pharmacy reviews",
      error: error.message
    });
  }
};





module.exports = {
  createPharmacy,
  getAllPharmacies,
  updatePharmacy,
  deletePharmacy,
  getPharmacyMedicines,
  getMyPharmacy,
  getMultiplePharmacies,
  getPharmacyReviews,
};