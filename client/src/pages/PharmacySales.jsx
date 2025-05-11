import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaShoppingCart, FaPrint, FaHome } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../redux/reducers/rootSlice";
import Loading from "../components/Loading";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "../styles/pharmacySales.css";
import jwt_decode from "jwt-decode";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

const getCartStorageKey = (userId) => `pharmacy_cart_${userId || 'guest'}`;

const PharmacySales = () => {
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pharmacyId, setPharmacyId] = useState(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    notes: ""
  });
  
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);
  const [user, setUser] = useState(null);

  // Initialize user and fetch data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const initializeData = async () => {
      try {
        if (token) {
          const decoded = jwt_decode(token);
          setUser(decoded);
          
          const userCartKey = getCartStorageKey(decoded.userId);
          const savedCart = localStorage.getItem(userCartKey);
          if (savedCart) {
            try {
              setCart(JSON.parse(savedCart));
            } catch (error) {
              localStorage.removeItem(userCartKey);
            }
          }

          if (decoded.isPharmacyReceptionist) {
            await fetchPharmacyData(token);
          } else {
            await fetchAllMedicines(token);
          }
        } else {
          setUser({ isPharmacyReceptionist: false, userId: null });
          const guestCartKey = getCartStorageKey();
          const savedCart = localStorage.getItem(guestCartKey);
          if (savedCart) {
            try {
              setCart(JSON.parse(savedCart));
            } catch (error) {
              localStorage.removeItem(guestCartKey);
            }
          }
          await fetchAllMedicines();
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setUser({ isPharmacyReceptionist: false, userId: null });
        setMedicines([]);
      }
    };

    initializeData();
  }, []);

  // Save cart to storage
  useEffect(() => {
    if (user) {
      const cartKey = getCartStorageKey(user.userId);
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, user]);

  const fetchPharmacyData = async (token) => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get("/pharmacy/my-pharmacy", {
        headers: { authorization: `Bearer ${token}` }
      });
      setPharmacyId(response.data?.pharmacyId || null);
      await fetchPharmacyMedicines(token, response.data.pharmacyId);
    } catch (error) {
      console.error("Pharmacy data error:", error);
      toast.error("Failed to fetch pharmacy data");
      dispatch(setLoading(false));
    }
  };

  const fetchPharmacyMedicines = async (token, pharmacyId) => {
    try {
      console.log(`Fetching medicines for pharmacy ${pharmacyId}`);
      const response = await axios.get(`/medicine/all/${pharmacyId}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      console.log("Pharmacy medicines response:", response.data);
      if (response.data.success) {
        setMedicines(response.data.data);
      }
      dispatch(setLoading(false));
    } catch (error) {
      console.error("Error fetching pharmacy medicines:", error);
      toast.error("Failed to fetch pharmacy medicines");
      dispatch(setLoading(false));
    }
  };
  
  const fetchAllMedicines = async (token) => {
    try {
      dispatch(setLoading(true));
      const config = token ? { headers: { authorization: `Bearer ${token}` }} : {};
      const response = await axios.get("/medicine/all", config);
      
      // FIXED: Access response.data.data instead of response.data.medicines
      if (response.data?.success && Array.isArray(response.data.data)) {
        setMedicines(response.data.data); // Changed from response.data.medicines
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMedicines([]);
      toast.error("Failed to load medicines");
    } finally {
      dispatch(setLoading(false));
    }
  };
  
  // Also update the filteredMedicines function to handle the data structure:
  const filteredMedicines = (medicines || []).filter(medicine => {
    if (!medicine || !medicine.name) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      medicine.name.toLowerCase().includes(searchLower) ||
      (medicine.genericName && medicine.genericName.toLowerCase().includes(searchLower))
    );
  });
  
  // Cart functions with proper null checks
  const addToCart = (medicine) => {
    if (!medicine) return;
    
    if (!user?.isPharmacyReceptionist && medicine.prescriptionRequired) {
      toast.error("This medicine requires a prescription");
      return;
    }
    
    const existingItem = cart.find(item => item._id === medicine._id);
    let updatedCart;
    
    if (existingItem) {
      if (existingItem.quantity >= (medicine.quantity || 0)) {
        toast.error("Cannot add more than available stock");
        return;
      }
      updatedCart = cart.map(item =>
        item._id === medicine._id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cart, { ...medicine, quantity: 1 }];
    }
    
    setCart(updatedCart);
    toast.success(`${medicine.name} added to cart`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
    toast.success("Item removed from cart");
  };

  const updateQuantity = (id, newQuantity) => {
    const medicine = medicines.find(m => m?._id === id);
    if (!medicine) return;
    
    if (newQuantity > (medicine.quantity || 0)) {
      toast.error(`Only ${medicine.quantity} available in stock`);
      return;
    }
    
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(cart.map(item =>
      item._id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    const cartKey = getCartStorageKey(user?.userId);
    localStorage.removeItem(cartKey);
  };

  // Order calculations
  const calculateSubtotal = () => cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  const calculateTotal = () => calculateSubtotal() - (calculateSubtotal() * (discount / 100));

  // Checkout handlers
  const handleCheckout = async () => {
    if (user?.isPharmacyReceptionist) {
      await processOrder();
    } else {
      setShowCheckoutForm(true);
    }
  };

  const processOrder = async (shippingData = null) => {
    try {
      dispatch(setLoading(true));
      const token = localStorage.getItem("token");
      if (!token && !user?.isPharmacyReceptionist) {
        toast.error("You need to be logged in to checkout");
        dispatch(setLoading(false));
        return;
      }
  
      const orderData = {
        items: cart.map(item => ({
          medicineId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: calculateTotal(),
        ...(user?.isPharmacyReceptionist && { 
          discount,
          pharmacyId: pharmacyId 
        }),
        ...(!user?.isPharmacyReceptionist && { 
          shippingInfo: shippingData,
          patientId: user?.userId 
        })
      };
  
      const response = await axios.post("/order/", orderData, {
        headers: { authorization: `Bearer ${token}` }
      });
  
      if (response.data?.success) {
        setOrderDetails({
          ...response.data,
          // For backward compatibility with single order view
          order: response.data.orders?.[0] || response.data.order
        });
        setShowReceipt(true);
        setShowCheckoutForm(false);
        clearCart();
        setDiscount(0);
      }
      dispatch(setLoading(false));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
      dispatch(setLoading(false));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    processOrder(shippingInfo);
  };

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-print');
    const printWindow = window.open('', '', 'width=800,height=600');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>MedConnect Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-header h1 { color: #2c7be5; margin: 0; }
            .print-header p { margin: 5px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.1em; margin-top: 10px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>MedConnect</h1>
            <p>Medical Order Receipt</p>
          </div>
          <div id="receipt-content">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
 

  // Receipt View
  // Receipt View
if (showReceipt && orderDetails) {
    const ordersToDisplay = orderDetails.orders || [orderDetails.order];
    const isMultiPharmacy = orderDetails.isMultiPharmacy;
  
    return (
      <div className="pharmacy-sales-container">
        <Navbar />
        <div className="receipt-container">
          <div className="receipt" id="receipt-print">
            <h2>Order Confirmation</h2>
            {isMultiPharmacy && (
              <div className="multi-order-notice">
                <p>Your order contains items from multiple pharmacies and has been split into separate orders:</p>
                <p className="order-numbers">Order Numbers: {orderDetails.orderNumbers}</p>
              </div>
            )}
            
            {ordersToDisplay.map((order, orderIndex) => (
              <div key={orderIndex} className="order-receipt">
                <div className="receipt-header">
                  <p>Order #: {order.orderNumber}</p>
                  <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
                  {order.pharmacy && (
                    <div className="pharmacy-info">
                      <h4>Pharmacy: {order.pharmacy.name}</h4>
                      <p>{order.pharmacy.address}</p>
                    </div>
                  )}
                </div>
                
                <div className="receipt-body">
                  {order.orderType === "online" && order.shippingInfo && (
                    <div className="shipping-info">
                      <h3>Shipping Information</h3>
                      <p>Name: {order.shippingInfo.name}</p>
                      <p>Address: {order.shippingInfo.address}</p>
                      <p>City: {order.shippingInfo.city}</p>
                      <p>Phone: {order.shippingInfo.phone}</p>
                      {order.shippingInfo.notes && (
                        <p>Notes: {order.shippingInfo.notes}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="order-items">
                    <h3>Order Summary</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item, index) => (
                          <tr key={index}>
                            <td>{item.medicineId?.name}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.price?.toFixed(2)}</td>
                            <td>Rs. {(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="order-total">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>Rs. {order.subTotal?.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="total-row">
                        <span>Discount ({order.discount}%):</span>
                        <span>- Rs. {(order.subTotal * order.discount/100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="total-row grand-total">
                      <span>Total:</span>
                      <span>Rs. {order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="receipt-actions">
              <button onClick={printReceipt} className="print-btn">
                <FaPrint /> Print Receipt
              </button>
              <button 
                onClick={() => {
                  setShowReceipt(false);
                  setOrderDetails(null);
                }} 
                className="home-btn"
              >
                <FaHome /> Back to Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Checkout Form View
  if (showCheckoutForm) {
    return (
      <div className="pharmacy-sales-container">
        <Navbar />
        <div className="checkout-form-container">
          <form onSubmit={handleFormSubmit} className="checkout-form">
            <h2>Shipping Information</h2>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                required
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                required
                value={shippingInfo.city}
                onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                required
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={shippingInfo.notes}
                onChange={(e) => setShippingInfo({...shippingInfo, notes: e.target.value})}
              />
            </div>
            
            <div className="order-summary">
              <h3>Order Summary</h3>
              {cart.map(item => (
                <div key={item._id} className="order-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="order-total">
                <span>Total:</span>
                <span>Rs. {calculateSubtotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowCheckoutForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Place Order
              </button>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  // Main Pharmacy View
  return (
    <div className="pharmacy-sales-container">
      <Navbar />
      <div className="pharmacy-content">
        {loading ? (
          <Loading />
        ) : (
          <main className="pharmacy-main">
            <h2 className="pharmacy-title">
              {user?.isPharmacyReceptionist ? "Pharmacy Inventory" : "Pharmacy Store"}
            </h2>
            
            <div className="search-controls">
              <div className="search-input-group">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search medicines by name or generic name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="pharmacy-layout">
              <div className="medicine-list-section">
                <div className="table-header">
                  <h3>Available Medicines</h3>
                  <span className="results-count">{filteredMedicines.length} items found</span>
                </div>
                
                <div className="table-container">
                  <table className="medicines-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Generic Name</th>
                        <th>Formula</th>
                        <th>Manufacturer</th>
                        <th>Dosage</th>
                        {user?.isPharmacyReceptionist && <th>Stock</th>}
                        <th>Price</th>
                        {!user?.isPharmacyReceptionist && <th>Pharmacy</th>}
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map(medicine => (
                          medicine && (
                            <tr key={medicine._id} className={(medicine.quantity || 0) <= 0 ? "out-of-stock" : ""}>
                              <td>
                                <div className="medicine-name">
                                  {medicine.name}
                                  {medicine.prescriptionRequired && (
                                    <span className="prescription-badge">Rx</span>
                                  )}
                                </div>
                              </td>
                              <td>{medicine.genericName || '-'}</td>
                              <td>{medicine.formula || '-'}</td>
                              <td>{medicine.manufacturer || '-'}</td>
                              <td>{medicine.dosage || '-'}</td>
                              {user?.isPharmacyReceptionist && (
                                <td>
                                  <span className={`stock-badge ${(medicine.quantity || 0) <= 0 ? 'out' : (medicine.quantity || 0) <= 10 ? 'low' : 'in'}`}>
                                    {(medicine.quantity || 0) <= 0 ? 'Out of stock' : medicine.quantity}
                                  </span>
                                </td>
                              )}
                              <td>Rs. {medicine.price?.toFixed(2) || '0.00'}</td>
                              {!user?.isPharmacyReceptionist && (
                                <td className="pharmacy-info">
                                  {medicine.pharmacyId && (
                                    <>
                                      <div className="pharmacy-name">{medicine.pharmacyId.name}</div>
                                      <div className="pharmacy-address">{medicine.pharmacyId.address}</div>
                                    </>
                                  )}
                                </td>
                              )}
                              <td>
                                <button 
                                  className={`add-to-cart-btn ${!user?.isPharmacyReceptionist && medicine.prescriptionRequired ? "disabled" : ""}`}
                                  onClick={() => addToCart(medicine)}
                                  disabled={(medicine.quantity || 0) <= 0 || (!user?.isPharmacyReceptionist && medicine.prescriptionRequired)}
                                >
                                  {(medicine.quantity || 0) <= 0 ? "Out of stock" :
                                   !user?.isPharmacyReceptionist && medicine.prescriptionRequired 
                                    ? "Prescription Required" 
                                    : "Add to Cart"}
                                </button>
                              </td>
                            </tr>
                          )
                        ))
                      ) : (
                        <tr className="no-results">
                          <td colSpan={!user?.isPharmacyReceptionist ? 8 : 7}>
                            No medicines found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="cart-section">
                <div className="cart-card">
                  <h3 className="cart-title">Your Cart ({cart.length})</h3>
                  
                  {cart.length > 0 ? (
                    <>
                      <div className="cart-items-list">
                        {cart.map(item => {
                          const medicine = medicines.find(m => m?._id === item?._id);
                          return (
                            <div key={item._id} className="cart-item">
                              <div className="cart-item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">Rs. {item.price?.toFixed(2)}</span>
                              </div>
                              <div className="item-controls">
                                <div className="quantity-adjuster">
                                  <button 
                                    className="quantity-btn minus"
                                    onClick={() => updateQuantity(item._id, (item.quantity || 0) - 1)}
                                  >
                                    -
                                  </button>
                                  <span className="quantity">{item.quantity}</span>
                                  <button 
                                    className="quantity-btn plus"
                                    onClick={() => updateQuantity(item._id, (item.quantity || 0) + 1)}
                                    disabled={(item.quantity || 0) >= (medicine?.quantity || 0)}
                                  >
                                    +
                                  </button>
                                </div>
                                <button 
                                  className="remove-item-btn"
                                  onClick={() => removeFromCart(item._id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="cart-summary">
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>Rs. {calculateSubtotal().toFixed(2)}</span>
                        </div>
                        
                        {user?.isPharmacyReceptionist && (
                          <div className="summary-row discount-row">
                            <label>Discount:</label>
                            <div className="discount-input-group">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={discount}
                                onChange={(e) => {
                                  const value = Math.min(100, Math.max(0, Number(e.target.value)));
                                  setDiscount(value);
                                }}
                                placeholder="0"
                              />
                              <span>%</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="summary-row total-row">
                          <span>Total:</span>
                          <span className="total-amount">
                            Rs. {user?.isPharmacyReceptionist 
                              ? calculateTotal().toFixed(2) 
                              : calculateSubtotal().toFixed(2)}
                          </span>
                        </div>
                        
                        <button 
                          className="checkout-btn"
                          onClick={handleCheckout}
                        >
                          {user?.isPharmacyReceptionist ? "Checkout" : "Proceed to Checkout"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="empty-cart">
                      <FaShoppingCart className="empty-cart-icon" size={48} />
                      <p>Your cart is empty</p>
                      <small>Add medicines from the list</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PharmacySales;