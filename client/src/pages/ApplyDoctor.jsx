import React from "react";
import "../styles/contact.css";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DoctorApply from "../components/DoctorApply"; // Import the DoctorApply component

const ApplyDoctor = () => {
  return (
    <>
      <Navbar />
      <DoctorApply /> {/* Render the DoctorApply component */}
      <Footer />
    </>
  );
};

export default ApplyDoctor;