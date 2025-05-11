import React from "react";
import AdminApplications from "../components/AdminApplications";
import AdminAppointments from "../components/AdminAppointments";
import AdminDoctors from "../components/AdminDoctors";
import AdminAddDoctor from "../components/AdminAddDoctor"; // You'll need to create this
import AdminReceptionists from "../components/AdminReceptionists";
import AddReceptionist from "../components/AddReceptionist"; // You'll need to create this
import Sidebar from "../components/Sidebar";
import UpdateDoctor from "./UpdateDoctor";
import UpdateReceptionist from "../components/UpdateReceptionist";
import AdminHome from "../components/AdminHome";


const Dashboard = (props) => {
  const { type } = props;
  return (
    <>
      <section className="layout-section">
        <div className="layout-container">
          <Sidebar />
          {type === "" ? (
            <AdminHome />
          ) :type === "doctors" ? (
            <AdminDoctors />
          ) : type === "doctors/add" ? (
            <AdminAddDoctor />
          ): type === "doctors/edit" ? (
            <UpdateDoctor />
          ) : type === "applications" ? (
            <AdminApplications />
          ) : type === "appointments" ? (
            <AdminAppointments />
          ) : type === "receptionists" ? (
            <AdminReceptionists />
          ) : type === "receptionists/add" ? (
            <AddReceptionist />
          ) : type === "receptionists/edit" ? (
            <UpdateReceptionist />
          ) : (
            <></>          )}
        </div>
      </section>
    </>
  );
};

export default Dashboard;