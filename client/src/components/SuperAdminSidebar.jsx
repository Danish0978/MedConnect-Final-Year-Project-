import React from "react";
import {
  FaHome,
  FaUser,
  FaUserMd,
  FaUsers,
  FaBuilding,
  FaHospital,
  FaPills,
  FaShoppingCart,
  FaFileAlt,
  FaCog
} from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../redux/reducers/rootSlice";
import "../styles/sidebar.css";

const SuperAdminSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sidebar = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <FaHome />
    },
    {
      name: "Users",
      path: "/admin/dashboard/users",
      icon: <FaUsers />
    },
    {
      name: "Doctors",
      path: "/admin/dashboard/doctors",
      icon: <FaUserMd />
    },
    {
      name: "Pharmacy Owners",
      path: "/admin/dashboard/pharmacies-owners",
      icon: <FaPills />
    },
    {
      name: "Clinic Owners",
      path: "/admin/dashboard/clinics-owners",
      icon: <FaHospital />
    },
    {
      name: "Orders",
      path: "/admin/dashboard/orders",
      icon: <FaShoppingCart />
    },
    {
      name: "Appointments",
      path: "/admin/dashboard/appointments",
      icon: <FaShoppingCart />
    },
    {
      name: "Transactions",
      path: "/admin/dashboard/transactions",
      icon: <FaFileAlt />
    },
    // {
    //   name: "Settings",
    //   path: "/admin/dashboard/settings",
    //   icon: <FaCog />
    // }
  ];

  const logoutFunc = () => {
    dispatch(setUserInfo({}));
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <section className="sidebar-section">
      <div className="sidebar-container">
        <ul className="sidebar-menu">
          {sidebar.map((item, index) => (
            <li key={index} className="menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "menu-link active" : "menu-link"
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="logout-container" onClick={logoutFunc}>
          <MdLogout />
          <p>Logout</p>
        </div>
      </div>
    </section>
  );
};

export default SuperAdminSidebar;