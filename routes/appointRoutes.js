const express = require("express");
const auth = require("../middleware/auth");
const appointmentController = require("../controllers/appointmentController");

const appointRouter = express.Router();

appointRouter.get(
  "/getallappointments",
  auth,
  appointmentController.getallappointments
);

appointRouter.get(
  "/getappointments",
  auth,
  appointmentController.getappointments
);

appointRouter.post(
  "/bookappointment",
  auth,
  appointmentController.bookappointment
);

appointRouter.post(
  "/book-by-receptionist", 
  auth, 
  appointmentController.bookByReceptionist
);

appointRouter.put("/completed", auth, appointmentController.completed);

appointRouter.get(
  "/superadmin/all",
  auth,
  appointmentController.getAllAppointmentsForSuperAdmin
);

module.exports = appointRouter;
