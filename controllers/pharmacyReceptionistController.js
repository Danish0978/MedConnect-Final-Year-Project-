const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const PharmacyReceptionist = require("../models/pharmacyReceptionistModel");
const Pharmacy = require("../models/pharmacyModel");
const Notification = require("../models/notificationModel");

// Add new pharmacy receptionist
const addPharmacyReceptionist = async (req, res) => {
    try {
      const { firstname, lastname, email, password, mobile } = req.body;
      const { userId } = req.user; // Get userId from auth middleware
  
      if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "First name, last name, email, and password are required fields",
        });
      }
  
      // Find pharmacy where adminId matches the current user's ID
      const pharmacy = await Pharmacy.findOne({ adminId: userId });
      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: "Pharmacy not found for this admin",
        });
      }
  
      const pharmacyId = pharmacy._id;
  
      // Check if email exists
      const existingUser = await User.findOne({ email });
      let user;
  
      if (existingUser) {
        if (existingUser.isPharmacyReceptionist) {
          return res.status(400).json({
            success: false,
            message: "Email already registered as pharmacy receptionist",
          });
        }
        existingUser.isPharmacyReceptionist = true;
        user = await existingUser.save();
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
          firstname,
          lastname,
          email,
          password: hashedPassword,
          mobile,
          isPharmacyReceptionist: true,
        });
      }
  
      // Create pharmacy receptionist record
      const receptionist = await PharmacyReceptionist.create({
        userId: user._id,
        pharmacyId, // Assign the pharmacyId we found
      });
  
      // Send notification
      await Notification.create({
        userId: user._id,
        content: `You've been added as a receptionist for ${pharmacy.name}`,
      });
  
      // Email credentials
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
  
        await transporter.sendMail({
          from: `"Pharmacy Admin" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your Pharmacy Receptionist Account",
          html: `
            <h2>Welcome to ${pharmacy.name}!</h2>
            <p>Your login credentials:</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please change your password after logging in.</p>
            <p><a href="${process.env.FRONTEND_URL}/login">Click here to login</a></p>
          `,
        });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        // Continue even if email fails
      }
  
      res.status(201).json({
        success: true,
        message: "Pharmacy receptionist added successfully",
        data: {
          receptionist: {
            _id: receptionist._id,
            userId: receptionist.userId,
            pharmacyId: receptionist.pharmacyId,
            status: receptionist.status
          },
          user: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            mobile: user.mobile
          }
        }
      });
  
    } catch (error) {
      console.error("Error in addPharmacyReceptionist:", error);
      
      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Email already exists in the system",
        });
      }
  
      res.status(500).json({
        success: false,
        message: "Internal server error while adding pharmacy receptionist",
        error: error.message
      });
    }
  };
// Get all pharmacy receptionists
const getPharmacyReceptionists = async (req, res) => {
  try {
    const { userId } = req.user;
    const pharmacy = await Pharmacy.findOne({ adminId: userId });
      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: "Pharmacy not found for this admin",
        });
      }
  
      const pharmacyId = pharmacy._id;

    const receptionists = await PharmacyReceptionist.find({ pharmacyId })
      .populate("userId", "firstname lastname email mobile")
      .populate("pharmacyId", "name address");

    res.status(200).json({
      success: true,
      count: receptionists.length,
      data: receptionists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pharmacy receptionists",
      error: error.message,
    });
  }
};

// Get single pharmacy receptionist
const getPharmacyReceptionistById = async (req, res) => {
  try {
    const { id } = req.params;
    

    const receptionist = await PharmacyReceptionist.findOne({
      _id: id
    }).populate("userId", "firstname lastname email mobile age gender");

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy receptionist not found",
      });
    }

    res.status(200).json({
      success: true,
      data: receptionist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pharmacy receptionist",
      error: error.message,
    });
  }
};

// Update pharmacy receptionist
const updatePharmacyReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, mobile, age, gender } = req.body;

    // Find and verify receptionist belongs to this pharmacy
    const receptionist = await PharmacyReceptionist.findOne({
      _id: id
    });

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy receptionist not found",
      });
    }

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
      receptionist.userId,
      { firstname, lastname, email, mobile, age, gender },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Pharmacy receptionist updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update pharmacy receptionist",
      error: error.message,
    });
  }
};

// Delete pharmacy receptionist
const deletePharmacyReceptionist = async (req, res) => {
  try {
    const { id } = req.params;

    const receptionist = await PharmacyReceptionist.findOneAndDelete({
      _id: id
    });

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy receptionist not found",
      });
    }

    // Remove receptionist role from user
    await User.findByIdAndUpdate(receptionist.userId, {
      isPharmacyReceptionist: false,
    });

    res.status(200).json({
      success: true,
      message: "Pharmacy receptionist deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete pharmacy receptionist",
      error: error.message,
    });
  }
};

module.exports = {
  addPharmacyReceptionist,
  getPharmacyReceptionists,
  getPharmacyReceptionistById,
  updatePharmacyReceptionist,
  deletePharmacyReceptionist,
};