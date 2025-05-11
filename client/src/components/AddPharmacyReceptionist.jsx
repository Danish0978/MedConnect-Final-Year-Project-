import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "../styles/add-receptionist.css";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const AddPharmacyReceptionist = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "/pharmacyReceptionist/add-receptionist",
        formData,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Pharmacy receptionist added successfully");
        navigate("/pharmacy/dashboard/receptionists");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error adding pharmacy receptionist"
      );
      console.error("Add error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-receptionist-container">
      <h2>Add New Pharmacy Receptionist</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            required
            minLength={2}
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
            minLength={2}
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
            minLength={5}
          />
        </div>
        <div className="form-group">
          <label>Mobile Number</label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            pattern="[0-9]{10}"
            title="10 digit phone number"
          />
        </div>
        <button 
          type="submit" 
          className="btn"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Pharmacy Receptionist"}
        </button>
      </form>
    </div>
  );
};

export default AddPharmacyReceptionist;