import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/update-receptionist.css";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const EditPharmacyReceptionist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    mobile: "",
    age: "",
    gender: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceptionistDetails = async () => {
      try {
        const response = await axios.get(
          `/pharmacyReceptionist/receptionist/${id}`,
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          const receptionistData = response.data.data;
          setFormData({
            firstname: receptionistData.userId?.firstname || "",
            lastname: receptionistData.userId?.lastname || "",
            email: receptionistData.userId?.email || "",
            mobile: receptionistData.userId?.mobile || "",
            age: receptionistData.userId?.age || "",
            gender: receptionistData.userId?.gender || "",
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching receptionist details");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionistDetails();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `/pharmacyReceptionist/update/${id}`,
        formData,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Pharmacy receptionist updated successfully");
        navigate("/pharmacy/dashboard/receptionists");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating receptionist");
      console.error("Update error:", error);
    }
  };

  return (
    <div className="update-receptionist-container">
      <h2>Update Pharmacy Receptionist</h2>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
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
              disabled // Email shouldn't be editable typically
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
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="18"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn update-btn">
              Update Receptionist
            </button>
            {/* <button 
              type="button" 
              className="btn cancel-btn"
              onClick={() => navigate("/pharmacy/dashboard/receptionists")}
            >
              Cancel
            </button> */}
          </div>
        </form>
      )}
    </div>
  );
};

export default EditPharmacyReceptionist;