const mongoose = require("mongoose");

const pharmacySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    contact: {
      phone: String,
      email: String,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    adminId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    }
  },
  {
    timestamps: true,
  }
);

const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
module.exports = Pharmacy;