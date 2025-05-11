const express = require("express");
const auth = require("../middleware/auth");
const feedbackController = require("../controllers/feedbackController");

const feedbackRouter = express.Router();

// Submit feedback (patient only)
feedbackRouter.post(
  "/submit",
  auth,
  feedbackController.submitFeedback
);

// Get feedback for appointment
feedbackRouter.get(
  "/appointment/:appointmentId",
  auth,
  feedbackController.getAppointmentFeedback
);

// Get feedback for order
feedbackRouter.get(
  "/order/:orderId",
  auth,
  feedbackController.getOrderFeedback
);

// Get doctor's feedback
feedbackRouter.get(
  "/doctor/:doctorId",
  feedbackController.getDoctorFeedback
);

// Get pharmacy's feedback
feedbackRouter.get(
  "/pharmacy/:pharmacyId",
  feedbackController.getPharmacyFeedback
);

// Check if feedback exists for appointment
feedbackRouter.get(
  "/exists/appointment/:appointmentId",
  auth,
  feedbackController.checkAppointmentFeedbackExists
);

// Check if feedback exists for order
feedbackRouter.get(
  "/exists/order/:orderId",
  auth,
  feedbackController.checkOrderFeedbackExists
);

module.exports = feedbackRouter;