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

const AdminReceptionists = () => {
  const [receptionists, setReceptionists] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.root);

  const getAllReceptionists = async () => {
    try {
      dispatch(setLoading(true));
      const response = await fetchData(`/receptionist/get-receptionists`);
      if (response.success && response.data) {
        setReceptionists(response.data);
      } else {
        toast.error("No receptionists found");
      }
      dispatch(setLoading(false));
    } catch (error) {
      toast.error("Failed to fetch receptionists");
      dispatch(setLoading(false));
    }
  };

  const deleteReceptionist = async (receptionistId) => {
    try {
      const confirm = window.confirm("Are you sure you want to delete this receptionist?");
      if (confirm) {
        await toast.promise(
          axios.delete(`/receptionist/delete-receptionist/${receptionistId}`, {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          {
            pending: "Deleting receptionist...",
            success: "Receptionist deleted successfully",
            error: "Failed to delete receptionist",
          }
        );
        getAllReceptionists();
      }
    } catch (error) {
      toast.error("Failed to delete receptionist");
    }
  };

  useEffect(() => {
    getAllReceptionists();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">All Receptionists</h3>
          {/* <div className="add-doctor-button-container" style={{ marginBottom: "20px" }}>
            <button 
              className="btn"
              onClick={() => navigate("/admin/add-receptionist")}
              style={{
                backgroundColor: "#1F51FF",
                color: "white",
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Add New Receptionist
            </button>
          </div> */}
          {receptionists.length > 0 ? (
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
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receptionists?.map((ele, i) => {
                    return (
                      <tr key={ele?._id}>
                        <td>{i + 1}</td>
                        <td>
                          <img
                            className="user-table-pic"
                            src={"https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                            alt={ele?.userId?.firstname}
                          />
                        </td>
                        <td>{ele?.userId?.firstname}</td>
                        <td>{ele?.userId?.lastname}</td>
                        <td>{ele?.userId?.email}</td>
                        <td>{ele?.userId?.mobile || "N/A"}</td>
                        <td>{ele?.userId?.gender || "N/A"}</td>
                        <td>{ele?.status}</td>
                        <td className="action-buttons">
                          <button
                            className="admin-edit"
                            style={{ marginRight: "10px" }}
                            onClick={() => navigate(`/admin/update-receptionist/${ele?._id}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-delete"
                            onClick={() => deleteReceptionist(ele?._id)}
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

export default AdminReceptionists;