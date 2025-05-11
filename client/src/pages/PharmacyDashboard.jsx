import React from "react";
import PharmacyMedicines from "../components/PharmacyMedicines";
import AddMedicine from "../components/AddMedicine";
import EditMedicine from "../components/EditMedicine";
import PharmacyOrders from "../components/PharmacyOrders";
import DoctorPrescriptions from "./DoctorPrescription";
import PharmacyReceptionists from "../components/PharmacyReceptionists";
import AddPharmacyReceptionist from "../components/AddPharmacyReceptionist";
import EditPharmacyReceptionist from "../components/EditPharmacyReceptionist";
import PharmacyAdminHome from "../components/PharmacyAdminHome";
import PharmacyReviews from "../components/PharmacyReviews";
import Sidebar from "../components/PharmacySidebar";

const PharmacyDashboard = (props) => {
  const { type } = props;
  return (
    <>
      <section className="layout-section">
        <div className="layout-container">
          <Sidebar />
          {type === "" ? (
            <PharmacyAdminHome />
          ) :type === "medicines" ? (
            <PharmacyMedicines />
          ) : type === "medicines/add" ? (
            <AddMedicine />
          ) : type === "medicines/edit" ? (
            <EditMedicine />
          ) : type === "orders" ? (
            <PharmacyOrders />
          ) : type === "prescriptions" ? (
            <DoctorPrescriptions />
          ) : type === "receptionists" ? (
            <PharmacyReceptionists />
          ) : type === "receptionists/add" ? (
            <AddPharmacyReceptionist />
          ) : type === "receptionists/edit" ? (
            <EditPharmacyReceptionist />
          )  : type === "reviews" ? (
            <PharmacyReviews />
          ) :
          (
            <div className="dashboard-default">
              <h2>Pharmacy Dashboard</h2>
              <p>Select an option from the sidebar to get started</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default PharmacyDashboard;