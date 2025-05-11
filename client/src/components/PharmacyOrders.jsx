import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import Loading from "../components/Loading";
import "../styles/user.css";
import { FaEdit, FaTrash, FaSearch, FaFilter, FaArrowLeft } from "react-icons/fa";
import "../styles/app.css";
import "../styles/pharmacyOrders.css";
import jwt_decode from "jwt-decode";

const PharmacyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editForm, setEditForm] = useState({
    status: "",
    shippingInfo: {
      name: "",
      address: "",
      city: "",
      phone: "",
      notes: ""
    },
    items: []
  });
   const [token, setToken] = useState(localStorage.getItem("token") || "");
   const [user, setUser] = useState(
     localStorage.getItem("token")
       ? jwt_decode(localStorage.getItem("token"))
       : ""
   );

  const dispatch = useDispatch();
  const { loading} = useSelector((state) => state.root);

  // Fetch orders based on user role
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        dispatch(setLoading(true));
        const token = localStorage.getItem("token");
        let endpoint = "/order/all";
        
        // Use different endpoint for super admin
        if (user?.isSuperAdmin) {
          endpoint = "/order/superadmin/all";
        }

        const { data } = await axios.get(endpoint, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        
        // If super admin, we'll need to populate pharmacy info for each order
        const ordersWithPharmacy = user?.isSuperAdmin 
          ? await populatePharmacyInfo(data.orders || [])
          : data.orders || [];
        
        setOrders(ordersWithPharmacy);
        setFilteredOrders(ordersWithPharmacy);
      } catch (error) {
        toast.error("Failed to fetch orders");
        console.error("Fetch error:", error);
      } finally {
        dispatch(setLoading(false));
      }
    };
    
    fetchOrders();
  }, [dispatch, user?.isSuperAdmin]);

  // Helper function to populate pharmacy info for super admin view
  const populatePharmacyInfo = async (orders) => {
    try {
      const pharmacyIds = [...new Set(orders.map(order => order.pharmacy))];
      const { data } = await axios.post("/pharmacy/getmultiple", { ids: pharmacyIds }, {
        headers: {
          authorization: `Bearer ${token}`, // Add authorization header
        },
      });
      const pharmaciesMap = data.pharmacies.reduce((map, pharmacy) => {
        map[pharmacy._id] = pharmacy;
        return map;
      }, {});
      
      return orders.map(order => ({
        ...order,
        pharmacyInfo: pharmaciesMap[order.pharmacy] || null
      }));
    } catch (error) {
      console.error("Error fetching pharmacy info:", error);
      return orders; // Return original orders if pharmacy info fails
    }
  };

  // Apply filters
  useEffect(() => {
    let result = orders;
    
    if (searchTerm) {
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.shippingInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.pharmacyInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  // Handle order selection for editing
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      shippingInfo: order.shippingInfo || {
        name: "",
        address: "",
        city: "",
        phone: "",
        notes: ""
      },
      items: order.items.map(item => ({
        ...item,
        medicineId: item.medicineId?._id ? item.medicineId : { _id: item.medicineId }
      }))
    });
    setShowEditForm(true);
  };


  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("shippingInfo.")) {
      const field = name.split(".")[1];
      setEditForm(prev => ({
        ...prev,
        shippingInfo: {
          ...prev.shippingInfo,
          [field]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle item quantity change
  const handleItemChange = (index, field, value) => {
    const newItems = [...editForm.items];
    newItems[index][field] = field === "quantity" ? parseInt(value) : value;
    setEditForm(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // Submit order update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `/order/${selectedOrder._id}`,
        editForm,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update the order in state
      setOrders(prev => 
        prev.map(order => 
          order._id === selectedOrder._id ? { ...order, ...data } : order
        )
      );
      
      toast.success("Order updated successfully");
      setShowEditForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Delete order
  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        dispatch(setLoading(true));
        const token = localStorage.getItem("token");
        await axios.delete(`/order/${orderId}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        
        setOrders(prev => prev.filter(order => order._id !== orderId));
        toast.success("Order deleted successfully");
      } catch (error) {
        toast.error("Failed to delete order");
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  // Edit Order Form View
  if (showEditForm && selectedOrder) {
    return (
      <div className="pharmacy-orders-container">
        <div className="dashboard-content">
          <button 
            onClick={() => setShowEditForm(false)}
            className="back-button"
          >
            <FaArrowLeft /> Back to Orders
          </button>
          
          <h2>Edit Order #{selectedOrder.orderNumber}</h2>
          
          <form onSubmit={handleSubmit} className="order-edit-form">
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleFormChange}
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {selectedOrder.orderType === "online" && (
              <>
                <h3>Shipping Information</h3>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="shippingInfo.name"
                    value={editForm.shippingInfo.name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="shippingInfo.address"
                    value={editForm.shippingInfo.address}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="shippingInfo.city"
                    value={editForm.shippingInfo.city}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="shippingInfo.phone"
                    value={editForm.shippingInfo.phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={1}
                    name="shippingInfo.notes"
                    value={editForm.shippingInfo.notes}
                    onChange={handleFormChange}
                  />
                </div>
              </>
            )}
            
            <h3>Order Items</h3>
            <div className="order-items-edit">
              {editForm.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-info">
                    <span>{item.medicineId?.name || `Medicine ${item.medicineId._id}`}</span>
                    <span>Rs. {item.price.toFixed(2)} each</span>
                  </div>
                  <div className="item-quantity">
                    <label>Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => 
                        handleItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="btn secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>      </div>
    );
  }

  // Main Orders List View
  return (
    <div className="pharmacy-orders-container">
      <div className="dashboard-content">
        {loading ? (
          <Loading />
        ) : (
          <>
            <h2>{user?.isSuperAdmin ? "All Pharmacy Orders" : "My Pharmacy Orders"}</h2>
            
            {/* Filters and Search */}
            <div className="order-filters">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-dropdown">
                <FaFilter className="filter-icon" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {/* Orders Table */}
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    {user?.isSuperAdmin && <th>Pharmacy</th>}
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    {!user.isSuperAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        {user?.isSuperAdmin && (
                          <td>
                            {order.pharmacyInfo ? (
                              <div className="pharmacy-info">
                                <div className="pharmacy-name">{order.pharmacyInfo.name}</div>
                                <div className="pharmacy-address">
                                  {order.pharmacyInfo.address}, {order.pharmacyInfo.city}
                                </div>
                              </div>
                            ) : "Unknown Pharmacy"}
                          </td>
                        )}
                        <td>
                          {order.patient?.name || 
                           order.shippingInfo?.name || 
                           "Pharmacy"}
                        </td>
                        <td>Rs. {order.totalAmount?.toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
  {!user.isSuperAdmin && (
    <>
      <button 
        onClick={() => handleSelectOrder(order)}
        className="btn-icon"
        title="Edit"
      >
        <FaEdit />
      </button>
      <button 
        onClick={() => handleDelete(order._id)}
        className="btn-icon danger"
        title="Delete"
      >
        <FaTrash />
      </button>
    </>
  )}
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user?.isSuperAdmin ? 7 : 6} className="no-orders">
                        No orders found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PharmacyOrders;