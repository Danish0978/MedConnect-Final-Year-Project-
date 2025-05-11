// RegisterClinic.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

function RegisterClinic() {
  const [formDetails, setFormDetails] = useState({
    name: "",
    address: "",
    contact: {
      phone: "",
      email: ""
    }
  });
  const navigate = useNavigate();
  const inputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "email") {
      setFormDetails({
        ...formDetails,
        contact: {
          ...formDetails.contact,
          [name]: value
        }
      });
    } else {
      setFormDetails({
        ...formDetails,
        [name]: value,
      });
    }
  };

  const formSubmit = async (e) => {
    try {
      e.preventDefault();
      const { name, address, contact } = formDetails;
      
      if (!name || !address || !contact.phone || !contact.email) {
        return toast.error("All fields are required");
      }
  
      const token = localStorage.getItem("token");
      const decoded = jwt_decode(token);
      const userId = decoded.id;
  
      const { data } = await toast.promise(
        axios.post(
          "/clinic/create",
          {
            ...formDetails,
            userId // Add userId to the request
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        ),
        {
          pending: "Creating clinic...",
          success: "Clinic registered successfully",
          error: "Unable to register clinic",
        }
        
      );
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };
  return (
    <section className="apply-doctor-section flex-center">
      <div className="apply-doctor-container flex-center">
        <h2 className="form-heading">Register Your Clinic</h2>
        <form onSubmit={formSubmit} className="register-form">
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="Clinic Name"
            value={formDetails.name}
            onChange={inputChange}
          />
          <input
            type="text"
            name="address"
            className="form-input"
            placeholder="Clinic Address"
            value={formDetails.address}
            onChange={inputChange}
          />
          <input
            type="text"
            name="phone"
            className="form-input"
            placeholder="Contact Number"
            value={formDetails.contact.phone}
            onChange={inputChange}
          />
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Contact Email"
            value={formDetails.contact.email}
            onChange={inputChange}
          />
          <button type="submit" className="btn form-btn">
            Register Clinic
          </button>
        </form>
      </div>
    </section>
  );
}

export default RegisterClinic;