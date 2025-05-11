import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/doctorPrescriptions.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import jwt_decode from "jwt-decode";

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPrescription, setEditingPrescription] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, userInfo } = useSelector((state) => state.root);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("token")
      ? jwt_decode(localStorage.getItem("token"))
      : ""
  );
  

  // Fetch prescriptions based on user role
  const fetchPrescriptions = async () => {
    dispatch(setLoading(true));
    try {
      const response = await axios.get("/prescription/getPrescriptions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setPrescriptions(response.data.data);
        setFilteredPrescriptions(response.data.data); // Initialize filtered prescriptions
      }
    } catch (error) {
      toast.error("Error fetching prescriptions");
      console.error(error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Handle search query change
  useEffect(() => {
    if (searchQuery) {
      const filtered = prescriptions.filter((prescription) => {
        const fullName = `${prescription.patientId?.firstname || ""} ${
          prescription.patientId?.lastname || ""
        }`.toLowerCase();
        const cnic = prescription?.cnic || "";
        return (
          fullName.includes(searchQuery.toLowerCase()) ||
          cnic.includes(searchQuery)
        );
      });
      setFilteredPrescriptions(filtered);
    } else {
      setFilteredPrescriptions(prescriptions); // Reset to all prescriptions if search query is empty
    }
  }, [searchQuery, prescriptions]);

  // Handle edit button click
  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);
  };

  // Handle form submission for editing
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { medicines, diagnosis, notes } = editingPrescription;

      if (!medicines || !diagnosis) {
        return toast.error("Required fields cannot be empty");
      }

      const response = await axios.put(
        `/prescription/update/${editingPrescription._id}`,
        { medicines, diagnosis, notes },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Prescription updated successfully");
        setEditingPrescription(null); // Clear the editing state
        fetchPrescriptions(); // Refresh the list
      }
    } catch (error) {
      toast.error("Error updating prescription");
      console.error(error);
    }
  };

  // Handle print button click
  const handlePrint = (prescription) => {
    const printContent = `
      <h2>Prescription Details</h2>
      <p><strong>Patient Name:</strong> ${prescription.patientId?.firstname} ${prescription.patientId?.lastname}</p>
      <p><strong>CNIC:</strong> ${prescription?.cnic}</p>
      <p><strong>Gender:</strong> ${prescription.patientId?.gender}</p>
      <p><strong>Age:</strong> ${prescription.patientId?.age}</p>
      <p><strong>Date & Time:</strong> ${formatDate(prescription.createdAt)}</p>
      <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
      <p><strong>Notes:</strong> ${prescription.notes}</p>
      <h3>Medicines:</h3>
      ${prescription.medicines
        .map(
          (medicine) => `
        <p><strong>Name:</strong> ${medicine.name}</p>
        <p><strong>Dosage:</strong> ${medicine.dosage}</p>
        <p><strong>Duration:</strong> ${medicine.duration}</p>
      `
        )
        .join("")}
      ${user.isReceptionist ? `
        <p><strong>Doctor:</strong> ${prescription.doctorId?.userId?.firstname} ${prescription.doctorId?.userId?.lastname} (${prescription.doctorId?.specialization})</p>
        <p><strong>Availability:</strong> ${formatAvailability(prescription.doctorId?.availability)}</p>
        <p><strong>Fee Per Consultation: </strong> Rs. ${prescription.doctorId?.feePerConsultation}</p>
      ` : ""}
    `;

    const printWindow = window.open("", "", "width=600,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // Adjust format as needed
  };

  // Format doctor availability
  const formatAvailability = (availability) => {
    if (!availability) return "Not available";
    const days = Object.keys(availability).filter(
      (day) => availability[day].isAvailable
    );
    if (days.length === 0) return "Not available";
    return days
      .map((day) => `${day}: ${availability[day].startTime} - ${availability[day].endTime}`)
      .join(", ");
  };

  return (
    <>
      {!user?.isAdmin && <Navbar />}
      {loading && <Loading />}
      {!loading && (
        <section className="doctor-prescriptions-section">
          <h2 className="page-heading">
            {user.isDoctor ? "Your Prescriptions" : "Clinic Prescriptions"}
          </h2>

          {/* Search Bar */}
          {(user.isDoctor || user.isReceptionist || user.isAdmin || user.isPharmacyReceptionist) && (
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by CNIC or patient name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          )}
          {editingPrescription ? (
            <div className="edit-prescription-form">
              <h3>Edit Prescription</h3>
              <form onSubmit={handleUpdate}>
                {/* Medicine Fields */}
                {editingPrescription.medicines.map((medicine, index) => (
                  <div key={index} className="medicine-field">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={medicine.name}
                      onChange={(e) => {
                        const newMedicines = [...editingPrescription.medicines];
                        newMedicines[index].name = e.target.value;
                        setEditingPrescription({ ...editingPrescription, medicines: newMedicines });
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={medicine.dosage}
                      onChange={(e) => {
                        const newMedicines = [...editingPrescription.medicines];
                        newMedicines[index].dosage = e.target.value;
                        setEditingPrescription({ ...editingPrescription, medicines: newMedicines });
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={medicine.duration}
                      onChange={(e) => {
                        const newMedicines = [...editingPrescription.medicines];
                        newMedicines[index].duration = e.target.value;
                        setEditingPrescription({ ...editingPrescription, medicines: newMedicines });
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="btn remove-btn"
                      onClick={() => {
                        const newMedicines = editingPrescription.medicines.filter((_, i) => i !== index);
                        setEditingPrescription({ ...editingPrescription, medicines: newMedicines });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {/* Add Medicine Button */}
                <button
                  type="button"
                  className="btn add-btn"
                  onClick={() => {
                    const newMedicines = [...editingPrescription.medicines, { name: "", dosage: "", duration: "" }];
                    setEditingPrescription({ ...editingPrescription, medicines: newMedicines });
                  }}
                >
                  Add Medicine
                </button>

                {/* Diagnosis Field */}
                <textarea
                  placeholder="Diagnosis"
                  value={editingPrescription.diagnosis}
                  onChange={(e) =>
                    setEditingPrescription({ ...editingPrescription, diagnosis: e.target.value })
                  }
                  required
                />

                {/* Notes Field */}
                <textarea
                  placeholder="Notes"
                  value={editingPrescription.notes}
                  onChange={(e) =>
                    setEditingPrescription({ ...editingPrescription, notes: e.target.value })
                  }
                />

                {/* Update and Cancel Buttons */}
                <div className="form-actions">
                  <button type="submit" className="btn update-btn">
                    Update Prescription
                  </button>
                  <button
                    type="button"
                    className="btn cancel-btn"
                    onClick={() => setEditingPrescription(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="prescriptions-list">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <div key={prescription._id} className="prescription-card">
                    <h3>
                      Prescription for {prescription.patientId?.firstname}{" "}
                      {prescription.patientId?.lastname}
                    </h3>
                    <p>
                      <strong>CNIC:</strong> {prescription?.cnic}
                    </p>
                    <p>
                      <strong>Gender:</strong> {prescription.patientId?.gender}
                    </p>
                    <p>
                      <strong>Age:</strong> {prescription.patientId?.age}
                    </p>
                    <p>
                      <strong>Date & Time:</strong> {formatDate(prescription.createdAt)}
                    </p>
                    <p>
                      <strong>Diagnosis:</strong> {prescription.diagnosis}
                    </p>
                    <p>
                      <strong>Notes:</strong> {prescription.notes}
                    </p>
                    {/* Display Doctor Info for Receptionist */}
                    {(!user.isDoctor) && (
                      <>
                        <p>
                          <strong>Doctor:</strong> {prescription.doctorId?.userId?.firstname}{" "}
                          {prescription.doctorId?.userId?.lastname} (
                          {prescription.doctorId?.specialization})
                        </p>
                        <p>
                          <strong>Availability:</strong>{" "}
                          {formatAvailability(prescription.doctorId?.availability)}
                        </p>
                        <p>
                          <strong>Fee per Consultation: Rs.</strong>{" "}
                          {prescription.doctorId?.feePerConsultation}
                        </p>
                      </>
                    )}
                    <div className="medicines-list">
                      <h4>Medicines:</h4>
                      {prescription.medicines.map((medicine, index) => (
                        <div key={index} className="medicine-item">
                          <p>
                            <strong>Name:</strong> {medicine.name}
                          </p>
                          <p>
                            <strong>Dosage:</strong> {medicine.dosage}
                          </p>
                          <p>
                            <strong>Duration:</strong> {medicine.duration}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Show Edit Button for Doctor */}
                    {user.isDoctor && (
                      <button
                        className="btn edit-btn"
                        onClick={() => handleEdit(prescription)}
                      >
                        Edit
                      </button>
                    )}
                    {/* Show Print Button for Receptionist */}
                    {(!user.isDoctor) && (
                      <button
                        className="btn print-btn"
                        onClick={() => handlePrint(prescription)}
                      >
                        Print
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-prescriptions">No prescriptions found.</p>
              )}
            </div>
          )}
        </section>
      )}
      {!user?.isAdmin && <Footer />}
    </>
  );
};

export default DoctorPrescriptions;