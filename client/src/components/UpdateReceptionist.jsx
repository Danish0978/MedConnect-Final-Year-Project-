import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/update-receptionist.css";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const UpdateReceptionist = () => {
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

  const [loading, setLoading] = useState(true); // Show loader until data is fetched

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const receptionistResponse = await axios.get(
          `/receptionist/get-receptionist/${id}`,
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (receptionistResponse.data.success) {
          const userData = receptionistResponse.data.data;

          setFormData({
            firstname: userData.firstname || "",
            lastname: userData.lastname || "",
            email: userData.email || "",
            mobile: userData.mobile || "",
            age: userData.age || "",
            gender: userData.gender || "",
          });

          setLoading(false);
        }
      } catch (error) {
        toast.error("Error fetching user details");
        console.error(error);
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `/receptionist/update-receptionist/${id}`,
        formData,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Receptionist details updated successfully");
        navigate("/dashboard/receptionists");
      }
    } catch (error) {
      toast.error("Error updating receptionist");
      console.error(error);
    }
  };

  return (
    <div className="update-receptionist-container">
      <h2>Update Receptionist</h2>

      {loading ? (
        <p>Loading...</p>
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
            <label>Mobile Number</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="btn">
            Update Receptionist
          </button>
        </form>
      )}
    </div>
  );
};

export default UpdateReceptionist;
