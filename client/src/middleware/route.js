import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

export const Protected = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to={"/"} replace={true} />;
  }
  return children;
};

export const Public = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return children;
  }
  return <Navigate to={"/"} replace={true} />;
};

export const Admin = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to={"/"} replace={true} />;
  
  const user = jwtDecode(token);
  if (user.isAdmin || user.isSuperAdmin) {
    return children;
  }
  return <Navigate to={"/"} replace={true} />;
};

export const SuperAdmin = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to={"/"} replace={true} />;
  
  const user = jwtDecode(token);
  if (user.isSuperAdmin) {
    return children;
  }
  return <Navigate to={"/"} replace={true} />;
};