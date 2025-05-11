// PharmacyReviews.js
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import fetchData from '../helper/apiCall';
import Loading from '../components/Loading';
import "../styles/user.css";

const PharmacyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetchData(`/pharmacy/reviews`);
      if (response && response.success) {
        setReviews(response.data);
      } else {
        toast.error(response?.message || "Failed to fetch reviews");
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="user-section">
      <h3>Pharmacy Reviews</h3>
      
      <div className="user-container">
        {reviews.length > 0 ? (
          <div className="notif-section" style={{ width: '100%' }}>
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Order #</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={review.patient?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                          alt="patient" 
                          className="user-table-pic" 
                        />
                        <span>
                          {review.patient?.firstname} {review.patient?.lastname}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {[...Array(5)].map((_, i) => (
                          <span 
                            key={i} 
                            style={{ 
                              color: i < review.rating ? '#ffc107' : '#e4e5e9',
                              fontSize: '1.2rem'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="review-comment-cell">{review.comment || "No comment"}</td>
                    <td>#{review.order?.orderNumber || "N/A"}</td>
                    <td>{formatDate(review.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No reviews found for your pharmacy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyReviews;