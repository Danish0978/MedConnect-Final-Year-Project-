import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/updateForms.css";
import {NavBar} from "../components/Navbar";
import {Footer} from "../components/Footer";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const UpdateDoctor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formDetails, setFormDetails] = useState({
    firstname: "",
    lastname: "",
    email: "",
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
    timings: [],
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await axios.get(`/doctor/getdoctor/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success && response.data.data) {
          const doctor = response.data.data;
          setFormDetails({
            firstname: doctor.userId?.firstname || "",
            lastname: doctor.userId?.lastname || "",
            email: doctor.userId?.email || "",
            mobile: doctor.userId?.mobile || "",
            specialization: doctor.specialization || "",
            experience: doctor.experience || "",
            feePerConsultation: doctor.feePerConsultation || "",
            availability: doctor.availability || {
              monday: { isAvailable: false, startTime: "", endTime: "" },
              tuesday: { isAvailable: false, startTime: "", endTime: "" },
              wednesday: { isAvailable: false, startTime: "", endTime: "" },
              thursday: { isAvailable: false, startTime: "", endTime: "" },
              friday: { isAvailable: false, startTime: "", endTime: "" },
              saturday: { isAvailable: false, startTime: "", endTime: "" },
              sunday: { isAvailable: false, startTime: "", endTime: "" },
            },
            timings: doctor.timings || [],
          });
        } else {
          toast.error("Failed to fetch doctor details");
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error(error.response?.data?.message || "Error fetching doctor details");
      }
    };
    fetchDoctor();
  }, [id]);

  const inputChange = (e) => {
    const { name, value } = e.target;
    setFormDetails({
      ...formDetails,
      [name]: value,
    });
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormDetails({
      ...formDetails,
      availability: {
        ...formDetails.availability,
        [day]: {
          ...formDetails.availability[day],
          [field]: value,
        },
      },
    });
  };

  const formSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `/doctor/admin/update-doctor/${id}`,
        {
          specialization: formDetails.specialization,
          experience: Number(formDetails.experience),
          feePerConsultation: Number(formDetails.feePerConsultation),
          availability: formDetails.availability,
          timings: formDetails.timings,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Doctor updated successfully");
        navigate("/dashboard/doctors");
      } else {
        toast.error(response.data.message || "Failed to update doctor");
      }
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error(error.response?.data?.message || "Failed to update doctor");
    }
  };

  const renderAvailabilityInputs = () => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    return days.map((day) => (
      <div key={day} className="availability-day">
        <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
        <label>
          <input
            type="checkbox"
            checked={formDetails.availability[day].isAvailable}
            onChange={(e) =>
              handleAvailabilityChange(day, "isAvailable", e.target.checked)
            }
          />
          Available
        </label>
        {formDetails.availability[day].isAvailable && (
          <div className="time-inputs">
            <input
              type="time"
              value={formDetails.availability[day].startTime}
              onChange={(e) =>
                handleAvailabilityChange(day, "startTime", e.target.value)
              }
            />
            <input
              type="time"
              value={formDetails.availability[day].endTime}
              onChange={(e) =>
                handleAvailabilityChange(day, "endTime", e.target.value)
              }
            />
          </div>
        )}
      </div>
    ));
  };

  return (
    
    <div className="register-section flex-center">
      <div className="register-form-container">
        <h2 className="form-heading">Update Doctor</h2>
        <form className="register-form" onSubmit={formSubmit}>
          <input
            type="text"
            name="firstname"
            className="form-input"
            placeholder="First Name"
            value={formDetails.firstname}
            disabled
          />
          <input
            type="text"
            name="lastname"
            className="form-input"
            placeholder="Last Name"
            value={formDetails.lastname}
            disabled
          />
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Email"
            value={formDetails.email}
            disabled
          />
          <input
            type="text"
            name="mobile"
            className="form-input"
            placeholder="Mobile Number"
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
            placeholder="Fee Per Consultation"
            value={formDetails.feePerConsultation}
            onChange={inputChange}
            required
          />
          <div className="availability-section">
            <h3>Availability</h3>
            {renderAvailabilityInputs()}
          </div>
          <button type="submit" className="btn form-btn">
            Update Doctor
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateDoctor;