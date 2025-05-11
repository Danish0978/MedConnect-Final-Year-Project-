import React, { useState } from "react";
import {
  FaHome,
  FaPills,
  FaShoppingCart,
  FaFilePrescription,
  FaUser,
  FaPlus,
  FaEye,
  FaList,
  FaCommentDots 
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { MdLogout, MdArrowDropDown, MdArrowRight } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setUserInfo } from "../redux/reducers/rootSlice";
import "../styles/sidebar.css";

const PharmacySidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMedicineSubmenu, setShowMedicineSubmenu] = useState(false);
  const [showReceptionistSubmenu, setShowReceptionistSubmenu] = useState(false);
  const { user } = useSelector((state) => state.root);

  const sidebar = [
    {
      name: "Home",
      path: "/pharmacy/dashboard",
      icon: <FaHome />,
    },
    {
      name: "Medicines",
      icon: <FaPills />,
      submenu: [
        {
          name: "View Medicines",
          path: "/pharmacy/dashboard/medicines",
          icon: <FaEye />,
        },
        {
          name: "Add Medicine",
          path: "/pharmacy/dashboard/medicines/add",
          icon: <FaPlus />,
        },
      ],
    },
    {
      name: "Orders",
      path: "/pharmacy/dashboard/orders",
      icon: <FaShoppingCart />,
    },
    {
      name: "Prescriptions",
      path: "/pharmacy/dashboard/prescriptions",
      icon: <FaFilePrescription />,
    },
    {
      name: "Receptionists",
      icon: <FaUser />,
      submenu: [
        {
          name: "View Receptionists",
          path: "/pharmacy/dashboard/receptionists",
          icon: <FaEye />,
        },
        {
          name: "Add Receptionist",
          path: "/pharmacy/dashboard/receptionists/add",
          icon: <FaPlus />,
        },
      ],
    },
    // {
    //   name: "Prescriptions",
    //   path: "/dashboard/prescriptions",
    //   icon: <FaList />,
    // },
    {
      name: "Reviews",
      path: "/pharmacy/dashboard/reviews",
      icon: <FaCommentDots  />,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <FaUser />,
    },
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
          {sidebar.map((ele, i) => {
            if (ele.submenu) {
              const isMedicine = ele.name === "Medicines";
              return (
                <React.Fragment key={i}>
                  <li 
                    className="menu-item"
                    onClick={() => isMedicine 
                      ? setShowMedicineSubmenu(!showMedicineSubmenu) 
                      : setShowReceptionistSubmenu(!showReceptionistSubmenu)
                    }
                  >
                    <div className="menu-link">
                      {ele.icon}
                      <span>{ele.name}</span>
                      {isMedicine 
                        ? (showMedicineSubmenu ? <MdArrowDropDown /> : <MdArrowRight />)
                        : (showReceptionistSubmenu ? <MdArrowDropDown /> : <MdArrowRight />)
                      }
                    </div>
                  </li>
                  {(isMedicine ? showMedicineSubmenu : showReceptionistSubmenu) && (
                    <ul className="submenu">
                      {ele.submenu.map((sub, j) => (
                        <li key={j} className="submenu-item">
                          <NavLink to={sub.path} className="submenu-link">
                            {sub.icon}
                            <span>{sub.name}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </React.Fragment>
              );
            }
            return (
              <li key={i} className="menu-item">
                <NavLink to={ele.path} className="menu-link">
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

export default PharmacySidebar;