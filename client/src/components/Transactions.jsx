import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from "react-hot-toast";
import Loading from './Loading';
import { setLoading } from '../redux/reducers/rootSlice';
import { useDispatch, useSelector } from 'react-redux';
import Empty from './Empty';
import "../styles/user.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.root);

  const fetchTransactions = async () => {
    try {
      dispatch(setLoading(true));
      const { data } = await axios.get('/payment/transactions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTransactions(data.data);
      dispatch(setLoading(false));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch transactions');
      dispatch(setLoading(false));
    }
  };

  const formatDateTime = (dateString, timeString = '') => {
    const date = new Date(dateString);
    
    // Extract date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Handle time if provided
    if (timeString) {
      return `${year}-${month}-${day} ${timeString}`;
    }
    
    // Format time for payment date (from ISO string)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  
  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <section className="user-section">
          <h3 className="home-sub-heading">All Transactions</h3>
          {transactions.length > 0 ? (
            <div className="user-container">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Transaction ID</th>
                    <th>Patient</th>
                    <th>Patient Email</th>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Amount</th>
                    <th>Appointment Date</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.map((ele, i) => (
                    <tr key={ele?._id}>
                      <td>{i + 1}</td>
                      <td className="transaction-id">
                        <code>{ele?.transactionId}</code>
                      </td>
                      <td>
                        {ele?.patientInfo?.name || 'N/A'}
                        
                      </td>
                      <td>{ele?.patientInfo?.email && (
                          <div className="patient-email">{ele.patientInfo.email}</div>
                        )}</td>
                      <td>
                        {ele?.doctorInfo?.name ? `Dr. ${ele.doctorInfo.name}` : 'N/A'}
                      </td>
                      <td>{ele?.doctorInfo?.specialization || 'N/A'}</td>
                      <td>Rs. {ele?.amount}</td>
                      <td>
                        {ele?.date} {ele?.time}
                      </td>
                      <td>{formatDateTime(ele?.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${ele?.status === 'completed' ? 'completed' : 'failed'}`}>
                          {ele?.status?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </section>
      )}
    </>
  );
};

export default Transactions;