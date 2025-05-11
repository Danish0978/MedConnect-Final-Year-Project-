const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true, // Add clinicId as a required field
    },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    diagnosis: { type: String, required: true },
    notes: { type: String },
    cnic: { type: String, required: true },
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", schema);
module.exports = Prescription;