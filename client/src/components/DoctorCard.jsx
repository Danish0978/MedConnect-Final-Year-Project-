// DoctorCard.js (updated)
import "../styles/doctorcard.css";
import React, { useState } from "react";
import BookAppointment from "../components/BookAppointment";
import ReceptionistBookAppointment from "../components/ReceptionistBookAppointment";
import { toast } from "react-hot-toast";
import jwt_decode from "jwt-decode";
import { FaStar } from "react-icons/fa";

const DoctorCard = ({ ele }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("token")
      ? jwt_decode(localStorage.getItem("token"))
      : ""
  );
  const [expanded, setExpanded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const handleModal = () => {
    if (token === "") {
      return toast.error("You must log in first");
    }
    setModalOpen(true);
  };
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  // Format timings for display
  const formatTimings = (timings) => {
    if (!timings || timings.length !== 2) return "Not specified";
    const [start, end] = timings;
    return `${start}:00 - ${end}:00`;
  };

  const toggleReviews = () => {
    setShowAllReviews(!showAllReviews);
  };

  const displayedReviews = showAllReviews 
    ? ele.feedbacks 
    : ele.feedbacks?.slice(0, 2);

  return (
    <div className={`card`}>
      <div className="card-img-container">
        <div className={`card-img flex-center`}>
          <img
            src={
              ele?.userId?.pic ||
              "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
            }
            alt="profile"
          />
        </div>
        {ele.averageRating && (
          <div className="rating-badge">
            <FaStar className="star-icon filled" />
            <span>{ele.averageRating}</span>
            {ele.totalReviews > 0 && (
              <span className="review-count">({ele.totalReviews})</span>
            )}
          </div>
        )}
      </div>

      <h3 className="card-name">
        Dr. {ele?.userId?.firstname + " " + ele?.userId?.lastname}
      </h3>
      <p className="specialization">
        <strong>Specialization: </strong>
        {ele?.specialization}
      </p>
      <p className="experience">
        <strong>Experience: </strong>
        {ele?.experience}yrs
      </p>
      <p className="fees">
        <strong>Fees per consultation: </strong>
        Rs. {ele?.feePerConsultation}
      </p>
      <p className="clinic">
        <strong>Clinic: </strong>
        {ele?.clinicId?.name || "Not specified"}
      </p>
      <p className="clinic-address">
        <strong>Clinic Address: </strong>
        {ele?.clinicId?.address || "Not specified"}
      </p>
      <p className="clinic">
        <strong>Clinic Phone: </strong>
        {ele?.clinicId?.contact?.phone || "Not specified"}
      </p>
      <p className="clinic">
        <strong>Clinic Email: </strong>
        {ele?.clinicId?.contact?.email || "Not specified"}
      </p>

      {/* Availability Section */}
      <div className="availability">
        <h4>Availability</h4>
        {Object.entries(ele?.availability || {}).map(([day, value]) => {
          if (value.isAvailable) {
            return (
              <div key={day} className="day-availability">
                <p className="day">
                  <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                  <span className="time">
                    {value.startTime} - {value.endTime}
                  </span>
                </p>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Reviews Section
      {ele.feedbacks?.length > 0 && (
        <div className="reviews-section">
          <h4>Patient Reviews</h4>
          <div className="reviews-container">
            {displayedReviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">
                    {review.patient?.firstname || 'Anonymous'}
                  </span>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={`star-icon ${i < review.rating ? 'filled' : ''}`} 
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="review-comment">"{review.comment}"</p>
                )}
              </div>
            ))}
          </div>
          {ele.feedbacks.length > 2 && (
            <button className="toggle-reviews-btn" onClick={toggleReviews}>
              {showAllReviews ? 'Show Less' : `Show All (${ele.feedbacks.length})`}
            </button>
          )}
        </div>
      )} */}

      <button className="btn appointment-btn" onClick={handleModal}>
        {user.isReceptionist ? "Book for Patient" : "Book Appointment"}
      </button>

      <span style={{ cursor: "pointer" }} className="reviews-btn" onClick={toggleExpand}>
  {expanded ? 'Hide Details' : 'View Reviews'}
</span>

{expanded && (
  <div className="reviews-expanded">
    <h4>Patient Reviews</h4>
    <div className="reviews-list">
      {ele.feedbacks?.length > 0 ? (
        ele.feedbacks.map((review, index) => (
          <div key={index} className="review-item">
            <div className="review-header">
              <span className="reviewer-name">
                {review.patient?.firstname || 'Anonymous'}
              </span>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`star-icon ${i < review.rating ? 'filled' : ''}`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="review-comment">"{review.comment}"</p>
            )}
          </div>
        ))
      ) : (
        <p>No reviews yet.</p>
      )}
    </div>
  </div>
)}

      {modalOpen && (
        user.isReceptionist ? (
          <ReceptionistBookAppointment 
            doctor={ele}
            onClose={() => setModalOpen(false)}
          />
        ) : (
          <BookAppointment setModalOpen={setModalOpen} doctor={ele} />
        )
      )}
    </div>
  );
};

export default DoctorCard;