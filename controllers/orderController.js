const Order = require("../models/orderModel");
const Medicine = require("../models/medicineModel");
const Pharmacy=require("../models/pharmacyModel");
const Notification=require("../models/notificationModel");

const generateOrderNumber = () => {
  const date = new Date();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${randomNum}`;
};

const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, discount = 0, shippingInfo, patientId } = req.body;
    const { userId, isPharmacyReceptionist } = req.user;

    // Validate items and update stock
    const pharmacyOrders = {}; // To group items by pharmacy

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId).populate('pharmacyId');
      if (!medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine ${item.medicineId} not found`
        });
      }
      
      if (medicine.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${medicine.name}`
        });
      }
      
      if (!medicine.pharmacyId) {
        return res.status(400).json({
          success: false,
          message: `Pharmacy not found for medicine ${medicine.name}`
        });
      }

      // Update stock
      medicine.quantity -= item.quantity;
      await medicine.save();

      const pharmacyId = medicine.pharmacyId._id.toString();
      if (!pharmacyOrders[pharmacyId]) {
        pharmacyOrders[pharmacyId] = {
          pharmacy: medicine.pharmacyId._id,
          items: [],
          subTotal: 0
        };
      }
      
      pharmacyOrders[pharmacyId].items.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: item.price
      });
      
      pharmacyOrders[pharmacyId].subTotal += item.price * item.quantity;
    }

    // Create orders for each pharmacy
    const orders = [];
    const orderNumbers = [];
    
    for (const pharmacyId in pharmacyOrders) {
      const pharmacyOrder = pharmacyOrders[pharmacyId];
      const order = new Order({
        orderNumber: generateOrderNumber(),
        items: pharmacyOrder.items,
        totalAmount: pharmacyOrder.subTotal * (1 - discount/100),
        discount,
        subTotal: pharmacyOrder.subTotal,
        ...(isPharmacyReceptionist ? {
          pharmacyStaff: userId,
          pharmacy: pharmacyId,
          orderType: "pharmacy",
          status: "completed"
        } : {
          patient: patientId || userId,
          shippingInfo,
          orderType: "online",
          status: "processing",
          pharmacy: pharmacyId
        })
      });

      await order.save();
      orders.push(order);
      orderNumbers.push(order.orderNumber);

      // Send notification to the order placer
      if (isPharmacyReceptionist) {
        // Notification for pharmacy receptionist who placed the order
        await Notification.create({
          userId: userId,
          content: `Order #${order.orderNumber} placed successfully`
        });
      } else {
        // Notification for patient who placed online order
        await Notification.create({
          userId: patientId || userId,
          content: `Your order #${order.orderNumber} has been placed successfully`
        });
      }
    }

    // Populate medicine and pharmacy details for response
    const populatedOrders = await Promise.all(
      orders.map(order => 
        Order.findById(order._id)
          .populate('items.medicineId', 'name prescriptionRequired')
          .populate('pharmacy', 'name address')
      )
    );

    res.status(201).json({
      success: true,
      orders: populatedOrders,
      orderNumbers: orderNumbers.join(', '),
      isMultiPharmacy: Object.keys(pharmacyOrders).length > 1
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.medicineId', 'name price')
      .populate('pharmacy', 'name address')
      .populate('patient', 'firstname lastname');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify user has access to this order
    const { userId } = req.user;
    if (order.patient?._id.toString() !== userId && 
        order.pharmacyStaff?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this order"
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: requestingUserId } = req.user;

    // Verify user is requesting their own orders
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view these orders"
      });
    }

    const orders = await Order.find({
      $or: [
        { patient: userId },
        { pharmacyStaff: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('items.medicineId', 'name')
    .populate('pharmacy', 'name');

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

const getAllOrders = async (req, res) => {
    try {
        const { userId, isAdmin } = req.user;

        // For system admins - get all orders
        if (isAdmin) {
            // First check if this admin manages a specific pharmacy
            const pharmacy = await Pharmacy.findOne({ adminId: userId });
            
            if (pharmacy) {
                // This is a pharmacy admin - get only their pharmacy's orders
                console.log("Pharmacy ID",pharmacy._id);
                const orders = await Order.find({ pharmacy: pharmacy._id })
                    .sort({ createdAt: -1 })
                    .populate('items.medicineId', 'name price')
                    .populate('patient', 'name email')
                    .populate('pharmacyStaff', 'name');

                return res.status(200).json({
                    success: true,
                    orders
                });
            }

            // This is a system admin - get all orders
            const orders = await Order.find()
                .sort({ createdAt: -1 })
                .populate('items.medicineId', 'name price')
                .populate('patient', 'name email')
                .populate('pharmacyStaff', 'name')
                .populate('pharmacy', 'name address');

            return res.status(200).json({
                success: true,
                orders
            });
        }

        // For regular users (non-admins) - get their own orders
        const orders = await Order.find({
            $or: [
                { patient: userId },
                { pharmacyStaff: userId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('items.medicineId', 'name price')
        .populate('pharmacy', 'name address');

        res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, shippingInfo, items } = req.body;
        const { userId, isAdmin } = req.user;

        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check permissions
        const isPharmacyStaff = order.pharmacyStaff && order.pharmacyStaff.toString() === userId;
        const isPatient = order.patient && order.patient.toString() === userId;
        const isPharmacyAdmin = isAdmin && await Pharmacy.exists({ 
            _id: order.pharmacy, 
            adminId: userId 
        });

        if (!isPharmacyStaff && !isPatient && !isAdmin && !isPharmacyAdmin) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to update this order"
            });
        }

        // Validate status transitions
        const validStatusTransitions = {
            processing: ['shipped', 'cancelled'],
            shipped: ['completed'],
            completed: [],
            cancelled: []
        };

        if (status && validStatusTransitions[order.status] && 
            !validStatusTransitions[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${order.status} to ${status}`
            });
        }

        // Update order fields
        if (status) order.status = status;
        if (shippingInfo) order.shippingInfo = shippingInfo;
        
        // Handle items updates (with inventory management)
        if (items) {
            // For simplicity, we'll just update the items
            // In production, you'd need to handle stock adjustments
            order.items = items;
        }

        order.updatedAt = new Date();
        const updatedOrder = await order.save();

        // Populate the updated order for response
        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate('items.medicineId', 'name price prescriptionRequired')
            .populate('pharmacy', 'name address')
            .populate('patient', 'name email')
            .populate('pharmacyStaff', 'name');

        res.status(200).json({
            success: true,
            order: populatedOrder
        });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update order"
        });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId, isAdmin } = req.user;

        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check permissions
        const isPharmacyStaff = order.pharmacyStaff && order.pharmacyStaff.toString() === userId;
        const isPatient = order.patient && order.patient.toString() === userId;
        const isPharmacyAdmin = isAdmin && await Pharmacy.exists({ 
            _id: order.pharmacy, 
            adminId: userId 
        });

        if (!isPharmacyStaff && !isPatient && !isAdmin && !isPharmacyAdmin) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to delete this order"
            });
        }

        // Check if order can be deleted (only in certain statuses)
        if (!['processing', 'cancelled'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete order with status ${order.status}`
            });
        }

        // Restore medicine quantities (if needed)
        if (order.status === 'processing') {
            await Promise.all(order.items.map(async (item) => {
                await Medicine.findByIdAndUpdate(item.medicineId, {
                    $inc: { quantity: item.quantity }
                });
            }));
        }

        // Delete the order
        await Order.findByIdAndDelete(orderId);

        res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete order"
        });
    }
};

// Track Order
const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;

    const order = await Order.findById(orderId)
      .populate('items.medicineId', 'name price image')
      .populate('pharmacy', 'name address phone')
      .populate('patient', 'firstname lastname email');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify user has access to this order
    if (order.patient._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this order" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ success: false, message: "Failed to track order" });
  }
};

// Get User Orders
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.user;

    const orders = await Order.find({ patient: userId })
      .sort({ createdAt: -1 })
      .populate('items.medicineId', 'name price')
      .populate('pharmacy', 'name');

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};


// For super admin to get all orders across pharmacies
const getAllOrdersForSuperAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('patient', 'name email')
      .populate('items.medicineId', 'name price');
    
    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUser,
    getAllOrders,
    updateOrder,
    deleteOrder,
    trackOrder,
    getUserOrders,
    getAllOrdersForSuperAdmin,
};