import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../styles/feedback.css';

// Update your existing FeedbackModal component to handle both doctor and pharmacy reviews
const FeedbackModal = ({ order, appointment, onClose, onSubmit, entityType, entityId }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
  
    const entityName = entityType === 'doctor' 
      ? `${appointment?.doctorId?.firstname} ${appointment?.doctorId?.lastname}`
      : order?.pharmacy?.name;
  
      const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate rating is selected
        if (rating === 0) {
          toast.error('Please select a rating');
          return;
        }
      
        setSubmitting(true);
      
        try {
          // Validate we have the required data
          if (!entityType) {
            throw new Error('Missing entity type');
          }
          if (!entityId) {
            throw new Error('Missing entity Id');
          }
          // Prepare the base payload
          const payload = {
            type: entityType,
            entityId: entityId,
            rating: rating,
            comment: comment || ''
          };
      
          // Add the reference ID based on entity type
          if (entityType === 'doctor') {
            if (!appointment?._id) {
              throw new Error('Appointment information is missing');
            }
            payload.appointmentId = appointment._id;
          } else {
            if (!order?._id) {
              throw new Error('Order information is missing');
            }
            payload.orderId = order._id;
          }
      
          console.log('Submitting feedback with payload:', payload); // Debug log
      
          await toast.promise(
            axios.post(
              '/feedback/submit',
              payload,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              }
            ),
            {
              loading: 'Submitting feedback...',
              success: 'Feedback submitted successfully!',
              error: (err) => {
                return err.response?.data?.message || err.message || 'Failed to submit feedback';
              }
            }
          );
          
          onSubmit();
        } catch (error) {
          console.error('Feedback submission error:', error);
          toast.error(error.message);
        } finally {
          setSubmitting(false);
        }
      };
  
    return (
      <div className="feedback-modal-overlay">
        <div className="feedback-modal">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>Rate Your Experience</h2>
          <p>How was your {entityType === 'doctor' ? 'appointment' : 'order'} with {entityName}?</p>
          
          <form onSubmit={handleSubmit}>
            <div className="star-rating">
              {[...Array(5)].map((star, i) => {
                const ratingValue = i + 1;
                return (
                  <label key={i}>
                    <input
                      type="radio"
                      name="rating"
                      value={ratingValue}
                      onClick={() => setRating(ratingValue)}
                    />
                    <FaStar
                      className="star"
                      color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                      size={40}
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(null)}
                    />
                  </label>
                );
              })}
            </div>
            
            <div className="form-group">
              <label htmlFor="comment">Your Feedback (optional)</label>
              <textarea
                id="comment"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share details about your ${entityType === 'doctor' ? 'appointment' : 'order'} experience...`}
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={rating === 0 || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    );
  };

export default FeedbackModal;