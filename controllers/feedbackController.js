const Feedback = require("../models/feedbackModel");
const Appointment = require("../models/appointmentModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

const submitFeedback = async (req, res) => {
    try {
      const { userId } = req.user;
      const { type, entityId, appointmentId, orderId, rating, comment } = req.body;
  
      // Validate required fields
      if (!type || !rating) {
        return res.status(400).send("Type and rating are required");
      }
  
      // Validate entity type
      if (!['doctor', 'pharmacy'].includes(type)) {
        return res.status(400).send("Invalid type. Must be 'doctor' or 'pharmacy'");
      }
  
      // Validate reference ID based on type
      if (type === 'doctor' && !appointmentId) {
        return res.status(400).send("Appointment ID is required for doctor feedback");
      }
      
      if (type === 'pharmacy' && !orderId) {
        return res.status(400).send("Order ID is required for pharmacy feedback");
      }
  
      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).send("Rating must be between 1 and 5");
      }
  
      // Check if feedback already exists
      const query = {
        patient: userId,
        [type === 'doctor' ? 'appointment' : 'order']: type === 'doctor' ? appointmentId : orderId
      };
  
      const existingFeedback = await Feedback.findOne(query);
      if (existingFeedback) {
        return res.status(400).send("Feedback already submitted");
      }
  
      // Create new feedback
      const feedbackData = {
        patient: userId,
        [type]: entityId,
        rating,
        comment
      };
  
      if (type === 'doctor') {
        feedbackData.appointment = appointmentId;
      } else {
        feedbackData.order = orderId;
      }
  
      const feedback = new Feedback(feedbackData);
      await feedback.save();
  
      // Update appointment/order with feedback status
      if (type === 'doctor') {
        await Appointment.findByIdAndUpdate(appointmentId, { hasFeedback: true });
      } else {
        await Order.findByIdAndUpdate(orderId, { hasFeedback: true });
      }
  
      return res.status(201).json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Unable to submit feedback");
    }
  };

const getAppointmentFeedback = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const feedback = await Feedback.findOne({ appointment: appointmentId })
      .populate("patient", "firstname lastname");

    if (!feedback) {
      return res.status(404).send("No feedback found for this appointment");
    }

    return res.send(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to get appointment feedback");
  }
};

const getOrderFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const feedback = await Feedback.findOne({ order: orderId })
      .populate("patient", "firstname lastname");

    if (!feedback) {
      return res.status(404).send("No feedback found for this order");
    }

    return res.send(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to get order feedback");
  }
};

const getDoctorFeedback = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const feedbacks = await Feedback.find({ doctor: doctorId })
      .populate("patient", "firstname lastname")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length
      : 0;

    return res.send({
      feedbacks,
      averageRating: averageRating.toFixed(1),
      totalFeedbacks: feedbacks.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to get doctor feedback");
  }
};

const getPharmacyFeedback = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const feedbacks = await Feedback.find({ pharmacy: pharmacyId })
      .populate("patient", "firstname lastname")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length
      : 0;

    return res.send({
      feedbacks,
      averageRating: averageRating.toFixed(1),
      totalFeedbacks: feedbacks.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to get pharmacy feedback");
  }
};

const checkAppointmentFeedbackExists = async (req, res) => {
  try {
    const { userId } = req.user;
    const { appointmentId } = req.params;

    const feedback = await Feedback.findOne({
      patient: userId,
      appointment: appointmentId
    });

    return res.send({ exists: !!feedback });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to check feedback existence");
  }
};

const checkOrderFeedbackExists = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;

    const feedback = await Feedback.findOne({
      patient: userId,
      order: orderId
    });

    return res.send({ exists: !!feedback });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to check feedback existence");
  }
};

module.exports = {
  submitFeedback,
  getAppointmentFeedback,
  getOrderFeedback,
  getDoctorFeedback,
  getPharmacyFeedback,
  checkAppointmentFeedbackExists,
  checkOrderFeedbackExists
};