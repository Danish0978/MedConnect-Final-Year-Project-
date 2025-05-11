const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  // Stripe Payment Intent ID
  transactionId: {
    type: String,
    required: true,
    unique: true
  },

  // Amount in PKR (or your currency)
  amount: {
    type: Number,
    required: true
  },

  // Payment status
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },

  // Doctor reference
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },

  // Patient reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Appointment date/time (redundant but useful for queries)
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },

  // Payment method details
  paymentMethod: {
    type: String,
    default: "stripe"
  },

  // Raw response from Stripe (for debugging)
  stripeResponse: {
    type: Object
  }

}, { 
  timestamps: true // Adds createdAt and updatedAt fields
});

// Indexes for faster queries
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ doctorId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", PaymentSchema);