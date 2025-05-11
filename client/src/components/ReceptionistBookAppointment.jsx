import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { IoMdClose } from "react-icons/io";
import "../styles/receptionistBooking.css";

const ReceptionistBookAppointment = ({ doctor, onClose }) => {
    const [formData, setFormData] = useState({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      date: "",
      time: "",
    });
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
      
        if (formData.password !== formData.confirmPassword) {
          return toast.error("Passwords don't match");
        }
      
        try {

          const doctorId = doctor?.userId?._id;
          // Build the payload exactly as backend expects
          const payload = {
            doctorId, // Ensure we get the doctor ID
            date: formData.date,
            time: formData.time,
            doctorname: `${doctor?.userId?.firstname || ''} ${doctor?.userId?.lastname || ''}`,
            // Include ALL required fields at root level
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            password: formData.password,
            // Also include patientDetails as backup
            patientDetails: {
              firstname: formData.firstname,
              lastname: formData.lastname,
              email: formData.email,
              password: formData.password
            }
          };

          const { data } = await axios.post(
            "/appointment/book-by-receptionist",
            payload,
            { 
              headers: { 
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
              } 
            }
          );
      
          toast.success("Appointment booked successfully");
          onClose();
        } catch (error) {
          console.error("Full error:", error);
          console.error("Error response:", error.response?.data);
          toast.error(error.response?.data?.message || "Booking failed. Please check all fields.");
        }
      };
  
    const handleModalClose = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };
  
    return (
      <div className="receptionist-modal-overlay" onClick={handleModalClose}>
        <div className="receptionist-booking-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Book Appointment for Patient</h2>
            <button className="close-btn" onClick={onClose}>
              <IoMdClose size={24} />
            </button>
          </div>
        <form onSubmit={handleSubmit} className="receptionist-form">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceptionistBookAppointment;