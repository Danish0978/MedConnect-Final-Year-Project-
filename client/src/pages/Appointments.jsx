import React, { useEffect, useState } from "react";
import Empty from "../components/Empty";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import fetchData from "../helper/apiCall";
import { setLoading } from "../redux/reducers/rootSlice";
import Loading from "../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import jwt_decode from "jwt-decode";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/user.css";
import { useNavigate } from "react-router-dom";
import FeedbackModal from "../components/FeedbackModal"; // We'll create this next

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState({});
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);
  const { userId, isDoctor, isReceptionist } = jwt_decode(localStorage.getItem("token"));
  const navigate = useNavigate();

  const getAllAppoint = async () => {
    try {
      dispatch(setLoading(true));
      const temp = await fetchData(`/appointment/getappointments`);
      setAppointments(temp);
      
      // Check feedback existence for each completed appointment
      const feedbackChecks = await Promise.all(
        temp
          .filter(appt => appt.status === "Completed" && !isDoctor)
          .map(appt => 
            axios.get(`/feedback/exists/appointment/${appt._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            })
          )
      );
      
      const feedbackMap = {};
      feedbackChecks.forEach((res, index) => {
        const apptId = temp.filter(appt => appt.status === "Completed" && !isDoctor)[index]._id;
        feedbackMap[apptId] = res.data.exists;
      });
      
      setFeedbackExists(feedbackMap);
      dispatch(setLoading(false));
    } catch (error) {
      console.error(error);
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getAllAppoint();
  }, []);

  const complete = async (ele) => {
    try {
      const { data } = await toast.promise(
        axios.put(
          "/appointment/completed",
          {
            appointid: ele?._id,
            doctorId: ele?.doctorId?._id,
            doctorname: `${ele?.userId?.firstname} ${ele?.userId?.lastname}`,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        {
          success: "Appointment completed successfully",
          error: "Unable to complete appointment",
          loading: "Completing appointment...",
        }
      );

      await getAllAppoint();
    } catch (error) {
      return error;
    }
  };

  const openFeedbackModal = (appointment) => {
    setSelectedAppointment(appointment);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    await getAllAppoint(); // Refresh to update feedback status
    setFeedbackModalOpen(false);
  };

  const navigateToAddPrescription = (appointment) => {
    navigate("/add-prescription", {
      state: {
        appointmentId: appointment._id,
        patientId: appointment.userId._id,
        doctorId: appointment.doctorId._id,
      },
    });
  };

  return (
    <>
      <Navbar />
      {loading ? (
        <Loading />
      ) : (
        <section className="container notif-section">
          <h2 className="page-heading">Your Appointments</h2>

          {appointments.length > 0 ? (
            <div className="appointments-container">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Doctor</th>
                    <th>Patient</th>
                    <th>Appointment Date</th>
                    <th>Appointment Time</th>
                    <th>Booking Date</th>
                    <th>Booking Time</th>
                    <th>Status</th>
                    {isDoctor ? <th>Action</th> : (isReceptionist ? null : <th>Review</th>)}
                  </tr>
                </thead>
                <tbody>
                  {appointments?.map((ele, i) => {
                    return (
                      <tr key={ele?._id}>
                        <td>{i + 1}</td>
                        <td>
                          {ele?.doctorId?.firstname + " " + ele?.doctorId?.lastname}
                        </td>
                        <td>
                          {ele?.userId?.firstname + " " + ele?.userId?.lastname}
                        </td>
                        <td>{ele?.date}</td>
                        <td>{ele?.time}</td>
                        <td>{ele?.createdAt.split("T")[0]}</td>
                        <td>{ele?.updatedAt.split("T")[1].split(".")[0]}</td>
                        <td>{ele?.status}</td>
                        {isDoctor ? (
                          <td>
                            <div className="action-buttons">
                              <button
                                className={`accept-btn ${
                                  ele?.status === "Completed" ? "disable-btn" : ""
                                }`}
                                disabled={ele?.status === "Completed"}
                                onClick={() => complete(ele)}
                              >
                                Complete
                              </button>
                              <button
                                className={`prescription-btn ${
                                  ele?.status === "Completed" ? "disable-btn" : ""
                                }`}
                                disabled={ele?.status === "Completed"}
                                onClick={() => navigateToAddPrescription(ele)}
                              >
                                Add Prescription
                              </button>
                            </div>
                          </td>
                        ) : (
                          !isReceptionist && (
                            <td>
                              <button
                                className={`review-btn ${
                                  ele?.status !== "Completed" || feedbackExists[ele._id] 
                                    ? "disable-btn" 
                                    : ""
                                }`}
                                disabled={ele?.status !== "Completed" || feedbackExists[ele._id]}
                                onClick={() => openFeedbackModal(ele)}
                              >
                                {feedbackExists[ele._id] ? "Reviewed" : "Leave Review"}
                              </button>
                            </td>
                          )
                        )}
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


{feedbackModalOpen && (
  <FeedbackModal
    appointment={selectedAppointment}
    onClose={() => setFeedbackModalOpen(false)}
    onSubmit={handleFeedbackSubmit}
    entityType="doctor" // Add this line
    entityId={selectedAppointment?.doctorId?._id} // Add this line
  />
)}
      
      <Footer />
    </>
  );
};

export default Appointments;