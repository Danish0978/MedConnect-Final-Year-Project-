import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "./Loading";
import { setLoading } from "../redux/reducers/rootSlice";
import { useDispatch, useSelector } from "react-redux";
import Empty from "./Empty";
import fetchData from "../helper/apiCall";
import "../styles/user.css";


axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);

  const getAllApp = async (e) => {
    try {
      dispatch(setLoading(true));
      const { data } = await axios.get("/doctor/applications", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("API Response:", data); // Log the response
      if (data.success) {
        setApplications(data.data);
      }
      dispatch(setLoading(false));
    } catch (error) {
      toast.error("Error fetching applications");
    }
  };

  const acceptUser = async (doctorId, clinicId) => {
    try {
      const confirm = window.confirm("Are you sure you want to accept?");
      if (confirm) {
        const { data } = await toast.promise(
          axios.put(
            "/doctor/acceptdoctor",
            { 
              doctorId,
              clinicId,
              status: "approved"
            },
            {
              headers: {
                authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            }
          ),
          {
            success: "Application accepted",
            error: "Unable to accept application",
            loading: "Accepting application...",
          }
        );
        getAllApp();
      }
    } catch (error) {
      console.error("Error in acceptUser:", error); // Log the error
      toast.error("Error accepting application");
    }
  };

  const rejectUser = async (doctorId, clinicId) => {
  try {
    const confirm = window.confirm("Are you sure you want to reject?");
    if (confirm) {
      const { data } = await toast.promise(
        axios.put(
          "/doctor/rejectdoctor",
          { 
            doctorId,
            clinicId,
            status: "rejected"
          },
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        ),
        {
          success: "Application rejected",
          error: "Unable to reject application",
          loading: "Rejecting application...",
        }
      );
      getAllApp();
    }
  } catch (error) {
    console.error("Error in rejectUser:", error); // Log the error
    toast.error("Error rejecting application");
  }
};
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
    getAllApp();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">All Applications</h3>
          {applications.length > 0 ? (
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
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications?.map((ele, i) => {
                    return (
                      <tr key={ele?._id}>
                        <td>{i + 1}</td>
                        <td>
                          <img
                            className="user-table-pic"
                            src={
                              ele?.userId?.pic ||
                              "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
                            }
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
                        <td>{ele?.status}</td>
                        <td className="select">
                          {ele?.status === "pending" && (
                            <>
                              <button
                                className="btn user-btn accept-btn"
                                onClick={() => {
                                  acceptUser(ele?._id, ele?.clinicId);
                                }}
                              >
                                Accept
                              </button>
                              <button
                                className="btn user-btn"
                                onClick={() => {
                                  rejectUser(ele?._id, ele?.clinicId);
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
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

export default AdminApplications;
