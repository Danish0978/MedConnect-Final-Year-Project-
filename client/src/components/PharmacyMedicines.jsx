import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import Loading from "./Loading";
import Empty from "./Empty";
import "../styles/user.css";
import jwt_decode from "jwt-decode";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const PharmacyMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [pharmacyId, setPharmacyId] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.root);
  const [user, setUser] = useState(
      localStorage.getItem("token")
        ? jwt_decode(localStorage.getItem("token"))
        : ""
    );

  useEffect(() => {
    const fetchPharmacyId = async () => {
      try {
        dispatch(setLoading(true));
        const token = localStorage.getItem("token");
        const response = await axios.get("/pharmacy/my-pharmacy", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        setPharmacyId(response.data.pharmacyId);
        dispatch(setLoading(false));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch pharmacy");
        dispatch(setLoading(false));
      }
    };
    fetchPharmacyId();
  }, [dispatch]);

  const getAllMedicines = async () => {
    if (!pharmacyId) return;
    
    try {
      dispatch(setLoading(true));
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`/medicine/all/${pharmacyId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success && data.data) {
        setMedicines(data.data);
      } else {
        toast.error("No medicines found");
      }
      dispatch(setLoading(false));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch medicines");
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await toast.promise(
        axios.delete(`/medicine/delete/${id}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }),
        {
          pending: "Deleting medicine...",
          success: "Medicine deleted successfully",
          error: "Failed to delete medicine",
        }
      );
      getAllMedicines();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete medicine");
    }
  };

  useEffect(() => {
    getAllMedicines();
  }, [pharmacyId]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">Medicine Inventory</h3>
          {/* <div className="add-doctor-button-container" style={{ marginBottom: "20px" }}>
            <button 
              className="btn"
              onClick={() => navigate("/pharmacy/dashboard/medicines/add")}
              style={{
                backgroundColor: "#1F51FF",
                color: "white",
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Add New Medicine
            </button>
          </div> */}
          {medicines.length > 0 ? (
            <div className="user-container">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Generic Name</th>
                    <th>Formula</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Prescription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine, i) => (
                    <tr key={medicine._id}>
                      <td>{i + 1}</td>
                      <td>{medicine.name}</td>
                      <td>{medicine.genericName}</td>
                      <td>{medicine.formula}</td>
                      <td>{medicine.quantity}</td>
                      <td>Rs. {medicine.price?.toFixed(2)}</td>
                      <td>{medicine.prescriptionRequired ? "Required" : "Not Required"}</td>
                      <td className="action-buttons">
                      <button
                         className="btn accept-btn"
                         style={{ marginRight: "10px" }}
                         onClick={() => navigate(
                           user?.isAdmin 
                             ? `/pharmacy/dashboard/medicines/edit/${medicine._id}`
                             : `/Medicines/edit/${medicine._id}`
                         )}
                      >
                        Edit
                      </button>
                        <button
                          className="btn user-btn"
                          onClick={() => handleDelete(medicine._id)}
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
            <Empty />
          )}
        </section>
      )}
    </>
  );
};

export default PharmacyMedicines;