const mongoose = require("mongoose");

const clinicSchema = mongoose.Schema(
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

const Clinic = mongoose.model("Clinic", clinicSchema);
module.exports = Clinic;
