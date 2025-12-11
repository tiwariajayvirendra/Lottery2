import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { downloadLink, userData, ticket } = location.state || {};
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    if (downloadLink && userData) {
      const timer = setTimeout(() => {
        setShowTicket(true);
      }, 6000); // 6 seconds

      return () => clearTimeout(timer);
    }
  }, [downloadLink, userData]);

  // ✅ बेहतर डाउनलोड हैंडलर जो नेविगेट करता है
  const handleDownload = (e) => {
    e.preventDefault();

    // 1. Trigger file download
    const link = document.createElement("a");
    link.href = `${backendUrl}${downloadLink}`;
    link.download = `ticket_${ticket.ticketNumber}.png`;
    document.body.appendChild(link); // Firefox के लिए आवश्यक
    link.click();
    document.body.removeChild(link); // DOM को साफ़ करें

    // 2. डाउनलोड के बाद उपयोगकर्ता को डैशबोर्ड पर भेजें
    setTimeout(() => {
      navigate('/dashboard'); // या '/' होम पेज के लिए
    }, 1000); // 1 सेकंड की देरी
  };

  if (!downloadLink || !userData || !ticket) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h1>
        <p className="text-gray-700 mb-6">We couldn't find your ticket information.</p>
        <Link to="/" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg text-center transition-all duration-500">
        {!showTicket ? (
          <div key="payment-details">
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-gray-700 mb-1">Thank you, {userData.fullName}.</p>
            <p className="text-gray-500 mb-4">Your number is being generated. Please wait...</p>

            <div className="text-left bg-gray-50 p-4 my-4 rounded-lg border text-sm space-y-2">
              <p className="text-gray-800"><strong>Ticket Number:</strong> <span className="font-mono text-blue-600">{ticket.ticketNumber}</span></p>
              {ticket.razorpayOrderId && <p className="text-gray-600"><strong>Order ID:</strong> <span className="font-mono">{ticket.razorpayOrderId}</span></p>}
              {ticket.razorpayPaymentId && <p className="text-gray-600"><strong>Payment ID:</strong> <span className="font-mono">{ticket.razorpayPaymentId}</span></p>}
              <p className="text-gray-600"><strong>Amount Paid:</strong> <span className="font-mono">₹{ticket.amountPaid}</span></p>
            </div>
          </div>
        ) : (
          <div key="ticket-display">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Number is Ready!</h2>
            <div className="my-6 border-2 border-dashed border-gray-300 p-2 rounded-lg bg-gray-50">
              <img
                src={`${backendUrl}${downloadLink}`}
                alt={`Lottery Ticket ${ticket.ticketNumber}`}
                className="w-full h-auto rounded"
              />
            </div>

            <a
              href={`${backendUrl}${downloadLink}`}
              onClick={handleDownload}
              className="w-full inline-block px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Download Your Number
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;