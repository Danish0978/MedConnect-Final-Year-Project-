const Appointment = require("../models/appointmentModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const Clinic = require("../models/clinicModel");
const Doctor = require("../models/doctorModel");
const Receptionist = require("../models/receptionistModel");
const Payment = require("../models/paymentModel"); // Add this line
const bcrypt = require("bcrypt");
const { createPaymentIntent, verifyPayment } = require("./stripeService"); // Add this line

const getallappointments = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    if (!isAdmin) {
      return res.status(403).send("Access denied. Only admins can perform this action.");
    }

    const clinic = await Clinic.findOne({ adminId: userId });
    if (!clinic) {
      return res.status(404).send("Clinic not found for this admin.");
    }

    const clinicId = clinic._id;
    const doctors = await Doctor.find({ clinicId: clinicId });
    const doctorIds = doctors.map(doctor => doctor.userId);

    const appointments = await Appointment.find({ doctorId: { $in: doctorIds } })
      .populate("doctorId")
      .populate("userId");

    return res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to get appointments");
  }
};

const getappointments = async (req, res) => {
  try {
    const { userId, isAdmin, isReceptionist } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    let query = {};

    if (user.isDoctor) {
      query = { doctorId: userId };
    } else if (user.isReceptionist) {
      const receptionist = await Receptionist.findOne({ userId: userId });
      if (!receptionist) {
        return res.status(404).send("Receptionist record not found");
      }
      const clinicId = receptionist.clinicId;
      const doctors = await Doctor.find({ clinicId });
      const doctorIds = doctors.map(doctor => doctor.userId);
      query = { doctorId: { $in: doctorIds } };
    } else if (!user.isAdmin) {
      query = { userId: userId };
    } else {
      return res.status(400).send("Admins should use the admin endpoint");
    }

    const appointments = await Appointment.find(query)
      .populate("doctorId")
      .populate("userId");
      
    return res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to get appointments");
  }
};

const initiateStripePayment = async (req, res) => {
  try {
    const { doctorId, date, time, amount } = req.body;
    
    // Validate amount
    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const doctor = await Doctor.findById(doctorId).populate("userId");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const metadata = {
      doctorId: doctor._id.toString(),
      userId: req.userId.toString(),
      date,
      time,
      doctorname: `${doctor.userId.firstname} ${doctor.userId.lastname}`
    };

    const { clientSecret, paymentIntentId } = await createPaymentIntent(amount, metadata);
    
    res.status(200).json({ 
      success: true,
      clientSecret,
      paymentIntentId,
      doctorId: doctor._id,
      date,
      time
    });
    
  } catch (error) {
    console.error("Payment initiation error details:", {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Payment initiation failed",
      details: error.message 
    });
  }
};
// Updated bookappointment function to verify payment first
const bookappointment = async (req, res) => {
  try {
    const { doctorId, date, time, doctorname } = req.body;
    const userId = req.userId;

    // Function to find next available slot
    const findAvailableSlot = async (baseTime, maxAttempts = 12) => { // 12 attempts = 1 hour
      let currentTime = new Date(`1970-01-01T${baseTime}:00`);
      
      for (let i = 0; i < maxAttempts; i++) {
        const timeString = currentTime.toTimeString().substring(0, 5);
        
        const existingAppointment = await Appointment.findOne({
          doctorId,
          date,
          time: timeString,
          status: { $ne: 'Cancelled' }
        });

        if (!existingAppointment) {
          return {
            available: true,
            time: timeString,
            attempts: i
          };
        }

        // Try next 5-minute slot
        currentTime.setMinutes(currentTime.getMinutes() + 5);
      }

      return {
        available: false,
        lastChecked: currentTime.toTimeString().substring(0, 5)
      };
    };

    // Find available slot
    const slotResult = await findAvailableSlot(time);
    
    if (!slotResult.available) {
      return res.status(400).send(`No available slots found between ${time} and ${slotResult.lastChecked}`);
    }

    const appointmentTime = slotResult.time;
    const isAlternativeSlot = slotResult.attempts > 0;

    // Process payment (in real app, this would be before reservation)
    const payment = new Payment({
      transactionId: req.body.paymentIntentId,
      amount: req.body.amount,
      doctorId,
      userId,
      status: "completed",
      date,
      time: appointmentTime
    });
    await payment.save();

    // Create appointment
    const appointment = new Appointment({
      date,
      time: appointmentTime,
      doctorId,
      userId,
      // paymentId: payment._id
    });

    // Create notifications
    const user = await User.findById(userId);
    let notificationContent;
    
    if (isAlternativeSlot) {
      const minutesDiff = slotResult.attempts * 5;
      notificationContent = `You booked an appointment with Dr. ${doctorname} for ${date} ${appointmentTime} ` +
                           `(originally requested ${time}, moved by ${minutesDiff} minutes)`;
    } else {
      notificationContent = `You booked an appointment with Dr. ${doctorname} for ${date} ${appointmentTime}`;
    }

    const usernotification = new Notification({
      userId,
      content: notificationContent
    });

    const doctornotification = new Notification({
      userId: doctorId,
      content: `You have an appointment with ${user.firstname} ${user.lastname} on ${date} at ${appointmentTime}`
    });

    await Promise.all([
      appointment.save(),
      usernotification.save(),
      doctornotification.save()
    ]);

    return res.status(201).send({
      ...appointment.toObject(),
      isAlternativeSlot,
      originalRequestedTime: isAlternativeSlot ? time : undefined,
      timeAdjustmentMinutes: isAlternativeSlot ? slotResult.attempts * 5 : 0
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).send("Unable to book appointment");
  }
};


const bookByReceptionist = async (req, res) => {
  try {
    const firstname = req.body.firstname || req.body.patientDetails?.firstname;
    const lastname = req.body.lastname || req.body.patientDetails?.lastname;
    const email = req.body.email || req.body.patientDetails?.email;
    const password = req.body.password || req.body.patientDetails?.password;
    const { doctorId, doctorname, date, time } = req.body;

    if (!firstname || !lastname || !email || !password || !date || !time || !doctorId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    // Function to find next available slot (same as in patient booking)
    const findAvailableSlot = async (baseTime, maxAttempts = 12) => {
      let currentTime = new Date(`1970-01-01T${baseTime}:00`);
      
      for (let i = 0; i < maxAttempts; i++) {
        const timeString = currentTime.toTimeString().substring(0, 5);
        
        const existingAppointment = await Appointment.findOne({
          doctorId,
          date,
          time: timeString,
          status: { $ne: 'Cancelled' }
        });

        if (!existingAppointment) {
          return {
            available: true,
            time: timeString,
            attempts: i
          };
        }

        currentTime.setMinutes(currentTime.getMinutes() + 5);
      }

      return {
        available: false,
        lastChecked: currentTime.toTimeString().substring(0, 5)
      };
    };

    // Find available slot
    const slotResult = await findAvailableSlot(time);
    
    if (!slotResult.available) {
      return res.status(400).json({
        success: false,
        message: `No available slots found between ${time} and ${slotResult.lastChecked}`
      });
    }

    const appointmentTime = slotResult.time;
    const isAlternativeSlot = slotResult.attempts > 0;

    // Handle patient creation/retrieval
    const existingPatient = await User.findOne({ email });
    let patient;

    if (existingPatient) {
      patient = existingPatient;
    } else {
      const hashedPass = await bcrypt.hash(password, 10);
      patient = new User({
        firstname,
        lastname,
        email,
        password: hashedPass,
      });
      await patient.save();
    }

    // Create appointment
    const appointment = new Appointment({
      date,
      time: appointmentTime,
      doctorId,
      userId: patient._id,
    });

    // Create notifications with appropriate messages
    let patientNotificationContent;
    let doctorNotificationContent;
    
    if (isAlternativeSlot) {
      const minutesDiff = slotResult.attempts * 5;
      patientNotificationContent = `You have an appointment with Dr. ${doctorname} on ${date} at ${appointmentTime} ` +
                                 `(originally requested ${time}, moved by ${minutesDiff} minutes)`;
      doctorNotificationContent = `You have an appointment with ${firstname} ${lastname} on ${date} at ${appointmentTime} ` +
                                `(originally requested ${time}, moved by ${minutesDiff} minutes)`;
    } else {
      patientNotificationContent = `You have an appointment with Dr. ${doctorname} on ${date} at ${appointmentTime}`;
      doctorNotificationContent = `You have an appointment with ${firstname} ${lastname} on ${date} at ${appointmentTime}`;
    }

    const patientNotification = new Notification({
      userId: patient._id,
      content: patientNotificationContent,
    });

    const doctorNotification = new Notification({
      userId: doctorId,
      content: doctorNotificationContent,
    });

    await Promise.all([
      appointment.save(),
      patientNotification.save(),
      doctorNotification.save(),
    ]);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: {
        ...appointment.toObject(),
        isAlternativeSlot,
        originalRequestedTime: isAlternativeSlot ? time : undefined,
        timeAdjustmentMinutes: isAlternativeSlot ? slotResult.attempts * 5 : 0
      },
    });
  } catch (error) {
    console.error("Error in bookByReceptionist:", error);
    return res.status(500).json({
      success: false,
      message: "Error booking appointment",
      error: error.message,
    });
  }
};

const completed = async (req, res) => {
  try {
    const alreadyFound = await Appointment.findOneAndUpdate(
      { _id: req.body.appointid },
      { status: "Completed" }
    );
    const { userId } = req.user;
    
    const usernotification = Notification({
      userId: userId,
      content: `Your appointment with ${req.body.doctorname} has been completed`,
    });

    const user = await User.findById(userId);
    const doctornotification = Notification({
      userId: req.body.doctorId,
      content: `Your appointment with ${user.firstname} ${user.lastname} has been completed`,
    });

    await Promise.all([
      usernotification.save(),
      doctornotification.save()
    ]);

    return res.status(201).send("Appointment completed");
  } catch (error) {
    res.status(500).send("Unable to complete appointment");
  }
};

const getAllAppointmentsForSuperAdmin = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId', 'firstname lastname')
      .populate('userId', 'firstname lastname')
      .sort({ createdAt: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Update payment status in your database
    await Payment.findOneAndUpdate(
      { transactionId: paymentIntent.id },
      { status: 'completed' }
    );
  }

  res.json({ received: true });
};


module.exports = {
  getallappointments,
  getappointments,
  bookappointment,
  bookByReceptionist,
  completed,
  getAllAppointmentsForSuperAdmin,
  initiateStripePayment,
  handleStripeWebhook
};