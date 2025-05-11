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

const Users = ({ userType }) => {
  const [users, setUsers] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.root);

  // Determine if we should show admin-related elements
  const showAdminFeatures = !["doctors", "pharmacies-owners", "clinics-owners"].includes(userType);

  const getAllUsers = async () => {
    try {
      dispatch(setLoading(true));
      let endpoint = "/user/getallusers";
      
      switch (userType) {
        case "doctors":
          endpoint = "/user/getalldoctors";
          break;
        case "pharmacies-owners":
          endpoint = "/user/getallpharmacyowners";
          break;
        case "clinics-owners":
          endpoint = "/user/getallclinicowners";
          break;
        case "regular":
          endpoint = "/user/getallregularusers";
          break;
        default:
          endpoint = "/user/getallusers";
      }
      
      const temp = await fetchData(endpoint);
      setUsers(temp);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error fetching users: ", error);
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getAllUsers();
  }, [userType]);

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const action = currentStatus ? "remove" : "add";
      await toast.promise(
        axios.put("/user/toggleadmin", 
          { userId, action },
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        ),
        {
          pending: "Updating admin status...",
          success: `Admin status ${currentStatus ? "removed" : "added"} successfully`,
          error: "Unable to update admin status",
        }
      );
      getAllUsers();
    } catch (error) {
      console.error("Error toggling admin status: ", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const confirm = window.confirm("Are you sure you want to delete?");
      if (confirm) {
        await toast.promise(
          axios.delete("/user/deleteuser", {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: { userId },
          }),
          {
            pending: "Deleting...",
            success: "User deleted successfully",
            error: "Unable to delete user",
          }
        );
        getAllUsers();
      }
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  };

  const getTableTitle = () => {
    switch (userType) {
      case "doctors":
        return "All Doctors";
      case "pharmacies-owners":
        return "All Pharmacy Owners";
      case "clinics-owners":
        return "All Clinic Owners";
      case "regular":
        return "All Regular Users";
      default:
        return "All Users";
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">{getTableTitle()}</h3>
          {users.length > 0 ? (
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
                    <th>Age</th>
                    <th>Gender</th>
                    {showAdminFeatures && <th>Admin</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((ele, i) => (
                    <tr key={ele?._id}>
                      <td>{i + 1}</td>
                      <td>
                        <img
                          className="user-table-pic"
                          src={ele?.pic}
                          alt={ele?.firstname}
                        />
                      </td>
                      <td>{ele?.firstname}</td>
                      <td>{ele?.lastname}</td>
                      <td>{ele?.email}</td>
                      <td>{ele?.mobile || "N/A"}</td>
                      <td>{ele?.age || "N/A"}</td>
                      <td>{ele?.gender || "N/A"}</td>
                      {showAdminFeatures && <td>{ele?.isAdmin ? "Yes" : "No"}</td>}
                      <td className="user-actions">
                        <button
                          className="user-action-edit"
                          onClick={() => navigate(`/admin/update-user/${ele?._id}`)}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        {showAdminFeatures && (
                          <button
                            className={ele?.isAdmin ? "user-action-demote" : "user-action-promote"}
                            onClick={() => toggleAdminStatus(ele?._id, ele?.isAdmin)}
                          >
                            <i className={ele?.isAdmin ? "fas fa-user-minus" : "fas fa-user-plus"}></i>
                            {ele?.isAdmin ? "Remove Admin" : "Make Admin"}
                          </button>
                        )}
                        <button
                          className="user-action-delete"
                          onClick={() => deleteUser(ele?._id)}
                        >
                          <i className="fas fa-trash-alt"></i> Delete
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

export default Users;