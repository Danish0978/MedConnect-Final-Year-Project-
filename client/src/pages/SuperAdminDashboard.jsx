import React from "react";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import PharmacyOrders from "../components/PharmacyOrders";
import AdminAppointments from "../components/AdminAppointments";
import Transactions from "../components/Transactions";
import Users from "../components/Users";
import SuperAdminHome from "../components/SuperAdminHome";

const SuperAdminDashboard = (props) => {
  const { type } = props;
  
  return (
    <>
      <section className="layout-section">
        <div className="layout-container">
          <SuperAdminSidebar />
          {type === "dashboard" ? (
            <div className="dashboard-content">
              <h1>Super Admin Dashboard</h1>
              {/* Add dashboard widgets/overview here */}
            </div>
          ) : type === "" ? (
            <SuperAdminHome />
          ) : type === "users" ? (
            <Users userType="all" />
          ) : type === "doctors" ? (
            <Users userType="doctors" />
          ) : type === "pharmacies-owners" ? (
            <Users userType="pharmacies-owners" />
          ) : type === "clinics-owners" ? (
            <Users userType="clinics-owners" />
          ) : type === "orders" ? (
            <PharmacyOrders />
          ) : type === "appointments" ? (
            <AdminAppointments />
          ) : type === "transactions" ? (
            <Transactions />
          ) : (
            <div className="not-found">Page not found</div>
          )}
        </div>
      </section>
    </>
  );
};

export default SuperAdminDashboard;