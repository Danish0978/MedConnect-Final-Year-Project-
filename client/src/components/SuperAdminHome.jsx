import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
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
  UserCircle, 
  CalendarDays, 
  Inbox, 
  Users,
  FilePlus,
  Bell,
  MessageSquare,
  Settings,
  Download,
  ChevronRight,
  UserPlus,
  UserCog,
  Calendar,
  FileText
} from 'lucide-react';
import '../styles/adminhome.css';
import jwt_decode from "jwt-decode";
import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminHome = () => {

  const navigate = useNavigate();
   const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [user, setUser] = useState(
      localStorage.getItem("token")
        ? jwt_decode(localStorage.getItem("token"))
        : ""
    );
  const [statsData, setStatsData] = useState({
    totalDoctors: 0,
    activeAppointments: 0,
    pendingApplications: 0,
    receptionists: 0,
    loading: true,
    error: null
  });

  const [chartData, setChartData] = useState({
    appointments: null,
    specializations: null,
    loading: true
  });
  
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Helper function to format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - activityDate) / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error('No authentication token found');
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const [
          doctorsRes, 
          appointmentsRes, 
          clinicOwnersRes, 
  pharmacyOwnersRes
        ] = await Promise.all([
          axios.get('/doctor/getalldoctors', config),
          axios.get('/appointment/superadmin/all', config),
          axios.get('/user/getallclinicowners', config),  
          axios.get('/user/getallpharmacyowners', config)
        ]);

        console.log('API Responses:', {
          doctors: doctorsRes.data,
          appointments: appointmentsRes.data,
          clinicOwners: clinicOwnersRes.data?.length || 0,  // Changed from pendingApplications
          pharmacyOwners: pharmacyOwnersRes.data?.length || 0, 
        });

        setStatsData({
          totalDoctors: doctorsRes.data.data?.length || 0,
          activeAppointments: Array.isArray(appointmentsRes.data) 
  ? appointmentsRes.data.filter(
      appt => appt.status && appt.status.toLowerCase() === 'pending'
    ).length 
  : 0,
          clinicOwners: clinicOwnersRes.data?.length || 0,  
  pharmacyOwners: pharmacyOwnersRes.data?.length || 0, 
  loading: false,
  error: null
        });

// Process chart data
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentMonth = new Date().getMonth();
const chartMonthLabels = Array.from({length: 6}, (_, i) => {
  const monthIndex = (currentMonth - 5 + i + 12) % 12;
  return monthNames[monthIndex];
});

// Process appointments data for chart
const monthlyCounts = Array(6).fill(0);
if (Array.isArray(appointmentsRes.data)) {
  appointmentsRes.data.forEach(appt => {
    const date = new Date(appt.date || appt.createdAt);
    const monthDiff = (currentMonth - date.getMonth() + 12) % 12;
    if (monthDiff < 6) {
      monthlyCounts[5 - monthDiff]++;
    }
  });
}

// Process doctors data for chart
const specializations = {};
if (Array.isArray(doctorsRes.data?.data)) {
  doctorsRes.data.data.forEach(doctor => {
    const spec = doctor.specialization || 'General';
    specializations[spec] = (specializations[spec] || 0) + 1;
  });
}

setChartData({
  appointments: {
    labels: chartMonthLabels,
    data: monthlyCounts
  },
  specializations: {
    labels: Object.keys(specializations),
    data: Object.values(specializations)
  },
  loading: false
});
// Process activities data
const newActivities = [];
        
// Add latest doctor (if exists)
// Replace the latest doctor processing code with:
if (Array.isArray(doctorsRes.data?.data) && doctorsRes.data.data.length > 0) {
    const latestDoctor = doctorsRes.data.data[doctorsRes.data.data.length - 1];
    newActivities.push({
      id: `doctor-${latestDoctor._id}`,
      title: "New Doctor Joined",
      description: `Dr. ${latestDoctor.userId?.firstname} ${latestDoctor.userId?.lastname} (${latestDoctor.specialization || 'General'})`,
      time: formatTime(latestDoctor.createdAt),
      icon: <UserCircle size={20} />,
      iconBg: "#e0e7ff",
      iconColor: "#4f46e5"
    });
  }

// Add latest 3 appointments (if exist)
// Replace the recent appointments processing code with:
if (Array.isArray(appointmentsRes.data) && appointmentsRes.data.length > 0) {
    const recentAppointments = appointmentsRes.data
      .slice(-3) // Get last 3
      .reverse(); // Newest first
      
    recentAppointments.forEach(appt => {
      newActivities.push({
        id: `appt-${appt._id}`,
        title: "Appointment Scheduled",
        description: `With Dr. ${appt.doctorId?.firstname} ${appt.doctorId?.lastname} at ${appt.time}`,
        time: formatTime(appt.createdAt),
        icon: <CalendarDays size={20} />,
        iconBg: "#dbeafe",
        iconColor: "#3b82f6"
      });
    });
  }

// Add latest 2 applications (if exist)
// if (applicationsRes.data.data?.length > 0) {
//   const recentApplications = applicationsRes.data.data
//     .filter(app => app.status === 'pending')
//     .slice(-2) // Get last 2
//     .reverse(); // Newest first
    
//   recentApplications.forEach(app => {
//     newActivities.push({
//       id: `app-${app._id}`,
//       title: "New Application",
//       description: `From ${app.userId?.firstname} ${app.userId?.lastname}`,
//       time: formatTime(app.createdAt),
//       icon: <FilePlus size={20} />,
//       iconBg: "#fef3c7",
//       iconColor: "#d97706"
//     });
//   });
// }

// Sort all activities by time (newest first)
setActivities(
    Array.isArray(newActivities) 
      ? newActivities
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 5)
      : []
  );
setActivitiesLoading(false);

} catch (error) {
console.error('Error fetching data:', error);
const errorMessage = error.response?.data?.message || 
                 error.message || 
                 'Failed to fetch data';

setStatsData(prev => ({
  ...prev,
  loading: false,
  error: errorMessage
}));
setChartData(prev => ({
  ...prev,
  loading: false
}));
setActivitiesLoading(false);
}
};

fetchStatsData();
}, []);

  const stats = [
    {
      title: "Total Doctors",
      value: statsData.loading ? "..." : (statsData.totalDoctors || 0).toString(),
      icon: <UserCircle size={24} />,
      iconBg: "#e0e7ff",
      iconColor: "#4f46e5",
      barColor: "#4f46e5",
      link: "/admin/dashboard/doctors",
      increase: 8,
      period: "vs last month"
    },
    {
      title: "Active Appointments",
      value: statsData.loading ? "..." : (statsData.activeAppointments || 0).toString(),
      icon: <CalendarDays size={24} />,
      iconBg: "#dbeafe",
      iconColor: "#3b82f6",
      barColor: "#3b82f6",
      link: "/admin/dashboard/appointments",
      increase: 12,
      period: "vs last week"
    },
    {
        title: "Clinic Owners",
        value: statsData.loading ? "..." : (statsData.clinicOwners || 0).toString(),
        icon: <Users size={24} />,
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        barColor: "#d97706",
        link: "/admin/dashboard/clinics-owners",
        increase: 3,
        period: "new today"
      },
      {
        title: "Pharmacy Owners",
        value: statsData.loading ? "..." : (statsData.pharmacyOwners || 0).toString(),
        icon: <Users size={24} />,
        iconBg: "#f3e8ff",
        iconColor: "#9333ea",
        barColor: "#9333ea",
        link: "/admin/dashboard/pharmacies-owners",
        increase: 5,
        period: "vs last quarter"
      }
  ];

  // Chart configurations
  const appointmentsChart = {
    labels: chartData.appointments?.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Appointments",
        data: chartData.appointments?.data || [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(79, 70, 229, 0.7)',
          'rgba(79, 70, 229, 0.6)',
          'rgba(79, 70, 229, 0.5)',
          'rgba(79, 70, 229, 0.4)',
          'rgba(79, 70, 229, 0.3)',
        ],
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const specializationsChart = {
    labels: chartData.specializations?.labels || ["General"],
    datasets: [
      {
        data: chartData.specializations?.data || [1],
        backgroundColor: [
          "rgba(79, 70, 229, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(249, 115, 22, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
        borderColor: [
          "rgba(79, 70, 229, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(249, 115, 22, 1)",
          "rgba(139, 92, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
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
          color: "rgba(107, 114, 128, 1)"
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
  // const activities = [
  //   { 
  //     id: 1, 
  //     title: "New Doctor Joined", 
  //     description: "Dr. Muhammad Kaif (Heart Specialist)", 
  //     time: "2 hours ago", 
  //     icon: <UserCircle size={20} />,
  //     iconBg: "#e0e7ff",
  //     iconColor: "#4f46e5"
  //   },
  //   { 
  //     id: 2, 
  //     title: "Appointments", 
  //     description: "5 new appointments scheduled", 
  //     time: "5 hours ago", 
  //     icon: <CalendarDays size={20} />,
  //     iconBg: "#dbeafe",
  //     iconColor: "#3b82f6"
  //   },
  //   { 
  //     id: 3, 
  //     title: "Applications", 
  //     description: "3 new doctor applications received", 
  //     time: "1 day ago", 
  //     icon: <FilePlus size={20} />,
  //     iconBg: "#fef3c7",
  //     iconColor: "#d97706"
  //   },
  //   { 
  //     id: 4, 
  //     title: "System Update", 
  //     description: "New features added to dashboard", 
  //     time: "2 days ago", 
  //     icon: <Bell size={20} />,
  //     iconBg: "#f3e8ff",
  //     iconColor: "#9333ea"
  //   }
  // ];

  const quickActions = [
    {
      href: "/admin/dashboard/users",
      label: "Manage Users",
      icon: <UserCog size={20} />,
      bgColor: "#eef2ff",
      textColor: "#4338ca",
      borderColor: "#e0e7ff"
    },
    {
      href: "/admin/dashboard/transactions",
      label: "Review Transactions",
      icon: <FileText size={20} />,
      bgColor: "#dbeafe",
      textColor: "#1e40af",
      borderColor: "#bfdbfe"
    },
    {
      href: "/admin/dashboard/appointments",
      label: "Manage Appointments",
      icon: <Calendar size={20} />,
      bgColor: "#ecfdf5",
      textColor: "#047857",
      borderColor: "#d1fae5"
    },
    {
      href: "/admin/dashboard/orders",
      label: "Review Orders",
      icon: <FileText size={20} />,
      bgColor: "#fffbeb",
      textColor: "#b45309",
      borderColor: "#fef3c7"
    }
  ];

  return (
    <div className="admin-dashboard">
      <header className="header">
        <div className="header-container">
          {/* <div className="logo-section">
            <div className="logo">
              <span>MD</span>
            </div>
            <span className="logo-text">MedAdmin</span>
            <nav className="nav-links">
              <a href="#" className="nav-link active">Dashboard</a>
              <a href="#" className="nav-link">Doctors</a>
              <a href="#" className="nav-link">Appointments</a>
              <a href="#" className="nav-link">Reports</a>
            </nav>
          </div>
          <div className="header-actions">
            <button className="header-button">
              <span className="sr-only">View notifications</span>
              <Bell size={20} />
            </button>
            <button className="header-button">
              <span className="sr-only">View messages</span>
              <MessageSquare size={20} />
            </button>
            <button className="header-button">
              <span className="sr-only">Settings</span>
              <Settings size={20} />
            </button>
            <div className="user-avatar">
              <span>AD</span>
            </div>
          </div> */}
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Welcome back to your medical admin dashboard</p>
        </div>
        
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <a href={stat.link} key={index} className="stat-card animate-fade-in">
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
              <h2 className="chart-title">Monthly Appointments</h2>
              <p className="chart-subtitle">Last 6 months activity</p>
            </div>
            <div className="chart-actions">
              <button className="action-button">
                <Download size={16} />
              </button>
              <button className="view-all-button" onClick={() => navigate('/admin/dashboard/appointments')}>
                View All <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            {chartData.loading ? (
              <div className="chart-loading">Loading appointments data...</div>
            ) : (
              <Bar 
                data={appointmentsChart} 
                options={{ ...chartOptions, plugins: { legend: { display: false } } }} 
              />
            )}
          </div>
        </div>
        
        <div className="chart-card animate-slide-up">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Doctors by Specialization</h2>
              <p className="chart-subtitle">Distribution across departments</p>
            </div>
            <div className="chart-actions">
              <button className="action-button">
                <Download size={16} />
              </button>
              <button className="view-all-button" onClick={() => navigate('/admin/dashboard/doctors')}>
                View All <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            {chartData.loading ? (
              <div className="chart-loading">Loading specialization data...</div>
            ) : (
              <Pie 
                data={specializationsChart} 
                options={{ ...chartOptions, cutout: '60%' }} 
              />
            )}
          </div>
        </div>
      </div>
      <div className="activities-container">
        <div className="activities-card animate-slide-up">
          <div className="activities-header">
            <h2 className="activities-title">Recent Activities</h2>
            <button 
              className="view-all-button"
              onClick={() => navigate('/admin/dashboard')}
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          {activitiesLoading ? (
            <div className="activities-loading">
              Loading activities...
            </div>
          ) : (
            <div className="activities-list">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div 
                      className="activity-icon" 
                      style={{ backgroundColor: activity.iconBg, color: activity.iconColor }}
                    >
                      {activity.icon}
                    </div>
                    <div className="activity-content">
                      <h3 className="activity-title">{activity.title}</h3>
                      <p className="activity-description">{activity.description}</p>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                ))
              ) : (
                <div className="no-activities">
                  No recent activities found
                </div>
              )}
            </div>
          )}
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

export default SuperAdminHome;