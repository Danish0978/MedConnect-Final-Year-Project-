import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  FaSearch, 
  FaBox, 
  FaShippingFast, 
  FaCheckCircle, 
  FaTimesCircle,
  FaInfoCircle,
  FaArrowLeft,
  FaStar
} from 'react-icons/fa';
import FeedbackModal from '../components/FeedbackModal'; // Reuse the same modal component
import '../styles/orderHistoryTracking.css';

const OrderHistoryAndTrackingPage = () => {
  const { user } = useSelector((state) => state.root);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/order/user', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setOrders(data.orders);
        
        // Check feedback existence for each completed order
        const feedbackChecks = await Promise.all(
          data.orders
            .filter(order => order.status === 'completed')
            .map(order => 
              axios.get(`/feedback/exists/order/${order._id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              })
            )
        );
        
        const feedbackMap = {};
        feedbackChecks.forEach((res, index) => {
          const orderId = data.orders.filter(order => order.status === 'completed')[index]._id;
          feedbackMap[orderId] = res.data.exists;
        });
        
        setFeedbackExists(feedbackMap);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <FaBox className="status-icon processing" />;
      case 'shipped':
        return <FaShippingFast className="status-icon shipped" />;
      case 'completed':
        return <FaCheckCircle className="status-icon completed" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaBox className="status-icon" />;
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const { data } = await axios.get(`/order/track/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedOrder(data.order);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch order details');
    }
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  const openFeedbackModal = (order) => {
    setSelectedOrder(order);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    try {
      // Refresh orders to update feedback status
      const { data } = await axios.get('/order/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(data.orders);
      
      // Update feedback existence for this order
      setFeedbackExists(prev => ({
        ...prev,
        [selectedOrder._id]: true
      }));
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
    setFeedbackModalOpen(false);
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="order-container">
        {selectedOrder ? (
          <div className="order-detail-view">
            <button onClick={handleBackToList} className="back-button">
              <FaArrowLeft /> Back to Orders
            </button>

            <div className="order-header">
              <h2>Order #{selectedOrder.orderNumber}</h2>
              <div className={`status-badge ${selectedOrder.status}`}>
                {getStatusIcon(selectedOrder.status)}
                <span>{selectedOrder.status.toUpperCase()}</span>
              </div>
            </div>

            <div className="order-timeline">
              <div className="timeline-steps">
                <div className={`step ${['processing', 'shipped', 'completed'].includes(selectedOrder.status) ? 'active' : ''}`}>
                  <div className="step-icon">1</div>
                  <div className="step-label">Processing</div>
                </div>
                <div className={`step ${['shipped', 'completed'].includes(selectedOrder.status) ? 'active' : ''}`}>
                  <div className="step-icon">2</div>
                  <div className="step-label">Shipped</div>
                </div>
                <div className={`step ${selectedOrder.status === 'completed' ? 'active' : ''}`}>
                  <div className="step-icon">3</div>
                  <div className="step-label">Delivered</div>
                </div>
              </div>
            </div>

            <div className="order-details-grid">
              <div className="order-items">
                <h3>Order Items</h3>
                <ul>
                  {selectedOrder.items.map((item, index) => (
                    <li key={index}>
                      <div className="item-details">
                        <h4>{item.medicineId.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: Rs. {item.price.toFixed(2)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Subtotal:</span>
                  <span>Rs. {selectedOrder.subTotal.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span>Discount:</span>
                  <span>-Rs. {(selectedOrder.subTotal - selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>Rs. {selectedOrder.totalAmount.toFixed(2)}</span>
                </div>

                {/* Add Review Button for Completed Orders */}
                {selectedOrder.status === 'completed' && (
                  <div className="review-section">
                    <button
                      className={`review-btn ${
                        feedbackExists[selectedOrder._id] ? 'disable-btn' : ''
                      }`}
                      disabled={feedbackExists[selectedOrder._id]}
                      onClick={() => openFeedbackModal(selectedOrder)}
                    >
                      {feedbackExists[selectedOrder._id] ? (
                        <>
                          <FaStar /> You've reviewed this order
                        </>
                      ) : (
                        <>
                          <FaStar /> Leave Pharmacy Review
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="shipping-info">
                <h3>Shipping Information</h3>
                <p><strong>Name:</strong> {selectedOrder.patient.firstname} {selectedOrder.patient.lastname}</p>
                <p><strong>Address:</strong> {selectedOrder.shippingInfo.address}</p>
                <p><strong>City:</strong> {selectedOrder.shippingInfo.city}</p>
                <p><strong>Phone:</strong> {selectedOrder.shippingInfo.phone}</p>
              </div>

              <div className="pharmacy-info">
                <h3>Pharmacy Information</h3>
                <p><strong>Name:</strong> {selectedOrder.pharmacy.name}</p>
                <p><strong>Address:</strong> {selectedOrder.pharmacy.address}</p>
                <p><strong>Phone:</strong> {selectedOrder.pharmacy.phone}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-list-view">
            <h2>My Orders</h2>
            
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by order number or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredOrders.length === 0 ? (
              <div className="no-orders">
                <p>You haven't placed any orders yet.</p>
                <button 
                  onClick={() => navigate('/medicines')} 
                  className="btn-primary"
                >
                  Shop Now
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <span className="order-number">
                        #{order.orderNumber}
                      </span>
                      <div className={`status-badge ${order.status}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-date">
                        <p>Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="order-items-preview">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span key={index}>{item.medicineId.name}</span>
                        ))}
                        {order.items.length > 3 && <span>+{order.items.length - 3} more</span>}
                      </div>
                      <div className="order-total">
                        <p>Total: Rs. {order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="order-actions">
                      <button 
                        onClick={() => handleViewDetails(order._id)}
                        className="btn-outline"
                      >
                        <FaInfoCircle /> View Details
                      </button>
                      {order.status === 'completed' && (
                        <button
                          className={`review-btn ${
                            feedbackExists[order._id] ? 'disable-btn' : ''
                          }`}
                          disabled={feedbackExists[order._id]}
                          onClick={() => openFeedbackModal(order)}
                        >
                          {feedbackExists[order._id] ? 'Reviewed' : 'Review'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {feedbackModalOpen && selectedOrder && (
        <FeedbackModal
          order={selectedOrder}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
          entityType="pharmacy"
          entityId={selectedOrder.pharmacy._id}
        />
      )}
      
      <Footer />
    </>
  );
};

export default OrderHistoryAndTrackingPage;