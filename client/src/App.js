import "./styles/app.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "react-hot-toast";
import { Protected, Public, Admin, SuperAdmin } from "./middleware/route";
import React, { lazy, Suspense } from "react";
import Loading from "./components/Loading";
import AdminAddDoctor from "./components/AdminAddDoctor";
import AddReceptionist from "./components/AddReceptionist";
import UpdateReceptionist from "./components/UpdateReceptionist";
import UpdateUser from "./pages/UpdateUser";
import UpdateDoctor from "./pages/UpdateDoctor";
import RegisterClinic from "./components/RegisterClinic";
import AddPrescription from "./components/AddPrescription";
import DoctorPrescriptions from "./pages/DoctorPrescription";
import FindPatient from "./components/FindPatient";
import PharmacyMedicines from "./components/PharmacyMedicines";
import AddMedicine from "./components/AddMedicine";
import EditMedicine from "./components/EditMedicine";
import HealthScreening from "./components/HealthScreening";
import BookAppointment from "./components/BookAppointment";
import Payment from "./components/Payment";
import PharmacyReviews from "./components/PharmacyReviews";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ApplyDoctor = lazy(() => import("./pages/ApplyDoctor"));
const RegisterPharmacy = lazy(() => import("./pages/RegisterPharmacy"));
const PharmacyDashboard= lazy(()=> import ("./pages/PharmacyDashboard"));
const PharmacySales = lazy(()=> import ("./pages/PharmacySales"));
const OrderHistoryAndTracking = lazy(()=> import ("./pages/OrderHistoryAndTrackingPage"));
const MyReport = lazy(()=> import ("./pages/MyReports"));

const Error = lazy(() => import("./pages/Error"));

function App() {
  return (
    <Router>
      <Toaster />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={
              <Public>
                <Register />
              </Public>
            }
          />
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/doctors"
            element={<Doctors />}
          />
          <Route
            path="/appointments"
            element={
              <Protected>
                <Appointments />
              </Protected>
            }
          />
          <Route 
            path="/register-clinic" 
            element={
            <Admin>
            <RegisterClinic />
            </Admin>
            } 
          />
          <Route 
            path="/register-pharmacy" 
            element={
            <Admin>
            <RegisterPharmacy />
            </Admin>
            } 
          />
          <Route
            path="/notifications"
            element={
              <Protected>
                <Notifications />
              </Protected>
            }
          />
          <Route path="/add-prescription"
           element={
           <Protected>
            <AddPrescription />
            </Protected>}
             />
          <Route
            path="/applyfordoctor"
            element={
              <Protected>
                <ApplyDoctor />
              </Protected>
            }
          />
          <Route
           path="/doctor-prescriptions"
            element={
              <Protected>
              <DoctorPrescriptions />
              </Protected>
            }
            />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={""} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/users"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"users"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/doctors"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"doctors"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/pharmacies-owners"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"pharmacies-owners"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/clinics-owners"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"clinics-owners"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/orders"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"orders"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/appointments"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"appointments"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/admin/dashboard/transactions"
            element={
              <SuperAdmin>
                <SuperAdminDashboard type={"transactions"} />
              </SuperAdmin>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Admin>
                <Dashboard type={""} />
              </Admin>
            }
          />
          <Route
            path="/dashboard/doctors"
            element={
              <Admin>
                <Dashboard type={"doctors"} />
              </Admin>
            }
          />
          <Route
            path="/dashboard/doctors/add"
            element={
            <Protected>
            <Dashboard type="doctors/add" />
            </Protected>
            }
          />
          <Route
            path="/dashboard/doctors/edit/:id"
            element={
            <Protected>
              <Dashboard type="doctors/edit" />
            </Protected>
          }
          />
          <Route
            path="/dashboard/appointments"
            element={
              <Protected>
                <Dashboard type={"appointments"} />
              </Protected>
            }
          />
          <Route
            path="/dashboard/applications"
            element={
              <Protected>
                <Dashboard type={"applications"} />
              </Protected>
            }
          />
          <Route
            path="/dashboard/receptionists"
            element={
              <Protected>
                <Dashboard type={"receptionists"} />
              </Protected>
            }
          />
          <Route
            path="/dashboard/receptionists/add"
            element={
            <Protected>
            <Dashboard type="receptionists/add" />
            </Protected>
            }
          />
          <Route
            path="/dashboard/receptionists/edit/:id"
            element={
            <Protected>
              <Dashboard type="receptionists/edit" />
            </Protected>
          }
          />
          <Route
           path="/dashboard/prescriptions"
            element={
              <Admin>
              <PharmacyDashboard type={"prescriptions"} />
              </Admin>
            }
            />
          <Route
            path="/pharmacy/dashboard"
            element={
            <Admin>
            <PharmacyDashboard type="" />
            </Admin>
            }
          />
          <Route
          path="/pharmacy/dashboard/medicines" 
          element={
          <Admin>
          <PharmacyDashboard type="medicines" />
          </Admin>
          } 
        />
        <Route 
          path="/pharmacy/dashboard/medicines/add" 
          element={
          <Admin>
          <PharmacyDashboard type="medicines/add" />
          </Admin>
          } 
        />
        <Route 
          path="/pharmacy/dashboard/medicines/edit/:id" 
          element={
          <Admin>
          <PharmacyDashboard type="medicines/edit" />
          </Admin>
          } 
        />
        <Route
        path="/pharmacy/dashboard/receptionists"
        element={
        <Admin>
        <PharmacyDashboard type="receptionists" />
        </Admin>
        }
        />

      <Route
        path="/pharmacy/dashboard/receptionists/add"
        element={
        <Admin>
        <PharmacyDashboard type="receptionists/add" />
        </Admin>
        }
        />
        <Route
        path="/pharmacy/dashboard/receptionists/edit/:id"
        element={
        <Admin>
        <PharmacyDashboard type="receptionists/edit" />
        </Admin>
        }
        />
        <Route 
          path="/pharmacy/dashboard/orders" 
          element={
          <Admin>
          <PharmacyDashboard type="orders" />
          </Admin>
          } 
        />
        <Route 
          path="/pharmacy/dashboard/prescriptions" 
          element={
          <Admin>
          <PharmacyDashboard type="prescriptions" />
          </Admin>
          } 
        />
        <Route 
          path="/pharmacy/dashboard/reviews" 
          element={
          <Admin>
          <PharmacyDashboard type="reviews" />
          </Admin>
          } 
        />

          <Route
            path="/admin/add-doctor"
            element={
              <Admin>
                <AdminAddDoctor />
              </Admin>
            }
          />
          <Route
            path="/admin/update-user/:id"
            element={
              <Admin>
                <UpdateUser />
              </Admin>
            }
          />
          <Route
            path="/admin/update-doctor/:id"
            element={
              <Admin>
                <UpdateDoctor />
              </Admin>
            }
          />
          <Route
            path="/admin/add-receptionist"
            element={
              <Admin>
                <AddReceptionist />
              </Admin>
            }
          />
          <Route
            path="/admin/update-receptionist/:id"
            element={
              <Admin>
                <UpdateReceptionist />
              </Admin>
            }
          />
          <Route
            path="/order-medicine"
            element={
              <Protected>
                <PharmacySales />
              </Protected>
            }
          />
          <Route
            path="/find-patient"
            element={
              <Protected>
                <FindPatient />
              </Protected>
            }
          />
          <Route
            path="/track-orders"
            element={
              <Protected>
                <OrderHistoryAndTracking />
              </Protected>
            }
          />
          <Route
            path="/Medicines"
            element={
              <Protected>
                <PharmacyMedicines />
              </Protected>
            }
          />
          <Route
            path="/Medicines/add"
            element={
              <Protected>
                <AddMedicine />
              </Protected>
            }
          />
          <Route
            path="/Medicines/edit/:id"
            element={
              <Protected>
                <EditMedicine />
              </Protected>
            }
          />
          <Route
            path="/health-screening"
            element={
              <Protected>
                <HealthScreening />
              </Protected>
            }
          />
          {/* <Route
            path="/book-appointment"
            element={
              <Protected>
                <BookAppointment />
              </Protected>
            }
          /> */}
          <Route
            path="/payment"
            element={
              <Protected>
                <Payment />
              </Protected>
            }
          />
           <Route
            path="/reports"
            element={
              <Protected>
                <MyReport />
              </Protected>
            }
          />
          <Route
            path="*"
            element={<Error />}
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
