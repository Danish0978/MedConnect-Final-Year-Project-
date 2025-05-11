import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import Loading from "./Loading";
import "../styles/doctorapply.css";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    formula: "",
    manufacturer: "",
    dosage: "",
    price: "",
    quantity: "",
    prescriptionRequired: false,
  });

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        dispatch(setLoading(true));
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`/medicine/${id}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        console.log("API Response:", data); // Debug log

        if (data.success && data.data) {  // Changed from data.medicine to data.data
          setFormData({
            name: data.data.name || "",
            genericName: data.data.genericName || "",
            formula: data.data.formula || "",
            manufacturer: data.data.manufacturer || "",
            dosage: data.data.dosage || "",
            price: data.data.price?.toString() || "",
            quantity: data.data.quantity?.toString() || "",
            prescriptionRequired: data.data.prescriptionRequired || false,
          });
        } else {
          toast.error("Medicine data not found in response");
          navigate("/pharmacy/dashboard/medicines");
        }
      } catch (error) {
        console.error("Error details:", error.response?.data); // More detailed error log
        toast.error(error.response?.data?.message || "Failed to fetch medicine details");
        navigate("/pharmacy/dashboard/medicines");
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchMedicine();
  }, [id, dispatch, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
      const token = localStorage.getItem("token");
      
      const submissionData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      };
  
      await toast.promise(
        axios.patch(`/medicine/update/${id}`, submissionData, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }),
        {
          pending: "Updating medicine...",
          success: "Medicine updated successfully",
          error: (err) => {
            if (err.response?.status === 404) {
              return "Medicine not found in your pharmacy inventory";
            }
            return err.response?.data?.message || "Failed to update medicine";
          }
        }
      );
      navigate("/pharmacy/dashboard/medicines");
    } catch (error) {
      console.error("Update error:", error.response?.data);
      // Error toast is already handled by the promise
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <section className="layout-section">
      <div className="layout-container">
        {loading ? (
          <Loading />
        ) : (
          <div className="apply-doctor-section">
            <div className="apply-doctor-container">
              <h2 className="form-heading">Edit Medicine</h2>
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label>Medicine Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Generic Name</label>
                  <input
                    type="text"
                    name="genericName"
                    className="form-input"
                    value={formData.genericName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Formula</label>
                  <input
                    type="text"
                    name="formula"
                    className="form-input"
                    value={formData.formula}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Manufacturer (Optional)</label>
                  <input
                    type="text"
                    name="manufacturer"
                    className="form-input"
                    value={formData.manufacturer}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Dosage (Optional)</label>
                  <input
                    type="text"
                    name="dosage"
                    className="form-input"
                    value={formData.dosage}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    name="price"
                    className="form-input"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-input"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    name="prescriptionRequired"
                    className="form-checkbox"
                    checked={formData.prescriptionRequired}
                    onChange={handleChange}
                    id="prescriptionRequired"
                  />
                  <label htmlFor="prescriptionRequired">Prescription Required</label>
                </div>

                <button 
                  type="submit" 
                  className="btn form-btn" 
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Medicine"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EditMedicine;