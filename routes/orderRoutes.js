const express = require("express");
const orderRouter = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");

// Create new order
orderRouter.post("/", auth, orderController.createOrder);


orderRouter.get("/user", auth, orderController.getUserOrders);
orderRouter.get("/all", auth, orderController.getAllOrders);
orderRouter.get("/superadmin/all", auth, orderController.getAllOrdersForSuperAdmin);

// Get order details
orderRouter.get("/:orderId", auth, orderController.getOrderById);

orderRouter.get("/track/:orderId", auth, orderController.trackOrder);
// Get user's orders
orderRouter.get("/user/:userId", auth, orderController.getOrdersByUser);

// Update order
orderRouter.put("/:orderId", auth, orderController.updateOrder);

// Delete order
orderRouter.delete("/:orderId", auth, orderController.deleteOrder);

module.exports = orderRouter;