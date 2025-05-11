import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/bookappointment.css";
import { IoMdClose } from "react-icons/io";
import toast from "react-hot-toast";

const BookAppointment = ({ setModalOpen, doctor: propDoctor }) => {
  const [formDetails, setFormDetails] = useState({
    date: "",
    time: "",
  });
  const [doctor, setDoctor] = useState(propDoctor);
  const [isAvailable, setIsAvailable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (propDoctor) {
      setDoctor(propDoctor);
    } else {
      console.error("Doctor prop is undefined");
      toast.error("Doctor information is missing");
      setModalOpen(false);
    }
  }, [propDoctor, setModalOpen]);

  useEffect(() => {
    if (formDetails.date && formDetails.time) {
      checkAvailability();
    }
  }, [formDetails.date, formDetails.time]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDetails({
      ...formDetails,
      [name]: value,
    });
  };

  const getDayFromDate = (dateString) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const checkAvailability = () => {
    if (!doctor || !formDetails.date || !formDetails.time) return;

    const selectedDay = getDayFromDate(formDetails.date);
    const dayAvailability = doctor.availability[selectedDay];

    if (!dayAvailability || !dayAvailability.isAvailable) {
      setIsAvailable(false);
      return;
    }

    // Convert times to minutes for easier comparison
    const [selectedHour, selectedMinute] = formDetails.time.split(':').map(Number);
    const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;

    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
    const endTimeInMinutes = endHour * 60 + endMinute;

    // Handle overnight availability (like 12pm to 12am)
    let isWithinAvailability;
    if (endTimeInMinutes < startTimeInMinutes) {
      // Overnight availability (e.g., 12pm to 12am)
      isWithinAvailability = selectedTimeInMinutes >= startTimeInMinutes || 
                            selectedTimeInMinutes <= endTimeInMinutes;
    } else {
      // Normal availability within same day
      isWithinAvailability = selectedTimeInMinutes >= startTimeInMinutes && 
                            selectedTimeInMinutes <= endTimeInMinutes;
    }

    setIsAvailable(isWithinAvailability);
  };

  const handleProceedToScreening = (e) => {
    e.preventDefault();
    
    if (!doctor) {
      console.error("Doctor is still undefined");
      return toast.error("Doctor information is missing");
    }

    if (!formDetails.date || !formDetails.time) {
      return toast.error("Please select date and time");
    }

    if (!isAvailable) {
      const selectedDay = getDayFromDate(formDetails.date);
      const dayAvailability = doctor.availability[selectedDay];
      
      if (!dayAvailability || !dayAvailability.isAvailable) {
        return toast.error(`Doctor is not available on ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`);
      } else {
        return toast.error(`Selected time is not within available hours (${dayAvailability.startTime} - ${dayAvailability.endTime})`);
      }
    }

    const navigationState = {
      doctor: {
        _id: doctor._id,
        userId: doctor.userId || {},
        clinicId: doctor.clinicId || {},
        feePerConsultation: doctor.feePerConsultation,
        specialization: doctor.specialization,
        experience: doctor.experience,
        availability: doctor.availability
      },
      appointmentDetails: formDetails,
      fromBooking: true
    };

    setModalOpen(false);
    
    setTimeout(() => {
      navigate('/health-screening', {
        state: navigationState,
        replace: true
      });
    }, 50);
  };

  if (!doctor) {
    return null;
  }

  return (
    <div className="modal flex-center">
      <div className="modal__content">
        <h2 className="page-heading">Book Appointment</h2>
        <IoMdClose
          onClick={() => setModalOpen(false)}
          className="close-btn"
        />

        <form className="register-form" onSubmit={handleProceedToScreening}>
          <input
            type="date"
            name="date"
            className="form-input"
            value={formDetails.date}
            onChange={handleInputChange}
            min={new Date().toISOString().split("T")[0]}
            required
          />
          <input
            type="time"
            name="time"
            className="form-input"
            value={formDetails.time}
            onChange={handleInputChange}
            required
          />
          <div className="payment-summary">
            <h4>Consultation Fee: Rs. {doctor.feePerConsultation || 'Not specified'}</h4>
            {formDetails.date && formDetails.time && !isAvailable && (
              <p className="error-message">
                {(() => {
                  const selectedDay = getDayFromDate(formDetails.date);
                  const dayAvailability = doctor.availability[selectedDay];
                  
                  if (!dayAvailability || !dayAvailability.isAvailable) {
                    return `Doctor is not available on ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`;
                  } else {
                    return `Selected time is not within available hours (${dayAvailability.startTime} - ${dayAvailability.endTime})`;
                  }
                })()}
              </p>
            )}
          </div>
          <button type="submit" className="btn form-btn">
            Proceed to Health Screening
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;