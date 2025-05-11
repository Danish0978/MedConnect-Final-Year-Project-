import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import "../styles/adminaddDoctor.css";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

function AdminAddDoctor() {
  const [formDetails, setFormDetails] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    mobile: "",
    specialization: "",
    experience: "",
    feePerConsultation: "",
    availability: {
      monday: { isAvailable: false, startTime: "", endTime: "" },
      tuesday: { isAvailable: false, startTime: "", endTime: "" },
      wednesday: { isAvailable: false, startTime: "", endTime: "" },
      thursday: { isAvailable: false, startTime: "", endTime: "" },
      friday: { isAvailable: false, startTime: "", endTime: "" },
      saturday: { isAvailable: false, startTime: "", endTime: "" },
      sunday: { isAvailable: false, startTime: "", endTime: "" },
    },
    timings: [9,18],
  });

  const navigate = useNavigate();

  const inputChange = (e) => {
    const { name, value } = e.target;
    return setFormDetails({
      ...formDetails,
      [name]: value,
    });
  };

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

  const formSubmit = async (e) => {
    try {
      e.preventDefault();
      const { firstname, lastname, email, password, mobile, specialization, experience, feePerConsultation,  availability, timings } = formDetails;

      if (!firstname || !lastname || !email || !password || !specialization || !experience || !feePerConsultation || !availability || !timings) {
        return toast.error("Required fields cannot be empty");
      }

      await toast.promise(
        axios.post(
          "/doctor/admin/add-doctor",
          formDetails,
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        {
          pending: "Adding doctor...",
          success: "Doctor added successfully",
          error: "Unable to add doctor",
          loading: "Adding doctor...",
        }
      );
      
      // Redirect to doctors page after successful addition
      navigate("/dashboard/doctors");
    } catch (error) {
      return error;
    }
  };

  return (
    <section className="apply-doctor-section flex-center">
      <div className="apply-doctor-container flex-center">
        <h2 className="form-heading">Add New Doctor</h2>
        <form onSubmit={formSubmit} className="register-form">
          <input
            type="text"
            name="firstname"
            className="form-input"
            placeholder="First Name"
            value={formDetails.firstname}
            onChange={inputChange}
            required
          />
          <input
            type="text"
            name="lastname"
            className="form-input"
            placeholder="Last Name"
            value={formDetails.lastname}
            onChange={inputChange}
            required
          />
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Email Address"
            value={formDetails.email}
            onChange={inputChange}
            required
          />
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="Password"
            value={formDetails.password}
            onChange={inputChange}
            required
          />
          <input
            type="tel"
            name="mobile"
            className="form-input"
            placeholder="Phone Number (Optional)"
            value={formDetails.mobile}
            onChange={inputChange}
          />
          <input
            type="text"
            name="specialization"
            className="form-input"
            placeholder="Specialization"
            value={formDetails.specialization}
            onChange={inputChange}
            required
          />
          <input
            type="number"
            name="experience"
            className="form-input"
            placeholder="Experience (in years)"
            value={formDetails.experience}
            onChange={inputChange}
            required
          />
          <input
            type="number"
            name="feePerConsultation"
            className="form-input"
            placeholder="Consultation Fees (in rupees)"
            value={formDetails.feePerConsultation}
            onChange={inputChange}
            required
          />
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
          <button type="submit" className="btn form-btn">
            Add Doctor
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminAddDoctor;