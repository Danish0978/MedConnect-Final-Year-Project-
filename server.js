const express = require("express");
const cors = require("cors");
require("dotenv").config();  
require("./db/conn");
const userRouter = require("./routes/userRoutes");
const doctorRouter = require("./routes/doctorRoutes");
const appointRouter = require("./routes/appointRoutes");
const notificationRouter = require("./routes/notificationRouter");
const emailRouter = require("./routes/emailRoutes");
const clinicRouter = require("./routes/clinicRoutes");
const prescriptionRouter = require("./routes/prescriptionRoutes");
const receptionistRouter = require("./routes/receptionistRoutes");
const pharmacyRouter = require("./routes/pharmacyRoutes");
const medicineRouter = require("./routes/medicineRoutes");
const pharmacyReceptionistRouter = require("./routes/pharmacyReceptionistRoutes");
const orderRouter = require("./routes/orderRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const predictionRouter = require("./routes/predictionRoutes");
const feedbackRouter  = require("./routes/feedbackRoutes");
const path = require("path");

const app = express();
app.use(express.urlencoded({extended:true}))
app.use(express.json())
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials:true
}
));

// Routes
app.use("/api/user", userRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/appointment", appointRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/email", emailRouter);
app.use("/api/clinic", clinicRouter);
app.use("/api/prescription", prescriptionRouter);
app.use("/api/receptionist", receptionistRouter);
app.use("/api/pharmacy", pharmacyRouter);
app.use("/api/medicine", medicineRouter);
app.use("/api/pharmacyReceptionist", pharmacyReceptionistRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/predict", predictionRouter);
app.use("/api/feedback", feedbackRouter)
// Serve static files from React build
app.use(express.static(path.join(__dirname, "./client/build")));

// Catch-all route to serve React front-end
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// Simple API response for testing
app.get("/api", (req, res) => {
  res.status(200).json({ message: "API is running..." });
});

// Global error handling (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  console.error(`Failed to start the server: ${err.message}`);
});
