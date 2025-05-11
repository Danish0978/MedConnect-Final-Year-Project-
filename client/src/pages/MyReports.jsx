import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../redux/reducers/rootSlice';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/doctorPrescriptions.css';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);
  const [user] = useState(
    localStorage.getItem("token")
      ? jwt_decode(localStorage.getItem("token"))
      : null
  );

  const fetchReports = async () => {
    try {
      dispatch(setLoading(true));
      const { data } = await axios.get("/predict/report", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setReports(data?.data || []);
      setFilteredReports(data?.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => { fetchReports(); }, []);

  useEffect(() => {
    if (reports.length > 0) {
      const filtered = user?.isDoctor 
        ? reports.filter(report => 
            `${report.patient?.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : reports;
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports, user?.isDoctor]);

  const renderFeatures = (features) => {
    if (!features) return null;
    
    return (
      <div className="features-section">
        <h4>Clinical Parameters</h4>
        <div className="features-grid">
          {Object.entries(features).map(([key, value]) => (
            <p key={key}>
              <strong>{key.split(/(?=[A-Z])/).join(' ')}:</strong> 
              {typeof value === 'boolean' ? (value ? ' Yes' : ' No') : ` ${value}`}
            </p>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="doctor-prescriptions-section">
        <h1 className="page-heading">My Health Reports</h1>
        
        {user?.isDoctor && (
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {error ? (
          <p className="error-message">{error}</p>
        ) : filteredReports.length > 0 ? (
          <div className="prescriptions-list">
            {filteredReports.map((report) => (
              <div key={report._id} className="prescription-card">
                <h3 className="report-title">
                  {report.type === 'diabetes' ? 'Diabetes Risk Assessment' : 'COVID-19 Screening'}
                </h3>
                
                <div className="report-header">
                  <p><strong>Date:</strong> {report.date} at {report.time}</p>
                  <p><strong>Risk Score:</strong> {(report.prediction * 100).toFixed(2)}%</p>
                  <p className={`result-${report.predictionResult}`}>
                    <strong>Conclusion:</strong> {report.predictionResult === 1 ? 'Positive' : 'Negative'}
                  </p>
                </div>

                {user?.isDoctor && report.patient && (
                  <div className="patient-info">
                    <h4>Patient Details</h4>
                    <p><strong>Name:</strong> {report.patient.name}</p>
                    <p><strong>Email:</strong> {report.patient.contact?.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> {report.patient.contact?.phone || 'Not provided'}</p>
                  </div>
                )}

                {renderFeatures(report.features)}
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <p className="no-results">No matching reports found</p>
        ) : (
          <Empty message="No reports available" />
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyReports;