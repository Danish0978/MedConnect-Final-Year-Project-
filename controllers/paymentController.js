const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");

const getAllTransactions = async (req, res) => {
    try {
      // Verify super admin
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({ 
          error: "Access denied. Super admin privileges required" 
        });
      }
  
      // Step 1: Get all payments data first
      const payments = await Payment.find().sort({ createdAt: -1 });
  
      // Step 2: Process each payment to get additional details
      const enrichedTransactions = await Promise.all(payments.map(async (payment) => {
        const result = {
          ...payment.toObject(), // Basic payment info
          doctorInfo: null,
          patientInfo: null
        };
  
        // Only process doctor info if doctorId exists
        if (payment.doctorId) {
          // Get doctor details (specialization) by matching doctorId with userId in Doctors
          const doctor = await Doctor.findOne({ userId: payment.doctorId })
            .select('specialization')
            .lean();
          
          if (doctor) {
            result.doctorInfo = {
              specialization: doctor.specialization
            };
  
            // Get doctor's personal details from Users
            const doctorUser = await User.findById(payment.doctorId)
              .select('firstname lastname')
              .lean();
            
            if (doctorUser) {
              result.doctorInfo.name = `${doctorUser.firstname} ${doctorUser.lastname}`;
            }
          }
        }
  
        // Get patient details (userId in payments matches _id in Users)
        const patient = await User.findById(payment.userId)
          .select('firstname lastname email')
          .lean();
        
        if (patient) {
          result.patientInfo = {
            name: `${patient.firstname} ${patient.lastname}`,
            email: patient.email
          };
        }
  
        return result;
      }));
  
      res.status(200).json({
        success: true,
        count: enrichedTransactions.length,
        data: enrichedTransactions
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ 
        error: "Server error",
        details: error.message 
      });
    }
  };

module.exports = {
  getAllTransactions
};
