import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/register.css";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const UpdateUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formDetails, setFormDetails] = useState({
    firstname: "",
    lastname: "",
    email: "",
    mobile: "",
    age: "",
    gender: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/user/getuserbyid/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const user = response.data;
        setFormDetails({
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          email: user.email || "",
          mobile: user.mobile || "",
          age: user.age || "",
          gender: user.gender || "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Error fetching user details");
      }
    };
    fetchUser();
  }, [id]);

  const inputChange = (e) => {
    const { name, value } = e.target;
    setFormDetails({
      ...formDetails,
      [name]: value,
    });
  };

  const formSubmit = async (e) => {
    e.preventDefault();
    try {
      await toast.promise(
        axios.put(
          `/user/updateuser/${id}`,
          formDetails,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        {
          loading: "Updating user...",
          success: "User updated successfully",
          error: "Failed to update user",
        }
      );
      navigate("/dashboard/users");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="register-section flex-center">
      <div className="register-form-container">
        <h2 className="form-heading">Update User</h2>
        <form className="register-form" onSubmit={formSubmit}>
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
            placeholder="Email"
            value={formDetails.email}
            onChange={inputChange}
            required
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
            type="number"
            name="age"
            className="form-input"
            placeholder="Age"
            value={formDetails.age}
            onChange={inputChange}
          />
          <select
            name="gender"
            className="form-input"
            value={formDetails.gender}
            onChange={inputChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="btn form-btn">
            Update User
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateUser;
