import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import QRCode from "react-qr-code";

const NumberPurchaseModal = ({ number, amount, skimId, onClose, onPurchase }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    state: "",
    age: "",
    aadhaar: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);
  const ticketRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // Ticket formatter (copied from LotteryGrid for use here)
  const formatTicketNumber = (skimId, num) => {
    const skimIdStr = skimId.toString();
    switch (skimIdStr) {
      case "1": return `AB${num}A`;
      case "2": return `CD${num}B`;
      case "3": return `EF${num}C`;
      case "4": return `GH${num}D`;
      default: return `${skimIdStr}-${num}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize mobile number input to only allow digits
    if (name === "mobile") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName) errs.fullName = "Full name is required";
    if (!/^\d{10}$/.test(formData.mobile)) errs.mobile = "Mobile must be 10 digits";
    if (!formData.state) errs.state = "State is required";
    if (!formData.age || !(parseInt(formData.age) >= 18)) errs.age = "Age must be 18 or over";
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) errs.aadhaar = "Aadhaar must be 12 digits";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Please enter a valid email address";
    return errs;
  };

  const handlePayment = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    // Check if Razorpay script is loaded
    if (typeof window.Razorpay === "undefined") {
      setErrors({ general: "Razorpay payment gateway is not loaded. Please refresh the page and try again." });
      setLoading(false);
      return;
    }

    if (!razorpayKeyId) {
      setErrors({ general: "Razorpay Key ID is not configured. Please contact support." });
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Create order on backend
      const res = await fetch(`${backendUrl}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          ticketNumber: number,
          skimId: skimId,
          userData: formData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.hint || `Failed to create order. Status: ${res.status}`;
        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      if (!responseData.order) {
        throw new Error("Order creation failed: Invalid response from server");
      }

      const { order } = responseData;

      // 2️⃣ Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Lottery Ticket",
        description: `Ticket #${number}`,
        order_id: order.id,
        handler: async (response) => {
          setLoading(true);
          try {
            // Verify payment on backend
            const verifyRes = await fetch(`${backendUrl}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ticketNumber: number,
                skimId: skimId,
                amount,
                userData: formData,
              }),
            });

            const data = await verifyRes.json();
            if (verifyRes.ok) {
              setPurchaseSuccessData(data); // Show success view instead of closing
              onPurchase(data); // Notify parent to update purchased numbers
            } else {
              // Display the specific error from the backend
              const serverErrorMessage = data.message || data.hint || "Payment verification failed on the server.";
              if (verifyRes.status === 409) {
                setErrors({ aadhaar: serverErrorMessage });
              } else {
                setErrors({ general: serverErrorMessage });
              }
            }
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            setErrors({ general: "Failed to verify payment. Please contact support with your payment ID." });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.mobile,
        },
        notes: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          skimId: skimId,
        },
        modal: {
          ondismiss: function () {
            setErrors({ general: "Payment was cancelled." });
            setLoading(false);
          },
        },
        theme: { color: "#FF4444" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response);
        setErrors({ general: `Payment failed: ${response.error?.description || "Unknown error"}` });
        setLoading(false);
      });
      rzp.open();
      // Do not set loading to false here. It's handled by Razorpay's callbacks.
    } catch (err) {
      console.error("Payment initiation error:", err);
      setErrors({ general: `Payment initiation failed: ${err.message}` });
      setLoading(false);
    }
  };

  const handleDownloadTicket = () => {
    if (ticketRef.current) {
      html2canvas(ticketRef.current, {
        useCORS: true,
        scale: 2, // Higher scale for better quality
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `ticket-${formatTicketNumber(skimId, number)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  // Success View
  if (purchaseSuccessData) {
    const formattedTicket = formatTicketNumber(skimId, number);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold">×</button>
          <div ref={ticketRef} className="bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-green-700 mb-2">Purchase Successful!</h2>
            <p className="text-gray-600 mb-4">Please take a screenshot and download your ticket.</p>
            <div className="border-2 border-dashed border-gray-400 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Ticket Number</p>
              <p className="text-4xl font-extrabold text-indigo-700 tracking-wider my-2">{formattedTicket}</p>
              <div className="flex justify-center my-4">
                <div style={{ background: 'white', padding: '8px' }}>
                  <QRCode value={JSON.stringify({ ticket: formattedTicket, name: formData.fullName })} size={80} />
                </div>
              </div>
              <p className="text-sm text-gray-500">Name: <span className="font-semibold">{formData.fullName}</span></p>
              <p className="text-sm text-gray-500">Mobile: <span className="font-semibold">{formData.mobile}</span></p>
            </div>
          </div>
          <button
            onClick={handleDownloadTicket}
            className="mt-6 w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-all duration-200"
          >
            {loading ? "Downloading..." : "Download Ticket"}
          </button>
        </div>
      </div>
    );
  }

  // Purchase Form View
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold">×</button>
        <h2 className="text-2xl font-bold text-center mb-4">Purchase Ticket #{number}</h2>
        <p className="text-center text-lg font-semibold text-indigo-600 mb-6">Amount to Pay: ₹{amount}</p>
        {errors.general && <p className="text-red-500 text-sm text-center mb-4">{errors.general}</p>}

        <form className="w-full flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {["fullName", "mobile", "state", "age", "aadhaar", "email"].map((field) => (
            <div key={field}>
              <input
                type={field === "age" || field === "mobile" ? "tel" : field === "email" ? "email" : "text"}
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                maxLength={field === "mobile" ? 10 : field === "aadhaar" ? 12 : undefined}
                value={formData[field]}
                onChange={handleChange}
                className={`border p-3 rounded w-full transition-all ${errors[field] ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 focus:ring-1 focus:ring-indigo-500"}`}
              />
              {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
            </div>
          ))}

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            className="mt-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 w-full transition-all duration-200 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Pay & Get Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NumberPurchaseModal;
