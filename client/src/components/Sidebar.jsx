import React, { useState } from "react";
import {
  FaHome,
  FaList,
  FaUser,
  FaUserMd,
  FaEnvelope,
  FaPlus,
  FaEye,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import "../styles/sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { MdLogout, MdArrowDropDown, MdArrowRight } from "react-icons/md";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../redux/reducers/rootSlice";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openDoctors, setOpenDoctors] = useState(false);
  const [openReceptionists, setOpenReceptionists] = useState(false);

  const sidebar = [
    {
      name: "Home",
      path: "/dashboard",
      icon: <FaHome />,
    },
    {
      name: "Doctors",
      icon: <FaUserMd />,
      submenu: [
        {
          name: "View Doctors",
          path: "/dashboard/doctors",
          icon: <FaEye />,
        },
        {
          name: "Add Doctor",
          path: "/dashboard/doctors/add",
          icon: <FaPlus />,
        },
      ],
    },
    {
      name: "Appointments",
      path: "/dashboard/appointments",
      icon: <FaList />,
    },
    {
      name: "Applications",
      path: "/dashboard/applications",
      icon: <FaEnvelope />,
    },
    {
      name: "Receptionists",
      icon: <FaUser />,
      submenu: [
        {
          name: "View Receptionists",
          path: "/dashboard/receptionists",
          icon: <FaEye />,
        },
        {
          name: "Add Receptionist",
          path: "/dashboard/receptionists/add",
          icon: <FaPlus />,
        },
      ],
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <FaUser />,
    },
  ];

  const toggleDoctors = () => {
    setOpenDoctors(!openDoctors);
  };

  const toggleReceptionists = () => {
    setOpenReceptionists(!openReceptionists);
  };

  const logoutFunc = () => {
    dispatch(setUserInfo({}));
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <section className="sidebar-section">
      <div className="sidebar-container">
        <ul className="sidebar-menu">
          {sidebar.map((ele, i) => {
            if (ele.submenu) {
              const isDoctor = ele.name === "Doctors";
              const isReceptionist = ele.name === "Receptionists";
              const isOpen = isDoctor ? openDoctors : openReceptionists;
              const toggle = isDoctor ? toggleDoctors : toggleReceptionists;

              return (
                <li key={i} className="menu-item">
                  <div className="menu-link" onClick={toggle}>
                    {ele.icon}
                    <span>{ele.name}</span>
                    {isOpen ? <MdArrowDropDown /> : <MdArrowRight />}
                  </div>
                  {isOpen && (
                    <ul className="submenu">
                      {ele.submenu.map((sub, j) => (
                        <li key={j}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) =>
                              isActive ? "submenu-link active" : "submenu-link"
                            }
                          >
                            {sub.icon}
                            <span>{sub.name}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={i} className="menu-item">
                <NavLink
                  to={ele.path}
                  className={({ isActive }) =>
                    isActive ? "menu-link active" : "menu-link"
                  }
                >
                  {ele.icon}
                  <span>{ele.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
        <div className="logout-container" onClick={logoutFunc}>
          <MdLogout />
          <p>Logout</p>
        </div>
      </div>
    </section>
  );
};

export default Sidebar;