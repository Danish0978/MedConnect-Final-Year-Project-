const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const Pharmacy = require("../models/pharmacyModel");
const Clinic = require("../models/clinicModel");

const getuser = async (req, res) => {
  try {
    console.log("User",req.params.id);
    const user = await User.findById(req.params.id).select("-password");
    return res.send(user);
  } catch (error) {
    res.status(500).send("Unable to get user");
  }
};

const getallusers = async (req, res) => {
  const {userId} =req.user;
  try {
    const users = await User
      .find({ _id: { $ne: userId } })
      .select("-password");
    return res.send(users);
  } catch (error) {
    res.status(500).send("Unable to get all users");
  }
};

const login = async (req, res) => {
  console.log(req.body)
  try {
    const emailPresent = await User.findOne({ email: req.body.email });
    if (!emailPresent) {
      console.log("here")
      return res.status(404).send("Incorrect credentials");
    }
    const verifyPass = await bcrypt.compare(
      req.body.password,
      emailPresent.password
    );
    if (!verifyPass) {
      return res.status(400).send("Incorrect credentials");
    }
    const token = jwt.sign(
      { userId: emailPresent._id, isAdmin: emailPresent.isAdmin, isDoctor: emailPresent.isDoctor, isReceptionist: emailPresent.isReceptionist, isPharmacyReceptionist: emailPresent.isPharmacyReceptionist, isSuperAdmin: emailPresent.isSuperAdmin },
      process.env.JWT_SECRET,
      {
        expiresIn: "2 days",
      }
    );
    return res.status(201).send({ msg: "User logged in successfully", token });
  } catch (error) {
    res.status(500).send("Unable to login user");
  }
};

const register = async (req, res) => {
  
  try {
    const emailPresent = await User.findOne({ email: req.body.email });
    if (emailPresent) {
      return res.status(400).send("Email already exists");
    }
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    const user = await User({ ...req.body, password: hashedPass });
    const result = await user.save();

    
    if (!result) {
      return res.status(500).send("Unable to register user");
    }
    return res.status(201).send("User registered successfully");
  } catch (error) {
    console.log(req.body);
    res.status(500).send("Unable to register user");
  }
};

const updateprofile = async (req, res) => {
  try {
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    const result = await User.findByIdAndUpdate(
      { _id: req.locals },
      { ...req.body, password: hashedPass }
    );
    if (!result) {
      return res.status(500).send("Unable to update user");
    }
    return res.status(201).send("User updated successfully");
  } catch (error) {
    res.status(500).send("Unable to update user");
  }
};

const deleteuser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.body.userId);
    const removeDoc = await Doctor.findOneAndDelete({
      userId: req.body.userId,
    });
    const removeAppoint = await Appointment.findOneAndDelete({
      userId: req.body.userId,
    });
    return res.send("User deleted successfully");
  } catch (error) {
    res.status(500).send("Unable to delete user");
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).send("Error getting user");
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstname, lastname, email, mobile, age, gender } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email) {
      return res.status(400).send("Required fields cannot be empty");
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstname,
        lastname,
        email,
        mobile,
        age,
        gender,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Error updating user");
  }
};


const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ isDoctor: true }).select("-password");
    res.status(200).send(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const getAllUsersWithOwnerInfo = async (req, res) => {
  try {
    const users = await User.find({});
    
    // Get pharmacy and clinic info for each user
    const usersWithOwnerInfo = await Promise.all(users.map(async (user) => {
      const pharmacy = await Pharmacy.findOne({ adminId: user._id });
      const clinic = await Clinic.findOne({ adminId: user._id });
      
      return {
        ...user._doc,
        pharmacyInfo: pharmacy || null,
        clinicInfo: clinic || null
      };
    }));

    res.status(200).send(usersWithOwnerInfo);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users with owner info");
  }
};


const getAllPharmacyOwners = async (req, res) => {
  try {
    // Get all pharmacies
    const pharmacies = await Pharmacy.find();
    
    // Get all user IDs of pharmacy admins
    const adminIds = pharmacies.map(pharmacy => pharmacy.adminId);
    
    // Find all users who are admins of pharmacies
    const users = await User.find({ 
      _id: { $in: adminIds } 
    }).select('-password');
    
    // Combine the data
    const pharmacyOwners = users.map(user => {
      const pharmacy = pharmacies.find(p => p.adminId.equals(user._id));
      return {
        ...user._doc,
        pharmacyInfo: {
          _id: pharmacy._id,
          name: pharmacy.name,
          // Include other pharmacy fields
        }
      };
    });
    
    res.status(200).send(pharmacyOwners);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const getAllClinicOwners = async (req, res) => {
  try {
    // Get all pharmacies
    const clinics = await Clinic.find();
    
    // Get all user IDs of pharmacy admins
    const adminIds = clinics.map(clinic => clinic.adminId);
    
    // Find all users who are admins of pharmacies
    const users = await User.find({ 
      _id: { $in: adminIds } 
    }).select('-password');
    
    // Combine the data
    const clinicOwners = users.map(user => {
      const clinic = clinics.find(c => c.adminId.equals(user._id));
      return {
        ...user._doc,
        clinicInfo: {
          _id: clinic._id,
          name: clinic.name,
          // Include other clinic fields
        }
      };
    });
    
    res.status(200).send(clinicOwners);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const toggleAdminStatus = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent modifying your own admin status or super admin
    if (req.user.id === userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You cannot modify your own admin status" 
      });
    }

    // Toggle the isAdmin field
    user.isAdmin = !user.isAdmin;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Error toggling admin status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

module.exports = {
  getuser,
  getallusers,
  login,
  register,
  updateprofile,
  deleteuser,
  getUserById,
  updateUser,
  getAllDoctors,
  getAllPharmacyOwners,
  getAllClinicOwners,
  getAllUsersWithOwnerInfo,
  toggleAdminStatus
};
