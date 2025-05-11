import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  Home,
  Pill,
  ShoppingCart,
  FileText,
  Users,
  UserCircle,
  LogOut,
  AlertTriangle,
  Download,
  ChevronRight,
  Plus,
  ClipboardList,
  PackageSearch,
  Receipt,
  UserCog,
  UserPlus
} from 'lucide-react';
import axios from 'axios';
import '../styles/AdminHome.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PharmacyAdminHome = () => {
  const navigate = useNavigate();
  const [pharmacyId, setPharmacyId] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('Component rendering - Current state:', {
    pharmacyId,
    medicines: medicines.length,
    orders: orders.length,
    loading,
    error
  });

  const sidebarLinks = [
    { icon: <Home size={20} />, label: 'Home', active: true },
    { icon: <Pill size={20} />, label: 'Medicines', hasSubmenu: true },
    { icon: <ShoppingCart size={20} />, label: 'Orders' },
    { icon: <FileText size={20} />, label: 'Prescriptions' },
    { icon: <Users size={20} />, label: 'Receptionists', hasSubmenu: true },
    { icon: <UserCircle size={20} />, label: 'Profile' },
  ];

  // Fetch pharmacy ID first
  useEffect(() => {
    const fetchPharmacyId = async () => {
      console.log('Starting to fetch pharmacy ID');
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error('No token found in localStorage');
        }

        console.log('Making request to /pharmacy/my-pharmacy');
        const response = await axios.get("/pharmacy/my-pharmacy", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        
        console.log('Pharmacy ID response:', response.data);
        if (!response.data?.pharmacyId) {
          throw new Error('Invalid pharmacy ID received');
        }

        setPharmacyId(response.data.pharmacyId);
        console.log('Successfully set pharmacyId:', response.data.pharmacyId);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Failed to fetch pharmacy data";
        console.error("Error fetching pharmacy ID:", err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    fetchPharmacyId();
  }, []);

  // Fetch medicines and orders when pharmacyId is available
  useEffect(() => {
    if (!pharmacyId) {
      console.log('pharmacyId not available yet, skipping data fetch');
      return;
    }

    const fetchData = async () => {
      console.log('Starting to fetch medicines and orders with pharmacyId:', pharmacyId);
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error('No token found in localStorage');
        }

        const headers = {
          authorization: `Bearer ${token}`,
        };

        console.log('Making request to /medicine/all/' + pharmacyId);
        const medicinesResponse = await axios.get(`/medicine/all/${pharmacyId}`, { headers });
        console.log('Medicines response:', medicinesResponse.data);
        // Access the data array from the response correctly
        setMedicines(Array.isArray(medicinesResponse.data?.data) ? medicinesResponse.data.data : []);

        console.log('Making request to /order/all');
        const ordersResponse = await axios.get("/order/all", { headers });
        console.log('Orders response:', ordersResponse.data);
        // Access the orders array from the response correctly
        setOrders(Array.isArray(ordersResponse.data?.orders) ? ordersResponse.data.orders : []);

        setLoading(false);
        console.log('Data fetching completed successfully');
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Failed to fetch data";
        console.error("Error fetching data:", err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    fetchData();
  }, [pharmacyId]);

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
        <p className="loading-details">
          {pharmacyId ? 'Fetching medicines and orders...' : 'Fetching pharmacy information...'}
        </p>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  console.log('Rendering dashboard with data:', {
    medicinesCount: medicines.length,
    ordersCount: orders.length
  });

  // Calculate stats
  const totalMedicines = medicines.length;
  const lowStockItems = medicines.filter(medicine => medicine.quantity < 10).length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

// And update the activeOrders filter to match your order statuses if needed:
const activeOrders = orders.filter(order => 
  order.status === "processing" || order.status === "shipped" // Adjust these if your statuses are different
).length;

  const stats = [
    {
      title: "Total Medicines",
      value: totalMedicines,
      icon: <Pill size={24} />,
      iconBg: "#e0e7ff",
      iconColor: "#4f46e5",
      barColor: "#4f46e5",
      link: "/pharmacy/dashboard/medicines",
      increase: 12, // You might want to calculate this based on previous data
      period: "vs last month"
    },
    {
      title: "Active Orders",
      value: activeOrders,
      icon: <ShoppingCart size={24} />,
      iconBg: "#dbeafe",
      iconColor: "#3b82f6",
      barColor: "#3b82f6",
      link: "/pharmacy/dashboard/orders",
      increase: 8, // You might want to calculate this based on previous data
      period: "vs last week"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      icon: <AlertTriangle size={24} />,
      iconBg: "#fee2e2",
      iconColor: "#ef4444",
      barColor: "#ef4444",
      link: "/pharmacy/dashboard/medicines",
      increase: 5, // You might want to calculate this based on previous data
      period: "need attention",
      alert: true
    },
    {
      title: "Total Revenue",
      value: `Rs. ${totalRevenue.toLocaleString()}/-`,
      icon: <Receipt size={24} />,
      iconBg: "#f3e8ff",
      iconColor: "#9333ea",
      barColor: "#9333ea",
      link: "/pharmacy/dashboard",
      increase: 18, // You might want to calculate this based on previous data
      period: "this month"
    }
  ];

// Prepare sales data for the last 6 months
const prepareSalesData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);
    }
  
    const monthlySales = last6Months.map(month => {
      return orders.reduce((sum, order) => {
        // Make sure we're using the correct date field (createdAt) and amount field (totalAmount)
        const orderDate = new Date(order.createdAt || order.date || new Date()); // Fallback to current date if not available
        if (months[orderDate.getMonth()] === month) {
          return sum + (order.totalAmount || 0); // Use totalAmount instead of total
        }
        return sum;
      }, 0);
    });
  
    // Calculate max value for y-axis scaling
    const maxValue = Math.max(...monthlySales, 1000); // Ensure at least 1000 is shown
    const stepSize = maxValue <= 1000 ? 100 : 
                    maxValue <= 5000 ? 500 : 
                    maxValue <= 10000 ? 1000 : 
                    Math.ceil(maxValue / 5);
  
    return {
      labels: last6Months,
      datasets: [
        {
          label: "Sales (Rs.)",
          data: monthlySales,
          backgroundColor: [
            'rgba(37, 99, 235, 0.8)',
            'rgba(37, 99, 235, 0.7)',
            'rgba(37, 99, 235, 0.6)',
            'rgba(37, 99, 235, 0.5)',
            'rgba(37, 99, 235, 0.4)',
            'rgba(37, 99, 235, 0.3)',
          ],
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
      maxValue, // We'll use this for scaling
      stepSize  // We'll use this for tick intervals
    };
  };
  
  const salesData = prepareSalesData();
  
  const salesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold"
        },
        bodyFont: {
          size: 12
        },
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Rs. ${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(229, 231, 235, 0.5)"
        },
        ticks: {
          font: {
            size: 11
          },
          color: "rgba(107, 114, 128, 1)",
          callback: (value) => `Rs. ${value.toLocaleString()}`,
          stepSize: salesData.stepSize, // Use calculated step size
          max: Math.ceil(salesData.maxValue * 1.1) // Add 10% padding to max value
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: "rgba(107, 114, 128, 1)"
        }
      }
    }
  };
  // Prepare order status distribution for pie chart (since we don't have medicine categories)
  const prepareOrderStatusData = () => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const statuses = Object.keys(statusCounts);
    const counts = Object.values(statusCounts);

    return {
      labels: statuses,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "rgba(37, 99, 235, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(139, 92, 246, 0.8)",
          ],
          borderColor: [
            "rgba(37, 99, 235, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(139, 92, 246, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const categoryData = prepareOrderStatusData();

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 16,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold"
        },
        bodyFont: {
          size: 12
        },
        cornerRadius: 6
      }
    },
    cutout: '60%'
  };

  // Prepare low stock items
  const lowStockItemsData = medicines
    .filter(medicine => medicine.quantity < 10)
    .slice(0, 4) // Show only top 4
    .map(medicine => ({
      id: medicine._id,
      name: medicine.name,
      quantity: medicine.quantity,
      reorderPoint: 10, // Assuming reorder point is 10
      time: medicine.quantity < 5 ? "Critical stock level" : 
            medicine.quantity < 8 ? "1 week until stockout" : "Order soon",
      icon: <AlertTriangle size={20} />,
      iconBg: medicine.quantity < 5 ? "#fee2e2" : "#fff7ed",
      iconColor: medicine.quantity < 5 ? "#ef4444" : "#f97316"
    }));

  const quickActions = [
    {
      href: "/pharmacy/dashboard/medicines/add",
      label: "Add New Medicine",
      icon: <Plus size={20} />,
      bgColor: "#eef2ff",
      textColor: "#4338ca",
      borderColor: "#e0e7ff"
    },
    {
        href: "/pharmacy/dashboard/receptionists/add",
        label: "Add Receptionist",
        icon: <UserPlus size={20} />,
        bgColor: "#dbeafe",
        textColor: "#1e40af",
        borderColor: "#bfdbfe"
      },
    {
      href: "/pharmacy/dashboard/medicines",
      label: "Check Inventory",
      icon: <PackageSearch size={20} />,
      bgColor: "#dbeafe",
      textColor: "#1e40af",
      borderColor: "#bfdbfe"
    },
    {
      href: "/pharmacy/dashboard/orders",
      label: "Process Orders",
      icon: <ClipboardList size={20} />,
      bgColor: "#ecfdf5",
      textColor: "#047857",
      borderColor: "#d1fae5"
    },
    {
      href: "/pharmacy/dashboard/prescriptions",
      label: "Check Prescriptions",
      icon: <FileText size={20} />,
      bgColor: "#fffbeb",
      textColor: "#b45309",
      borderColor: "#fef3c7"
    },
    {
        href: "/pharmacy/dashboard/receptionists",
        label: "Manage Receptionist",
        icon: <UserCog size={20} />,
        bgColor: "#fffbeb",
        textColor: "#b45309",
        borderColor: "#fef3c7"
      }
  ];

  return (
    <div className="admin-layout">
      <header className="header">
        <div className="header-container">
        </div>
      </header>
      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Pharmacy Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back to your pharmacy admin dashboard</p>
        </div>
        
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <a 
              href={stat.link} 
              key={index} 
              className={`stat-card animate-fade-in ${stat.alert ? 'alert' : ''}`}
            >
              <div className="stat-header">
                <div className="stat-icon" style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}>
                  {stat.icon}
                </div>
                <ChevronRight size={20} style={{ color: stat.iconColor }} />
              </div>
              <div className="stat-content">
                <p className="stat-title">{stat.title}</p>
                <div className="stat-value">
                  {stat.value}
                  <span className="stat-increase">+{stat.increase}%</span>
                </div>
                <p className="stat-period">{stat.period}</p>
              </div>
              <div className="stat-bar" style={{ backgroundColor: stat.barColor }}></div>
            </a>
          ))}
        </div>

        <div className="charts-grid">
          <div className="chart-card animate-slide-up">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Monthly Sales</h2>
                <p className="chart-subtitle">Last 6 months revenue</p>
              </div>
              <div className="chart-actions">
                <button className="action-button">
                  <Download size={16} />
                </button>
                <button className="report-button" onClick={() => navigate("/pharmacy/dashboard/orders")}>
                  View All <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Bar data={salesData} options={salesOptions} />
            </div>
          </div>
          
          <div className="chart-card animate-slide-up">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Order Status</h2>
                <p className="chart-subtitle">Distribution by status</p>
              </div>
              <div className="chart-actions">
                <button className="action-button">
                  <Download size={16} />
                </button>
                <button className="report-button" onClick={() => navigate("/pharmacy/dashboard/orders")}>
                  View All <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Pie data={categoryData} options={categoryOptions} />
            </div>
          </div>
        </div>

        <div className="activities-container">
          <div className="activities-card animate-slide-up">
            <div className="activities-header">
              <h2 className="activities-title">Low Stock Alert</h2>
              <button className="view-all-button" onClick={() => navigate("/pharmacy/dashboard/medicines")}>
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="activities-list">
              {lowStockItemsData.map((item) => (
                <div key={item.id} className="activity-item">
                  <div 
                    className="activity-icon" 
                    style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                  >
                    {item.icon}
                  </div>
                  <div className="activity-content">
                    <h3 className="activity-title">{item.name}</h3>
                    <p className="activity-description">Stock: {item.stock} (Min: {item.reorderPoint})</p>
                  </div>
                  <div className="activity-time">{item.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="quick-actions-card animate-slide-up">
            <h2 className="quick-actions-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <a 
                  key={index} 
                  href={action.href} 
                  className="action-link"
                  style={{ 
                    backgroundColor: action.bgColor, 
                    color: action.textColor,
                    borderColor: action.borderColor
                  }}
                >
                  <div className="action-icon" style={{ color: action.textColor }}>
                    {action.icon}
                  </div>
                  <span>{action.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PharmacyAdminHome;