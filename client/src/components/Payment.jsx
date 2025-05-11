import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/bookappointment.css";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from "@stripe/react-stripe-js";
import axios from "axios";
import toast from "react-hot-toast";
import { IoMdClose } from "react-icons/io";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ doctor, appointmentDetails, onSuccess, navigate }) => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  const handleChange = (event) => {
    setCardComplete({
      ...cardComplete,
      [event.elementType]: event.complete,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    
    try {
      const { data } = await axios.post("/payment/create-payment-intent", {
        doctorId: doctor._id,
        date: appointmentDetails.date,
        time: appointmentDetails.time,
        amount: doctor.feePerConsultation,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret, {
          payment_method: {
            card: elements.getElement(CardNumberElement),
          },
        }
      );

      if (error) throw error;

      if (paymentIntent.status === "succeeded") {
        await axios.post("/payment/confirm-payment", {
          paymentIntentId: paymentIntent.id,
          doctorId: doctor.userId._id,
          date: appointmentDetails.date,
          time: appointmentDetails.time,
          doctorname: `${doctor.userId.firstname} ${doctor.userId.lastname}`,
          amount: doctor.feePerConsultation,
          screeningData: location.state?.screeningData
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        navigate('/doctors');
        toast.success("Payment successful! Appointment booked.");
      }
    } catch (error) {
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-details">
        <h4>Payment Details</h4>
        <p>Doctor: Dr. {doctor.userId.firstname} {doctor.userId.lastname}</p>
        <p>Date: {appointmentDetails.date}</p>
        <p>Time: {appointmentDetails.time}</p>
        <p>Amount: Rs. {doctor.feePerConsultation}</p>
      </div>

      <div className="card-element-container">
        <div className="card-input">
          <label>Card Number</label>
          <div className="stripe-element-wrapper">
            <CardNumberElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                },
              }}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="card-input">
          <label>Expiration Date</label>
          <div className="stripe-element-wrapper">
            <CardExpiryElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                  },
                },
              }}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="card-input">
          <label>CVC</label>
          <div className="stripe-element-wrapper">
            <CardCvcElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                  },
                },
              }}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="payment-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate('/doctors')}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="pay-btn"
          disabled={!stripe || isProcessing || !Object.values(cardComplete).every(Boolean)}
        >
          {isProcessing ? "Processing..." : `Pay Rs. ${doctor.feePerConsultation}`}
        </button>
      </div>
    </form>
  );
};

const Payment = ({ setModalOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctor, appointmentDetails } = location.state || {};

  if (!doctor || !appointmentDetails) {
    navigate('/doctors');
    return null;
  }

  return (
    <div className="modal flex-center">
      <div className="modal__content">
        <h2 className="page-heading">Complete Payment</h2>
        <IoMdClose
          onClick={() => setModalOpen(false)}
          className="close-btn"
        />
        
        <Elements stripe={stripePromise}>
          <PaymentForm
            doctor={doctor}
            appointmentDetails={appointmentDetails}
            onSuccess={() => setModalOpen(false)}
            navigate={navigate}
          />
        </Elements>
      </div>
    </div>
  );
};

export default Payment;