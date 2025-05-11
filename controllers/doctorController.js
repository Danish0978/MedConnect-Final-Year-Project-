const Doctor = require("../models/doctorModel");
const User = require("../models/userModel");
const Clinic = require("../models/clinicModel");
const Notification = require("../models/notificationModel");
const Appointment = require("../models/appointmentModel");
const Feedback = require("../models/feedbackModel");
const bcrypt = require("bcrypt");

// 1. Get all approved doctors
const getalldoctors = async (req, res) => {
  try {
    console.log('Starting getalldoctors function');
    
    // 1. Fetch doctors
    let docs;
    if (!req.locals) {
      console.log('Fetching all approved doctors (no locals)');
      docs = await Doctor.find({ status: "approved" })
        .populate("userId")
        .populate("clinicId");
    } else {
      console.log(`Fetching approved doctors excluding ID: ${req.locals}`);
      docs = await Doctor.find({ status: "approved", _id: { $ne: req.locals } })
        .populate("userId")
        .populate("clinicId");
    }

    console.log(`Found ${docs.length} doctors`);
    console.log('Doctor IDs:', docs.map(d => d.userId));

    // 2. Fetch feedbacks
    const doctorIds = docs.map(doctor => doctor.userId._id);
    console.log('Fetching feedbacks for doctor IDs:', doctorIds);
    
    const feedbacks = await Feedback.find({ doctor: { $in: doctorIds } })
      .populate({
        path: 'patient',
        select: 'firstname lastname',
        model: 'User'
      });

    console.log(`Found ${feedbacks.length} feedbacks total`);
    console.log('Sample feedback:', feedbacks.length > 0 ? {
      _id: feedbacks[0]._id,
      doctor: feedbacks[0].doctor,
      patient: feedbacks[0].patient,
      rating: feedbacks[0].rating
    } : 'No feedbacks found');

    // 3. Group feedbacks by doctor
    const feedbacksByDoctor = feedbacks.reduce((acc, feedback) => {
      const doctorId = feedback.doctor.toString();
      if (!acc[doctorId]) {
        acc[doctorId] = [];
      }
      acc[doctorId].push(feedback);
      return acc;
    }, {});

    console.log('Feedbacks grouped by doctor:', Object.keys(feedbacksByDoctor).map(key => ({
      doctorId: key,
      feedbackCount: feedbacksByDoctor[key].length
    })));

    // 4. Calculate ratings
    const doctorsWithRatings = docs.map(doctor => {
      const doctorIdStr = doctor.userId._id.toString();
      console.log("doctorIdStr",doctorIdStr);
      const doctorFeedbacks = feedbacksByDoctor[doctorIdStr] || [];
      
      console.log(`\nCalculating for doctor ${doctorIdStr}`);
      console.log(`Found ${doctorFeedbacks.length} feedbacks`);

      const ratings = doctorFeedbacks.map(fb => fb.rating);
      console.log('Individual ratings:', ratings);

      const sumRatings = ratings.reduce((sum, rating) => sum + rating, 0);
      const avgRating = doctorFeedbacks.length > 0 
        ? sumRatings / doctorFeedbacks.length
        : 0;

      console.log(`Sum: ${sumRatings}, Count: ${doctorFeedbacks.length}, Avg: ${avgRating}`);

      return {
        ...doctor.toObject(),
        feedbacks: doctorFeedbacks,
        averageRating: avgRating.toFixed(1),
        totalReviews: doctorFeedbacks.length
      };
    });

    console.log('\nFinal doctors data:');
    doctorsWithRatings.forEach(doc => {
      console.log(`Doctor ${doc._id}: ${doc.averageRating} (${doc.totalReviews} reviews)`);
    });

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctorsWithRatings,
    });
  } catch (error) {
    console.error('Error in getalldoctors:', error);
    res.status(500).json({
      success: false,
      message: "Unable to get doctors",
      error: error.message,
    });
  }
};

const getallmydoctors = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user; // Assuming req.user contains the logged-in user's info

    // Check if the user is an admin
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can perform this action.",
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

    // Fetch doctors belonging to the clinic
    const docs = await Doctor.find({ clinicId: clinic._id, status: "approved" })
      .populate("userId")
      .populate("clinicId");

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get doctors",
      error: error.message,
    });
  }
};

// 2. Get all non-doctors (users who are not doctors)
const getnotdoctors = async (req, res) => {
  try {
    const docs = await Doctor.find({ status: "pending" })
      .populate("userId")
      .populate("clinicId");
    res.status(200).json({
      success: true,
      message: "Non-doctors fetched successfully",
      data: docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get non-doctors",
      error: error.message,
    });
  }
};

// 3. Apply for doctor
const applyfordoctor = async (req, res) => {
  try {
    const alreadyFound = await Doctor.findOne({ userId: req.locals });
    if (alreadyFound) {
      return res.status(400).json({
        success: false,
        message: "Application already exists",
      });
    }

    const doctor = new Doctor({
      userId: req.locals,
      clinicId: req.body.clinicId,
      specialization: req.body.specialization,
      experience: req.body.experience,
      feePerConsultation: req.body.feePerConsultation,
      availability: req.body.availability,
      timings: req.body.timings,
      status: "pending",
    });

    const result = await doctor.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to submit application",
      error: error.message,
    });
  }
};

// 4. Accept a doctor application
const { ObjectId } = require('mongoose').Types;

const acceptdoctor = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.body;

    console.log("Request Body:", req.body);

    // Validate doctorId and clinicId
    if (!ObjectId.isValid(doctorId) || !ObjectId.isValid(clinicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctorId or clinicId",
      });
    }

    // Step 1: Find the Doctor document
    const doctor = await Doctor.findOne({ _id: new ObjectId(doctorId) });

    console.log("Found Doctor:", doctor);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Step 2: Extract userId from the Doctor document
    const userId = doctor.userId;

    // Step 3: Update the User document
    const user = await User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { isDoctor: true, status: "accepted" },
      { new: true }
    );

    console.log("Updated User:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 4: Update the Doctor document status
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { _id: new ObjectId(doctorId), clinicId: new ObjectId(clinicId) },
      { status: "approved" },
      { new: true }
    );

    console.log("Updated Doctor:", updatedDoctor);

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Step 5: Send notification
    const notification = new Notification({
      userId: new ObjectId(userId),
      content: "Congratulations, Your application has been accepted.",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Application accepted notification sent",
    });
  } catch (error) {
    console.error("Error in acceptdoctor:", error);
    res.status(500).json({
      success: false,
      message: "Error while sending notification",
      error: error.message,
    });
  }
};

// 5. Reject a doctor application
const rejectdoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    console.log("Request Body:", req.body);

    // Validate doctorId
    if (!ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctorId",
      });
    }

    // Step 1: Find the Doctor document
    const doctor = await Doctor.findOne({ _id: new ObjectId(doctorId) });

    console.log("Found Doctor:", doctor);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Step 2: Extract userId from the Doctor document
    const userId = doctor.userId;

    // Step 3: Update the User document
    const user = await User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { isDoctor: false, status: "rejected" },
      { new: true }
    );

    console.log("Updated User:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 4: Delete the Doctor document
    const delDoc = await Doctor.findOneAndDelete({ _id: new ObjectId(doctorId) });

    console.log("Deleted Doctor:", delDoc);

    if (!delDoc) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Step 5: Send notification
    const notification = new Notification({
      userId: new ObjectId(userId),
      content: "Sorry, Your application has been rejected.",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Application rejection notification sent",
    });
  } catch (error) {
    console.error("Error in rejectdoctor:", error);
    res.status(500).json({
      success: false,
      message: "Error while rejecting application",
      error: error.message,
    });
  }
};
// 6. Delete a doctor
const deletedoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId; // Use req.params.doctorId

    // Find the doctor to get the associated userId
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const userId = doctor.userId;

    // Update the user's isDoctor status
    const result = await User.findByIdAndUpdate(userId, {
      isDoctor: false,
      status: "pending",
    });

    // Delete the doctor record
    const removeDoc = await Doctor.findByIdAndDelete(doctorId);

    // Delete all appointments associated with the doctor
    const removeAppoint = await Appointment.deleteMany({
      doctorId: doctorId,
    });

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete doctor",
      error: error.message,
    });
  }
};

// 7. Add a doctor by admin
const addDoctorByAdmin = async (req, res) => {
  try {
    const { firstname, lastname, email, password, mobile, specialization, experience, feePerConsultation, availability, timings } =
      req.body;

    // Get the admin's userId from the request (set by the authentication middleware)
    const { userId } = req.user;

    // Validate required fields
    if (!specialization || !experience || !feePerConsultation || !availability || !timings) {
      return res.status(400).json({
        success: false,
        message: "Required doctor fields are missing",
      });
    }

    // Find the clinic associated with the admin
    const clinic = await Clinic.findOne({ adminId: userId });
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found for the admin",
      });
    }

    const clinicId = clinic._id;

    // Check if email already exists
    const emailPresent = await User.findOne({ email });

    let user;
    if (emailPresent) {
      // If email exists, use the existing user
      emailPresent.isDoctor = true;
      emailPresent.status = "accepted";
      user = await emailPresent.save();
    } else {
      // If email does not exist, validate user fields and create a new user
      if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Required user fields are missing",
        });
      }

      // Hash the password
      const hashedPass = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
        firstname,
        lastname,
        email,
        password: hashedPass,
        mobile: mobile || "",
        isDoctor: true,
        status: "accepted",
      });

      user = await newUser.save();
    }

    // Create doctor profile
    const doctor = new Doctor({
      userId: user._id,
      clinicId,
      specialization,
      experience,
      feePerConsultation,
      availability,
      timings,
      status: "approved",
    });

    const result = await doctor.save();

    // Send notification to the new doctor
    const notification = new Notification({
      userId: user._id,
      content: "Welcome! You have been added as a doctor by the admin.",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while adding doctor",
      error: error.message,
    });
  }
};

// 8. Apply for doctor (alternative)
const applyDoctor = async (req, res) => {
  try {
    const { specialization, experience, feePerConsultation, clinicId, availability, timings } =
      req.body;
    const userId = req.userId;

    // Check if doctor profile exists
    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      // Create new doctor profile
      doctor = new Doctor({
        userId,
        clinicId,
        specialization,
        experience,
        feePerConsultation,
        availability,
        timings,
        status: "pending",
      });
    } else {
      // Add new clinic application
      doctor.clinics.push({
        clinicId,
        feePerConsultation,
        status: "pending",
      });
    }

    await doctor.save();
    await User.findByIdAndUpdate(userId, { isDoctor: true });

    res.status(201).json({
      success: true,
      message: "Doctor application submitted successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error applying doctor account",
      error: error.message,
    });
  }
};

// 9. Get all doctors for a specific clinic
const getAllDoctors = async (req, res) => {
  try {
    const clinicId = req.query.clinicId;

    // Find doctors with the given clinicId and status "approved"
    const doctors = await Doctor.find({
      clinicId,
      status: "approved",
    })
      .populate("userId") // Populate user details
      .populate({
        path: "clinicId", // Populate clinic details
        select: "name address contact", // Select specific fields from the Clinic model
      });

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting doctors list",
      error: error.message,
    });
  }
};

// 10. Update doctor status
const updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId, status } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { status },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor status updated successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing doctor account status",
      error: error.message,
    });
  }
};

// 11. Get doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const doctor = await Doctor.findById(doctorId)
      .populate("userId")
      .populate("clinicId");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor fetched successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error in getDoctorById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor",
      error: error.message,
    });
  }
};

// 12. Get doctor by ID (old)
const getDoctorByIdOld = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId)
      .populate("userId")
      .populate("clinicId");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting doctor",
      error: error.message,
    });
  }
};

// 13. Update doctor information
const updateDoctorInfo = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { specialization, experience, feePerConsultation, availability, timings } = req.body;

    // Validate doctor ID
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Validate required fields
    if (!specialization || !experience || !feePerConsultation) {
      return res.status(400).json({
        success: false,
        message: "Required fields cannot be empty",
      });
    }

    // Validate numeric fields
    if (isNaN(experience) || experience < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a positive number",
      });
    }

    if (isNaN(feePerConsultation) || feePerConsultation < 0) {
      return res.status(400).json({
        success: false,
        message: "Fee per consultation must be a positive number",
      });
    }

    // Find doctor and update
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        specialization,
        experience,
        feePerConsultation,
        availability: availability || doctor.availability,
        timings: timings || doctor.timings,
      },
      { new: true }
    )
      .populate("userId")
      .populate("clinicId");

    res.status(200).json({
      success: true,
      message: "Doctor information updated successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Error in updateDoctorInfo:", error);
    res.status(500).json({
      success: false,
      message: "Error updating doctor information",
      error: error.message,
    });
  }
};

// 14. Register doctor
const registerDoctor = async (req, res) => {
  try {
    const {
      clinicId,
      specialization,
      experience,
      feePerConsultation,
      availability,
      timings,
    } = req.body;

    // Validate required fields
    if (!clinicId || !specialization || !experience || !feePerConsultation || !availability || !timings) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate clinic exists
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Selected clinic not found",
      });
    }

    // Check if user already has a pending application for this clinic
    const existingApplication = await Doctor.findOne({
      userId: req.userId,
      clinicId,
      status: "pending",
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending application for this clinic",
      });
    }

    // Validate timings array
    if (!Array.isArray(timings) || timings.length !== 2 || timings.some((t) => typeof t !== "number" || t < 0 || t > 24)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timings provided",
      });
    }
    const { userId, isAdmin } = req.user;
    // Create new doctor application
    const newDoctor = new Doctor({
      userId: userId,
      clinicId,
      specialization,
      experience,
      feePerConsultation,
      availability,
      timings,
      status: "pending",
    });

    await newDoctor.save();

    res.status(201).json({
      success: true,
      message: "Doctor application submitted successfully",
      data: newDoctor,
    });
  } catch (error) {
    console.error("Error in doctor registration:", error);
    res.status(500).json({
      success: false,
      message: "Error in doctor registration",
      error: error.message,
    });
  }
};

// 15. Get all doctors (new)
const getAllDoctorsNew = async (req, res) => {
  try {
    const { clinicId } = req.query;
    const filter = clinicId ? { clinicId, status: "approved" } : { status: "approved" };

    const doctors = await Doctor.find(filter)
      .populate("userId", "-password")
      .populate("clinicId", "name address");

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in getting doctors",
      error: error.message,
    });
  }
};

// 16. Get doctor applications
const getDoctorApplications = async (req, res) => {
  try {
    // Get clinic admin's clinic
    const clinic = await Clinic.findOne({ adminId: req.userId });
    if (!clinic) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view applications",
      });
    }

    const applications = await Doctor.find({
      clinicId: clinic._id,
      status: "pending",
    }).populate("userId", "-password");

    res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in getting applications",
      error: error.message,
    });
  }
};

// 17. Update doctor status (new)
const updateDoctorStatusNew = async (req, res) => {
  try {
    const { doctorId, status } = req.body;

    // Verify the clinic admin is authorized
    const clinic = await Clinic.findOne({ adminId: req.userId });
    if (!clinic) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update application status",
      });
    }

    // Find and update the doctor application
    const doctor = await Doctor.findOne({
      _id: doctorId,
      clinicId: clinic._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor application not found",
      });
    }

    doctor.status = status;
    await doctor.save();

    // If approved, update user's isDoctor status
    if (status === "approved") {
      await User.findByIdAndUpdate(doctor.userId, { isDoctor: true });
    }

    res.status(200).json({
      success: true,
      message: `Doctor application ${status} successfully`,
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in updating doctor status",
      error: error.message,
    });
  }
};

// 18. Get doctor by user ID
const getDoctorByUserId = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.userId,
      status: "approved",
    })
      .populate("clinicId", "name address")
      .populate("userId", "-password");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor information not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in getting doctor info",
      error: error.message,
    });
  }
};

module.exports = {
  getalldoctors,
  getallmydoctors,
  getnotdoctors,
  applyfordoctor,
  acceptdoctor,
  rejectdoctor,
  deletedoctor,
  addDoctorByAdmin,
  applyDoctor,
  getAllDoctors,
  updateDoctorStatus,
  getDoctorById,
  getDoctorByIdOld,
  updateDoctorInfo,
  registerDoctor,
  getAllDoctorsNew,
  getDoctorApplications,
  updateDoctorStatusNew,
  getDoctorByUserId,
};