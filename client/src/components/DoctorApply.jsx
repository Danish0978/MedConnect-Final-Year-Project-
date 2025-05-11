import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "./Loading";
import "../styles/doctorapply.css";

const DoctorApply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [formDetails, setFormDetails] = useState({
    specialization: "",
    experience: 0, // Experience as a number
    feePerConsultation: 0,
    clinicId: "", // Will store the clinic ID
    clinicName: "", // Will store the clinic name for display
    availability: {
      monday: { isAvailable: false, startTime: "", endTime: "" },
      tuesday: { isAvailable: false, startTime: "", endTime: "" },
      wednesday: { isAvailable: false, startTime: "", endTime: "" },
      thursday: { isAvailable: false, startTime: "", endTime: "" },
      friday: { isAvailable: false, startTime: "", endTime: "" },
      saturday: { isAvailable: false, startTime: "", endTime: "" },
      sunday: { isAvailable: false, startTime: "", endTime: "" },
    },
    timings: [9, 18], // Default timings
  });

  // Fetch available clinics
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await axios.get("/clinic/all", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Check if the response contains the expected data
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setClinics(response.data.data); // Set clinics from response.data.data
        } else {
          console.error("Invalid response structure:", response.data);
          toast.error("Failed to fetch clinics: Invalid response structure");
        }
      } catch (error) {
        console.error("Error fetching clinics:", error);
        toast.error("Failed to fetch clinics");
      }
    };

    fetchClinics();
  }, []);

  // Handle input changes for text, number, and select fields
  const inputChange = (e) => {
    const { name, value } = e.target;
    setFormDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle clinic selection by name and store the corresponding ID
  const handleClinicSelection = (e) => {
    const selectedClinicName = e.target.value;
    const selectedClinic = clinics.find((clinic) => clinic.name === selectedClinicName);

    if (selectedClinic) {
      setFormDetails((prev) => ({
        ...prev,
        clinicId: selectedClinic._id, // Store the clinic ID
        clinicName: selectedClinic.name, // Store the clinic name for display
      }));
    } else {
      setFormDetails((prev) => ({
        ...prev,
        clinicId: "",
        clinicName: "",
      }));
    }
  };

  // Handle changes for availability (checkboxes and time inputs)
  const handleAvailabilityChange = (day, field, value) => {
    setFormDetails((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: field === "isAvailable" ? value.target.checked : value,
        },
      },
    }));
  };

  // Handle form submission
  const formSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const { specialization, experience, feePerConsultation, clinicId, availability, timings } = formDetails;
      if (!specialization || !experience || !feePerConsultation || !clinicId || !timings) {
        toast.error("All fields are required");
        return;
      }

      // Validate availability timings
      const isValidAvailability = Object.values(availability).every((day) => {
        if (day.isAvailable) {
          return day.startTime && day.endTime;
        }
        return true;
      });

      if (!isValidAvailability) {
        toast.error("Please provide valid timings for available days");
        return;
      }

      // Submit the form data
      const res = await axios.post(
        "/doctor/register",
        {
          ...formDetails,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/"); // Redirect to home page after successful submission
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="apply-doctor-section flex-center">
  <div className="apply-doctor-container flex-center">
    <h2 className="form-heading">Apply as a Doctor</h2>
    <form onSubmit={formSubmit} className="register-form">
      {/* Clinic Selection */}
      <div className="form-group">
        <label>Select Clinic</label>
        <select
          name="clinicName"
          value={formDetails.clinicName}
          onChange={handleClinicSelection}
          className="form-input"
          required
        >
          <option value="">Select a clinic</option>
          {clinics.map((clinic) => (
            <option key={clinic._id} value={clinic.name}>
              {clinic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Professional Information */}
      <div className="form-group">
        <label>Specialization</label>
        <input
          type="text"
          name="specialization"
          className="form-input"
          placeholder="Enter your specialization"
          value={formDetails.specialization}
          onChange={inputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Experience (years)</label>
        <input
          type="number"
          name="experience"
          className="form-input"
          placeholder="Enter your experience in years"
          value={formDetails.experience}
          onChange={inputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Fee per Consultation</label>
        <input
          type="number"
          name="feePerConsultation"
          className="form-input"
          placeholder="Enter your fee per consultation"
          value={formDetails.feePerConsultation}
          onChange={inputChange}
          required
        />
      </div>

      {/* Availability Section */}
      <div className="availability-section">
        <h3>Availability</h3>
        {Object.entries(formDetails.availability).map(([day, value]) => (
          <div key={day} className="day-availability">
            <div className="day-header">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={value.isAvailable}
                onChange={(e) => handleAvailabilityChange(day, "isAvailable", e)}
              />
              <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
            </div>
            {value.isAvailable && (
              <div className="time-inputs">
                <input
                  type="time"
                  className="form-input"
                  value={value.startTime}
                  onChange={(e) => handleAvailabilityChange(day, "startTime", e.target.value)}
                  required={value.isAvailable}
                />
                <span>to</span>
                <input
                  type="time"
                  className="form-input"
                  value={value.endTime}
                  onChange={(e) => handleAvailabilityChange(day, "endTime", e.target.value)}
                  required={value.isAvailable}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button type="submit" className="btn form-btn" disabled={loading}>
        {loading ? <Loading /> : "Apply"}
      </button>
    </form>
  </div>
</section>
  );
};

export default DoctorApply;