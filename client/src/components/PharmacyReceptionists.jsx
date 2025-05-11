import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import Loading from "./Loading";
import "../styles/user.css";

const PharmacyReceptionists = () => {
  const [receptionists, setReceptionists] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, user } = useSelector((state) => state.root);

  const fetchReceptionists = async () => {
    try {
      dispatch(setLoading(true));
      const { data } = await axios.get("/pharmacyreceptionist/receptionists", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      // Handle both array and object responses
      const receptionistsData = Array.isArray(data.data) ? data.data : 
                              data.data ? [data.data] : [];
      
      setReceptionists(receptionistsData);
    } catch (error) {
      console.error("Fetch error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to fetch receptionists");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this receptionist?")) {
      try {
        await axios.delete(`/pharmacyReceptionist/delete/${id}`, {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });  
          
        toast.success("Receptionist deleted successfully");
        fetchReceptionists();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete receptionist");
      }
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  return (
    <section className="user-section">
      <h3 className="home-sub-heading">Pharmacy Receptionists</h3>
      {/* <button 
        className="btn"
        onClick={() => navigate("/pharmacy/dashboard/receptionists/add")}
      >
        Add New Receptionist
      </button> */}
      
      {receptionists?.length > 0 ? (
        <div className="user-container">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receptionists.map((receptionist, i) => (
                <tr key={receptionist._id}>
                  <td>{i + 1}</td>
                  <td>
                    {receptionist.userId?.firstname || 'N/A'} {receptionist.userId?.lastname || ''}
                  </td>
                  <td>{receptionist.userId?.email || 'N/A'}</td>
                  <td>{receptionist.userId?.mobile || 'N/A'}</td>
                  <td>{receptionist.status || 'N/A'}</td>
                  <td className="action-buttons">
                    <button
                      className="btn accept-btn"
                      onClick={() => navigate(`/pharmacy/dashboard/receptionists/edit/${receptionist._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn user-btn"
                      onClick={() => handleDelete(receptionist._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No receptionists data found</p>
      )}
    </section>
  );
};

export default PharmacyReceptionists;