import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "./Loading";
import { setLoading } from "../redux/reducers/rootSlice";
import { useDispatch, useSelector } from "react-redux";
import Empty from "./Empty";
import fetchData from "../helper/apiCall";
import { useNavigate } from "react-router-dom";
import "../styles/user.css";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.root);

  const getAllDoctors = async () => {
    try {
      dispatch(setLoading(true));
      console.log("Fetching doctors..."); // Logging: Fetching started
      const response = await fetchData(`/doctor/getallmydoctors`);
      console.log("Doctors fetched successfully:", response); // Logging: Success response
  
      // Extract the `data` array from the response
      if (response.success && response.data) {
        setDoctors(response.data);
      } else {
        console.error("No data found in the response");
        toast.error("No doctors found");
      }
  
      dispatch(setLoading(false));
    } catch (error) {
      console.error("Error fetching doctors:", error); // Logging: Error response
      toast.error("Failed to fetch doctors");
      dispatch(setLoading(false));
    }
  };

  const deleteDoctor = async (doctorId) => {
    try {
      const confirm = window.confirm("Are you sure you want to delete this doctor?");
      if (confirm) {
        console.log("Deleting doctor with ID:", doctorId); // Logging: Delete action started
        await toast.promise(
          axios.delete(`/doctor/deletedoctor/${doctorId}`, {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          {
            pending: "Deleting doctor...",
            success: "Doctor deleted successfully",
            error: "Failed to delete doctor",
          }
        );
        console.log("Doctor deleted successfully:", doctorId); // Logging: Delete success
        getAllDoctors();
      }
    } catch (error) {
      console.error("Error deleting doctor:", error); // Logging: Delete error
      toast.error("Failed to delete doctor");
    }
  };
  // Function to format availability
  const formatAvailability = (availability) => {
    if (!availability) return "N/A";
  
    const availableDays = Object.keys(availability).filter(
      (day) => availability[day]?.isAvailable
    );
  
    if (availableDays.length === 0) return "N/A";
  
    const formattedAvailability = availableDays.map((day) => {
      const { startTime, endTime } = availability[day];
      return `${day} (${startTime} - ${endTime})`;
    });
  
    return formattedAvailability.join(", ");
  };
  useEffect(() => {
    getAllDoctors();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">All Doctors</h3>
          {/* <div className="add-doctor-button-container" style={{ marginBottom: "20px" }}>
            <button 
              className="btn"
              onClick={() => navigate("/admin/add-doctor")}
              style={{
                backgroundColor: "#1F51FF",
                color: "white",
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Add New Doctor
            </button>
          </div> */}
          {doctors.length > 0 ? (
            <div className="user-container">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Pic</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Mobile No.</th>
                    <th>Experience</th>
                    <th>Specialization</th>
                    <th>Fees</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors?.map((ele, i) => {
                    return (
                      <tr key={ele?._id}>
                        <td>{i + 1}</td>
                        <td>
                          <img
                            className="user-table-pic"
                            src={ele?.userId?.pic}
                            alt={ele?.userId?.firstname}
                          />
                        </td>
                        <td>{ele?.userId?.firstname}</td>
                        <td>{ele?.userId?.lastname}</td>
                        <td>{ele?.userId?.email}</td>
                        <td>{ele?.userId?.mobile || "N/A"}</td>
                        <td>{ele?.experience}</td>
                        <td>{ele?.specialization}</td>
                        <td>{ele?.feePerConsultation}</td>
                        <td>{formatAvailability(ele?.availability)}</td>
                        <td className="action-buttons">
                          <button
                            className="admin-edit"
                            style={{ marginRight: "10px" }}
                            onClick={() => navigate(`/admin/update-doctor/${ele?._id}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-delete"
                            onClick={() => deleteDoctor(ele?._id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </section>
      )}
    </>
  );
};

export default AdminDoctors;