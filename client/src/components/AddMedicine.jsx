import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import "../styles/add-medicine.css";

const AddMedicine = () => {
  const navigate = useNavigate();
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
  const [pharmacyId, setPharmacyId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPharmacyId = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/pharmacy/my-pharmacy", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        setPharmacyId(response.data.pharmacyId);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch pharmacy");
      }
    };
    fetchPharmacyId();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const formSubmit = async (e) => {
    try {
      e.preventDefault();
      const { name, genericName, formula, price, quantity } = formData;

      if (!name || !genericName || !formula || !price || !quantity) {
        return toast.error("Required fields cannot be empty");
      }

      if (!pharmacyId) {
        return toast.error("Pharmacy information not available");
      }

      await toast.promise(
        axios.post(`/medicine/create/${pharmacyId}`, formData, {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        {
          pending: "Adding medicine...",
          success: "Medicine added successfully",
          error: "Unable to add medicine",
        }
      );
      navigate("/pharmacy/dashboard/medicines");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add medicine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-medicine-container">
      <h2>Add New Medicine</h2>
      <form onSubmit={formSubmit}>
        <div className="form-group">
          <label>Medicine Name</label>
          <input
            type="text"
            name="name"
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
            value={formData.manufacturer}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Dosage (Optional)</label>
          <input
            type="text"
            name="dosage"
            value={formData.dosage}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
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
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
        
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            name="prescriptionRequired"
            checked={formData.prescriptionRequired}
            onChange={handleChange}
            id="prescriptionRequired"
          />
          <label htmlFor="prescriptionRequired">Prescription Required</label>
        </div>
        
        <button 
          type="submit" 
          className="btn" 
          disabled={loading || !pharmacyId}
        >
          {loading ? "Adding..." : "Add Medicine"}
        </button>
      </form>
    </div>
  );
};

export default AddMedicine;