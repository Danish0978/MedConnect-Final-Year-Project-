import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "./Loading";
import { setLoading } from "../redux/reducers/rootSlice";
import { useDispatch, useSelector } from "react-redux";
import Empty from "./Empty";
import fetchData from "../helper/apiCall";
import "../styles/user.css";
import jwt_decode from "jwt-decode";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);
 const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("token")
      ? jwt_decode(localStorage.getItem("token"))
      : ""
  );

  const getAllAppointments = async () => {
    try {
      dispatch(setLoading(true));
      const token = localStorage.getItem("token"); // Get the auth token
      
      // Use different endpoint for super admin
      const endpoint = user?.isSuperAdmin 
        ? "/appointment/superadmin/all" 
        : "/appointment/getallappointments";
      
      const temp = await fetchData(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`, // Add authorization header
        },
      });
      
      setAppointments(temp);
      dispatch(setLoading(false));
    } catch (error) {
      toast.error("Failed to fetch appointments");
      console.error("Fetch error:", error);
      dispatch(setLoading(false));
    }
  };
  const completeAppointment = async (appointment) => {
    try {
      await toast.promise(
        axios.put(
          "/appointment/completed",
          {
            appointid: appointment?._id,
            doctorId: appointment?.doctorId._id,
            doctorname: `${appointment?.userId?.firstname} ${appointment?.userId?.lastname}`,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        {
          success: "Appointment marked as completed",
          error: "Failed to complete appointment",
          loading: "Updating appointment...",
        }
      );
      getAllAppointments();
    } catch (error) {
      console.error("Completion error:", error);
    }
  };

  useEffect(() => {
    getAllAppointments();
  }, [user?.isSuperAdmin]); // Re-fetch when user role changes

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">
            {user?.isSuperAdmin ? "All Appointments" : "Clinic Appointments"}
          </h3>
          
          {appointments.length > 0 ? (
            <div className="user-container">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    {/* {user?.isSuperAdmin && <th>Clinic</th>} */}
                    <th>Doctor</th>
                    <th>Patient</th>
                    <th>Appointment Date</th>
                    <th>Time</th>
                    <th>Booked On</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => (
                    <tr key={appointment._id}>
                      <td>{index + 1}</td>
                      {/* {user?.isSuperAdmin && (
                        <td>
                          {appointment?.clinicId?.name || "No Clinic"}
                        </td>
                      )} */}
                      <td>
                        {appointment?.doctorId?.firstname} {appointment?.doctorId?.lastname}
                      </td>
                      <td>
                        {appointment?.userId?.firstname} {appointment?.userId?.lastname}
                      </td>
                      <td>{new Date(appointment.date).toLocaleDateString()}</td>
                      <td>{appointment.time}</td>
                      <td>{new Date(appointment.createdAt).toLocaleString()}</td>
                      <td>{appointment.status}</td>
                      <td>
                        <button
                          className={`btn ${appointment.status === "Completed" ? "disable-btn" : "accept-btn"}`}
                          disabled={appointment.status === "Completed"}
                          onClick={() => completeAppointment(appointment)}
                        >
                          {appointment.status === "Completed" ? "Completed" : "Complete"}
                        </button>
                      </td>
                    </tr>
                  ))}
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

export default AdminAppointments;