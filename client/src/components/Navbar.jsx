import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { HashLink } from "react-router-hash-link";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../redux/reducers/rootSlice";
import { FiMenu } from "react-icons/fi";
import { RxCross1 } from "react-icons/rx";
import jwt_decode from "jwt-decode";
import axios from "axios";

const Navbar = () => {
  const [iconActive, setIconActive] = useState(false);
  const [hasClinic, setHasClinic] = useState(false);
  const [hasPharmacy, setHasPharmacy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("token")
      ? jwt_decode(localStorage.getItem("token"))
      : ""
  );

  useEffect(() => {
    const checkAssociations = async () => {
      if (token && user.isAdmin) {
        try {
          // Check clinic association
          const clinicResponse = await axios.get("/user/check-clinic", {
            headers: {
              authorization: `Bearer ${token}`,
            },
          });
          setHasClinic(clinicResponse.data.hasClinic);

          // Check pharmacy association
          const pharmacyResponse = await axios.get("/user/check-pharmacy", {
            headers: {
              authorization: `Bearer ${token}`,
            },
          });
          setHasPharmacy(pharmacyResponse.data.hasPharmacy);
        } catch (error) {
          console.error("Error checking associations:", error);
          console.log("Response error:", error.response?.status, error.response?.data);
        }
      }
    };

    checkAssociations();
  }, [token, user.isAdmin]);

  const logoutFunc = () => {
    dispatch(setUserInfo({}));
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header>
      <nav className={iconActive ? "nav-active" : ""}>
        <h2 className="nav-logo">
          <NavLink to={"/"}>MedConnect</NavLink>
        </h2>
        <ul className="nav-links">
          <li>
            <NavLink to={"/"}>Home</NavLink>
          </li>
          <li>
            <NavLink to={"/doctors"}>Doctors</NavLink>
          </li>
          {token && user.isReceptionist && (
            <li>
              <NavLink to={"/find-patient"}>Find Patient</NavLink>
            </li>
          )}
          {token && user.isAdmin && (
            <>
              {!hasClinic && (
                <li>
                  <NavLink to={"/register-clinic"}>Register Clinic</NavLink>
                </li>
              )}
              {hasClinic && (
                <li>
                  <NavLink to={"/dashboard"}>Clinic Dashboard</NavLink>
                </li>
              )}
              {!hasPharmacy && (
                <li>
                  <NavLink to={"/register-pharmacy"}>Register Pharmacy</NavLink>
                </li>
              )}
              {hasPharmacy && (
                <li>
                  <NavLink to={"/pharmacy/dashboard"}>Pharmacy Dashboard</NavLink>
                </li>
                
              )}
            </>
          )}
          {token && user.isSuperAdmin && (
            <>
            <li>
              <NavLink to={"/admin/dashboard"}>Dashboard</NavLink>
            </li>
            <li>
            <NavLink to={"/profile"}>Profile</NavLink>
          </li>
          </>
          )}
          {token && (!user.isAdmin && !user.isSuperAdmin) && (
            <>
              {/* <li>
                <NavLink to={"/appointments"}>Appointments</NavLink>
              </li> */}
              <li>
                <NavLink to={"/notifications"}>Notifications</NavLink>
              </li>
              {/* <li>
                <NavLink to={"/applyfordoctor"}>Apply for doctor</NavLink>
              </li>
              <li>
                <HashLink to={"/#contact"}>Contact Us</HashLink>
              </li> */}
              {/* <li>
                <NavLink to={"/profile"}>Profile</NavLink>
              </li> */}
            </>
          )}
          {token && (!user.isPharmacyReceptionist && !user.isAdmin && !user.isSuperAdmin) && (
            <>
             <li>
                <NavLink to={"/applyfordoctor"}>Apply for doctor</NavLink>
              </li>
            <li>
              <NavLink to={"/appointments"}>Appointments</NavLink>
            </li>
            <li>
                <HashLink to={"/#contact"}>Contact Us</HashLink>
              </li>
            </>
          )}
          {token && (user.isPharmacyReceptionist) && (
            <>
            <li>
              <NavLink to={"/Medicines"}>Medicines</NavLink>
            </li>
            <li>
              <NavLink to={"/Medicines/add"}>Add New Medicines</NavLink>
            </li>
            </>
            )}
          {token &&  ((!user.isSuperAdmin && !user.isAdmin) || user.isDoctor || user.isReceptionist || user.isPharmacyReceptionist) && (
            <>
              <li>
                <NavLink to={"/doctor-prescriptions"}>Prescriptions</NavLink>
              </li>
            </>
          )}
         {token && (user.isPharmacyReceptionist || (!user.isSuperAdmin && !user.isAdmin && !user.isDoctor && !user.isReceptionist)) && (
  <li>
    <NavLink to={"/order-medicine"}>Order Medicines</NavLink>
  </li>
)}
          {token &&  ((!user.isSuperAdmin && !user.isAdmin && !user.isPharmacyReceptionist && !user.isReceptionist) || user.isDoctor) && (
            <>
              <li>
                <NavLink to={"/reports"}>Reports</NavLink>
              </li>
            </>
          )}
          {token &&  (!user.isSuperAdmin && !user.isPharmacyReceptionist  && !user.isAdmin && !user.isDoctor && !user.isReceptionist) && (
            <li>
              <NavLink to={"/track-orders"}>Track Orders</NavLink>
            </li>
          )}
          {!token ? (
            <>
              <li>
                <NavLink className="btn" to={"/login"}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink className="btn" to={"/register"}>
                  Register
                </NavLink>
              </li>
            </>
          ) : (
            <li>
              <span className="btn" onClick={logoutFunc}>
                Logout
              </span>
            </li>
          )}
        </ul>
      </nav>
      <div className="menu-icons">
        {!iconActive && (
          <FiMenu
            className="menu-open"
            onClick={() => {
              setIconActive(true);
            }}
          />
        )}
        {iconActive && (
          <RxCross1
            className="menu-close"
            onClick={() => {
              setIconActive(false);
            }}
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;