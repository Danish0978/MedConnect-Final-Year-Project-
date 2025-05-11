const express = require("express");
const router = express.Router();
const {
  initiateStripePayment,
  bookappointment
} = require("../controllers/appointmentController");
const {
  getAllTransactions
} = require("../controllers/paymentController");
const auth = require("../middleware/auth");

// Stripe Payment Routes
router.post("/create-payment-intent", auth, initiateStripePayment);
router.post("/confirm-payment", auth, bookappointment);

// Webhook Route (no auth needed)
router.post("/webhook", express.raw({ type: 'application/json' }), require("../controllers/appointmentController").handleStripeWebhook);

router.get("/transactions", auth, getAllTransactions);


module.exports = router;