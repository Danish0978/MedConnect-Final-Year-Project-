import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/register.css";

const AddPrescriptionPage = () => {
  const location = useLocation();
  const { appointmentId, patientId, doctorId } = location.state; // Get data from route state
  const navigate = useNavigate(); // Initialize useNavigate

  const [formDetails, setFormDetails] = useState({
    medicines: [{ name: "", dosage: "", duration: "" }],
    diagnosis: "",
    notes: "",
    cnic: "", // Add CNIC field
  });

  // Handle changes in medicine fields
  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...formDetails.medicines];
    newMedicines[index][field] = value;
    setFormDetails({ ...formDetails, medicines: newMedicines });
  };

  // Add a new medicine field
  const addMedicineField = () => {
    setFormDetails({
      ...formDetails,
      medicines: [...formDetails.medicines, { name: "", dosage: "", duration: "" }],
    });
  };

  // Remove a specific medicine field
  const removeMedicineField = (index) => {
    const newMedicines = formDetails.medicines.filter((_, i) => i !== index);
    setFormDetails({ ...formDetails, medicines: newMedicines });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { medicines, diagnosis, notes, cnic } = formDetails;

      if (!medicines || !diagnosis || !cnic) {
        return toast.error("Required fields cannot be empty");
      }

      await axios.post(
        "/prescription/add-prescription",
        {
          doctorId,
          patientId,
          appointmentId,
          medicines,
          diagnosis,
          notes,
          cnic, // Include CNIC field
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Prescription added successfully");
      navigate("/appointments"); // Navigate back to appointments page
    } catch (error) {
      toast.error("Error adding prescription");
    }
  };

  return (
    <section className="register-section flex-center">
      <div className="register-container flex-center">
        <h2 className="form-heading">Add Prescription</h2>
        <form onSubmit={handleSubmit} className="register-form">
          {/* CNIC Field */}
          <input
            type="text"
            placeholder="Patient CNIC"
            className="form-input"
            value={formDetails.cnic}
            onChange={(e) => setFormDetails({ ...formDetails, cnic: e.target.value })}
            required
          />

          {/* Medicine Fields */}
          {formDetails.medicines.map((medicine, index) => (
            <div key={index} className="medicine-field">
              <input
                type="text"
                placeholder="Medicine Name"
                className="form-input"
                value={medicine.name}
                onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Dosage"
                className="form-input"
                value={medicine.dosage}
                onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Duration"
                className="form-input"
                value={medicine.duration}
                onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                required
              />
              {/* Remove Medicine Button */}
              {formDetails.medicines.length > 1 && (
                <button
                  type="button"
                  className="btn remove-btn"
                  onClick={() => removeMedicineField(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {/* Add Medicine Button */}
          <button type="button" className="btn form-btn" onClick={addMedicineField}>
            Add Medicine
          </button>
          <textarea
            placeholder="Diagnosis"
            className="form-input"
            value={formDetails.diagnosis}
            onChange={(e) => setFormDetails({ ...formDetails, diagnosis: e.target.value })}
            required
          />
          <textarea
            placeholder="Notes"
            className="form-input"
            value={formDetails.notes}
            onChange={(e) => setFormDetails({ ...formDetails, notes: e.target.value })}
          />
          <button type="submit" className="btn form-btn">
            Submit Prescription
          </button>
        </form>
      </div>
    </section>
  );
};

export default AddPrescriptionPage;