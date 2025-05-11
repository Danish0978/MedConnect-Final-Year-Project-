import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loading from "../components/Loading";
import '../styles/FindPatient.css';

const FindPatient = () => {
  const [email, setEmail] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter patient email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        '/receptionist/check-patient',
        { email },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (data.exists) {
        setPatient(data.patient);
        toast.success('Patient found!');
      } else {
        setPatient(null);
        toast('No patient found with this email');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="find-patient-container">
        <div className="find-patient-card">
          <h2>Find Patient</h2>
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label>Patient Email</label>
              <div className="search-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter patient email"
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {loading && <Loading />}

          {patient && (
            <div className="patient-details-card">
              <h3>Patient Details</h3>
              <div className="patient-info">
                <img className='user-table-pic' src={patient.pic} alt={patient.name} />
                <p><strong>Name:</strong> {patient.name}</p>
                <p><strong>Email:</strong> {patient.email}</p>
                <p><strong>Contact:</strong> {patient.contact || 'Not provided'}</p>
                <p><strong>Age:</strong> {patient.age || 'Not provided'}</p>
                <p><strong>Gender:</strong> {patient.gender || 'Not provided'}</p>
              </div>
            </div>
          )}

          {!patient && !loading && (
            <div className="no-patient">
              <p>No patient information to display</p>
              <p>Search for a patient using their email</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FindPatient;