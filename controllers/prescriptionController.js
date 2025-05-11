// controllers/prescriptionController.js
const Prescription = require("../models/prescriptionModel");
const User =require( "../models/userModel");
const Doctor = require("../models/doctorModel");
const Clinic = require("../models/clinicModel");
const Receptionist = require("../models/receptionistModel");

const addPrescription = async (req, res) => {
  try {
    const { doctorId, patientId, appointmentId, medicines, diagnosis, notes, cnic } = req.body;

    // Validate required fields
    if (!doctorId || !patientId || !appointmentId || !medicines || !diagnosis || !cnic) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Check if a prescription already exists for this appointment
    const existingPrescription = await Prescription.findOne({ appointmentId });

    if (existingPrescription) {
      return res.status(400).json({
        success: false,
        message: "A prescription already exists for this appointment",
      });
    }

    // Find the clinic associated with the doctor
    const doctor = await Doctor.findOne({userId: doctorId}).populate("clinicId");
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const clinicId = doctor.clinicId._id; // Get the clinicId from the doctor's profile

    // Create new prescription
    const prescription = new Prescription({
      doctorId,
      patientId,
      appointmentId,
      medicines,
      diagnosis,
      notes,
      cnic,
      clinicId, // Add clinicId to the prescription
    });

    const result = await prescription.save();

    res.status(201).json({
      success: true,
      message: "Prescription added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while adding prescription",
      error: error.message,
    });
  }
};
const getPrescriptions = async (req, res) => {
  try {
    const { userId, isDoctor, isReceptionist, isAdmin, isPharmacyReceptionist } = req.user;

    let filter = {};

    if (isAdmin || isPharmacyReceptionist) {
      // Admin/Pharmacy Receptionist can access all prescriptions - no filter needed
    } else if (isDoctor) {
      // Doctor can only see their own prescriptions
      filter = { doctorId: userId };
    } else if (isReceptionist) {
      // Receptionist can see prescriptions for their clinic
      const clinic = await Receptionist.findOne({ userId }).populate("clinicId");
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: "Clinic not found for the receptionist",
        });
      }
      filter = { clinicId: clinic.clinicId._id };
    } else {
      // Regular user (patient) can only see their own prescriptions
      filter = { patientId: userId };
    }

    // Fetch prescriptions with optimized population
    const prescriptions = await Prescription.find(filter)
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    // Parallel population of related data
    const populatedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription) => {
        const [doctor, patientUser] = await Promise.all([
          prescription.doctorId ? Doctor.findOne({ userId: prescription.doctorId }).lean() : null,
          prescription.patientId ? User.findById(prescription.patientId).select("-password").lean() : null
        ]);

        const doctorUser = doctor && doctor.userId 
          ? await User.findById(doctor.userId).select("-password").lean()
          : null;

        return {
          ...prescription,
          doctorId: doctor ? {
            ...doctor,
            userId: doctorUser
          } : null,
          patientId: patientUser,
          clinicId: prescription.clinicId 
            ? await Clinic.findById(prescription.clinicId).lean()
            : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: populatedPrescriptions.length,
      data: populatedPrescriptions
    });

  } catch (error) {
    console.error("Error in getPrescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params; // Get the prescription ID from the URL
    const { medicines, diagnosis, notes } = req.body; // Get updated data from the request body

    // Validate required fields
    if (!medicines || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: "Medicines and diagnosis are required fields",
      });
    }

    // Find the prescription by ID and update it
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      { medicines, diagnosis, notes },
      { new: true } // Return the updated document
    );

    if (!updatedPrescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updatedPrescription,
    });
  } catch (error) {
    console.error("Error updating prescription:", error);
    res.status(500).json({
      success: false,
      message: "Error updating prescription",
      error: error.message,
    });
  }
};

module.exports = { addPrescription, getPrescriptions,updatePrescription };