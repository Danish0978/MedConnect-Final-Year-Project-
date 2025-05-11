const mongoose = require("mongoose");

const pharmacyReceptionistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Auto-approve for pharmacy admins
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PharmacyReceptionist", pharmacyReceptionistSchema);