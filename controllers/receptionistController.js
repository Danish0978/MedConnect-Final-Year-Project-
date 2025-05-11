const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const Receptionist = require("../models/receptionistModel");
const Notification = require("../models/notificationModel");
const Clinic = require("../models/clinicModel");
const bcrypt = require("bcrypt");


// Add a new receptionist
const addReceptionist = async (req, res) => {
  try {
    const { firstname, lastname, email, password, mobile } = req.body;
    const { userId } = req.user; // Get the currently logged-in admin's ID

    // Hardcoded values for testing
    const adminEmail = "danishishaq060@gmail.com"; // Admin's email
    const adminPassword = "Danishishaq786@#$"; // Admin's app password

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required fields.",
      });
    }

    // Find the clinic associated with the admin
    const clinic = await Clinic.findOne({ adminId: userId });
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found for the admin.",
      });
    }

    const clinicId = clinic._id;

    // Check if email already exists
    const emailPresent = await User.findOne({ email });

    let user;
    let tempPassword = password; // Store the plain password for email

    if (emailPresent) {
      // If email exists, update it to receptionist role
      if (emailPresent.isReceptionist) {
        return res.status(400).json({
          success: false,
          message: "A receptionist with this email already exists.",
        });
      }

      emailPresent.isReceptionist = true;
      emailPresent.status = "accepted";
      user = await emailPresent.save();
    } else {
      // If email does not exist, create a new user
      const hashedPass = await bcrypt.hash(password, 10); // Hash the password

      const newUser = new User({
        firstname,
        lastname,
        email,
        password: hashedPass,
        mobile: mobile || "",
        isReceptionist: true,
        status: "accepted",
      });

      user = await newUser.save();
    }

    // Create receptionist profile
    const receptionist = new Receptionist({
      userId: user._id,
      clinicId,
      status: "approved",
    });

    await receptionist.save();

    // Send notification
    const notification = new Notification({
      userId: user._id,
      content: "Welcome! You have been added as a Receptionist by the admin.",
    });

    await notification.save();

    // Try to send email with credentials
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587, // Use 587 for TLS
        secure: false, // false for 587
        auth: {
          user: adminEmail, // Hardcoded admin email
          pass: adminPassword, // Hardcoded admin app password
        },
        debug: true, // Enable debugging
        logger: true, // Log connection details
      });

      const mailOptions = {
        from: `"Admin" <${adminEmail}>`, // Sender email (admin's email)
        to: email, // Receptionist's email
        subject: "Your Receptionist Account Details", // Email subject
        text: `Hello,

You have been added as a receptionist by ${adminEmail}. Below are your login details:

Email: ${email}
Password: ${tempPassword}

Please change your password after logging in.

Best Regards,
Admin Team`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully from ${adminEmail} to ${email}`);

      res.status(201).json({
        success: true,
        message: "Receptionist added successfully, and credentials sent via email.",
        data: receptionist,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);

      // If email fails, still return success but with a warning
      res.status(201).json({
        success: true,
        message: "Receptionist added successfully, but email could not be sent due to a connection issue.",
        data: receptionist,
      });
    }
  } catch (error) {
    console.error("Error adding receptionist:", error);
    res.status(500).json({
      success: false,
      message: "Error while adding receptionist.",
      error: error.message,
    });
  }
};

// Get all receptionists for a clinic
const getReceptionists = async (req, res) => {
  try {
    const { userId } = req.user;

    // Find the clinic associated with the admin
    const clinic = await Clinic.findOne({ adminId: userId });
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found for the admin",
      });
    }

    const clinicId = clinic._id;

    // Find all receptionists for the clinic
    const receptionists = await Receptionist.find({ clinicId }).populate(
      "userId",
      "firstname lastname email mobile gender"
    );

    res.status(200).json({
      success: true,
      data: receptionists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching receptionists",
      error: error.message,
    });
  }
};


const getReceptionistById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the receptionist by ID
      const receptionist = await Receptionist.findById(id);
      if (!receptionist) {
        return res.status(404).json({
          success: false,
          message: "Receptionist not found",
        });
      }
  
      // Find the associated user details
      const user = await User.findById(receptionist.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Associated user not found",
        });
      }
  
      // Send the receptionist details along with user info, including age & gender
      res.status(200).json({
        success: true,
        message: "Receptionist details fetched successfully",
        data: {
          _id: receptionist._id,
          userId: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          mobile: user.mobile,
          age: user.age,      // Include age
          gender: user.gender, // Include gender
          status: receptionist.status, 
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching receptionist details",
        error: error.message,
      });
    }
  };
  
  
  
  
  

// Update a receptionist
const updateReceptionist = async (req, res) => {
    try {
      const { id } = req.params;
      const { firstname, lastname, email, mobile, age, gender } = req.body;
  
      // Find the receptionist to get the associated userId
      const receptionist = await Receptionist.findById(id);
      if (!receptionist) {
        return res.status(404).json({
          success: false,
          message: "Receptionist not found",
        });
      }
  
      const userId = receptionist.userId; // Assuming receptionist schema has userId field
  
      // Update the user details without modifying status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstname, lastname, email, mobile, age, gender },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Associated user not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Receptionist details updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating receptionist",
        error: error.message,
      });
    }
  };
  

// Delete a receptionist
const deleteReceptionist = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the receptionist to get the associated userId
      const receptionist = await Receptionist.findById(id);
      if (!receptionist) {
        return res.status(404).json({
          success: false,
          message: "Receptionist not found",
        });
      }
  
      const userId = receptionist.userId; // Assuming receptionist schema has a userId field
  
      // Delete the receptionist
      await Receptionist.findByIdAndDelete(id);
  
      // Update the corresponding user record
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isReceptionist: false, status: "pending" },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Associated user not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Receptionist deleted successfully, user status updated",
        updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting receptionist",
        error: error.message,
      });
    }
  };

  const checkPatient = async (req, res) => {
    try {
      // Only receptionists can access this endpoint
      if (!req.user.isReceptionist) {
        return res.status(403).json({ 
          success: false, 
          message: "Only receptionists can check patients" 
        });
      }
  
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Patient email required" 
        });
      }
  
      // Check patient existence (including users who might become patients)
      const patient = await User.findOne({ 
        email: email.toLowerCase().trim(),
        $and: [
          { isAdmin: false },  // Explicitly exclude admins
          {
            $or: [
              { isPatient: true },
              { isPatient: { $exists: false } } // Include potential patients
            ]
          }
        ]
      }).select('firstname lastname email mobile age gender pic');
  
      res.status(200).json({
        exists: !!patient,
        patient: patient ? {
          name: `${patient.firstname} ${patient.lastname}`,
          email: patient.email,
          contact: patient.mobile || 'Not provided',
          age: patient.age || 'Not provided',
          gender: patient.gender || 'Not provided',
          pic: patient.pic || 'Not provided'
        } : null
      });
  
    } catch (error) {
      console.error("Receptionist patient check failed:", error);
      res.status(500).json({ 
        success: false, 
        message: "Patient verification service unavailable" 
      });
    }
  };
  

module.exports = {
  addReceptionist,
  getReceptionists,
  updateReceptionist,
  deleteReceptionist,
  getReceptionistById,
  checkPatient
};