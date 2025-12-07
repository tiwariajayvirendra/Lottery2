import React, { useState, useEffect, useRef } from "react";
import NumberPurchaseModal from "../components/numberpurchaseModel.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { skims as allSkims } from "../layouts/dashboardlayout.jsx";

const LotteryPage = () => {
  const navigate = useNavigate();
  const { powerNumber: skimId } = useParams();

  // =============================================================================
  // ✨ DYNAMIC NUMBERING LOGIC
  // =============================================================================
  const getStartingNumberForSkim = (id) => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId < 1) {
      return 10001; // default fallback
    }
    return (numericId - 1) * 10000 + 10001;
  };

  const TOTAL_NUMBERS = 10000;
  const START_NUMBER = getStartingNumberForSkim(skimId);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const currentSkim = allSkims.find((s) => s.id.toString() === String(skimId));

  useEffect(() => {
    if (!currentSkim) {
      console.error("Invalid skim ID:", skimId);
      // navigate back a bit after short delay so user can see console if dev
      setTimeout(() => navigate("/dashboard"), 100);
    }
  }, [currentSkim, skimId, navigate]);

  // =============================================================================
  // state
  // =============================================================================
  const [purchasedNumbers, setPurchasedNumbers] = useState(new Set());
  const [loading, setLoading] = useState(true); // initial loading of sold tickets
  const [soldTicketsLoading, setSoldTicketsLoading] = useState(true);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [activeTab, setActiveTab] = useState("lottery");

  // Lazy-batch state: show only visibleCount numbers (increase by 100 on scroll)
  const BATCH_SIZE = 100;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  // ref for scroll container to reset to top on skim change
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // reset visible count and scroll when skim changes
    setVisibleCount(BATCH_SIZE);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [skimId]);

  // =============================================================================
  // Format number by skim (example custom formatting)
  // =============================================================================
  const formatTicketNumber = (skimIdVal, num) => {
    switch (String(skimIdVal)) {
      case "1":
        return `AB${num}A`;
      case "2":
        return `CD${num}B`;
      case "3":
        return `EF${num}C`;
      case "4":
        return `GH${num}D`;
      default:
        return `${skimIdVal}-${num}`;
    }
  };

  // =============================================================================
  // Fetch purchased tickets from backend
  // =============================================================================
  const fetchPurchasedTickets = async () => {
    setLoading(true);
    setSoldTicketsLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/tickets/skim-status/${skimId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      // Normalize numbers to numeric values
      const cleaned =
        Array.isArray(data.soldTickets) && data.soldTickets.length
          ? data.soldTickets
              .map((n) => {
                if (typeof n === "string" && n.match(/[A-Z]*\d+[A-Z]*/)) {
                  const match = n.match(/\d+/);
                  return match ? parseInt(match[0], 10) : Number(n);
                }
                return Number(n);
              })
              .filter((nn) => !isNaN(nn))
          : [];

      setPurchasedNumbers(new Set(cleaned));
    } catch (err) {
      console.error("Error fetching purchased tickets", err);
      setPurchasedNumbers(new Set());
    } finally {
      setLoading(false);
      setSoldTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (skimId) fetchPurchasedTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skimId]);

  // =============================================================================
  // All numbers array (10k numbers but we slice for UI)
  // =============================================================================
  const allNumbers = React.useMemo(
    () => Array.from({ length: TOTAL_NUMBERS }, (_, i) => START_NUMBER + i),
    [START_NUMBER]
  );

  // =============================================================================
  // Handle click / purchase
  // =============================================================================
  const handleNumberClick = (num) => {
    if (!purchasedNumbers.has(num)) {
      setSelectedNumber(num);
    }
  };

  const handleSuccessfulPurchase = (data) => {
    const newlyPurchasedNumber = Number(data.ticket?.ticketNumber ?? data.ticketNumber ?? data);
    if (!isNaN(newlyPurchasedNumber)) {
      setPurchasedNumbers((prev) => {
        const copy = new Set(prev);
        copy.add(newlyPurchasedNumber);
        return copy;
      });
    }
  };

  const handleModalClose = () => setSelectedNumber(null);

  // =============================================================================
  // Scroll handler to load next batch when near bottom
  // =============================================================================
  const handleScroll = (e) => {
    const target = e.target;
    // threshold px from bottom to trigger
    const threshold = 120;

    if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
      // load next batch
      setVisibleCount((prev) => {
        if (prev >= TOTAL_NUMBERS) return prev;
        return Math.min(prev + BATCH_SIZE, TOTAL_NUMBERS);
      });
    }
  };

  // =============================================================================
  // Render
  // =============================================================================
  return (
    <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-100 to-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
          🎯 Christmas Special Lottery 🎁 Skim no - {skimId}
        </h1>

        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
        {[
          { id: "lottery", label: "🎟 Lottery Numbers" },
          { id: "steps", label: "📖 How to Purchase" },
          { id: "sold", label: "Sold Tickets" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 whitespace-nowrap rounded-lg font-semibold ${
              activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LOTTERY TAB */}
      {activeTab === "lottery" ? (
        <div className="relative min-h-[70vh] p-2 rounded-lg shadow bg-white">
          {loading ? (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600"></div>
              <p className="mt-4 text-lg text-gray-600">Loading Tickets...</p>
            </div>
          ) : (
            // Scroll container which will lazy-load next batches
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2 overflow-auto max-h-[calc(70vh-1rem)]"
            >
              {allNumbers.slice(0, visibleCount).map((num) => {
                const displayNum = formatTicketNumber(skimId, num);
                const isPurchased = purchasedNumbers.has(num);

                return (
                  <div
                    key={displayNum}
                    onClick={() => !isPurchased && handleNumberClick(num)}
                    className={`
                      relative flex items-center justify-center
                      aspect-square rounded-lg shadow font-semibold
                      text-[0.55rem] sm:text-xs md:text-sm text-center
                      transition-all
                      ${isPurchased ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-br from-green-400 to-blue-600 text-white hover:scale-105 cursor-pointer"}
                    `}
                    style={{ minWidth: "45px" }}
                  >
                    {displayNum}

                    {isPurchased && (
                      <div className="absolute bottom-0 text-white bg-red-600 px-1 py-0.5 text-[7px] sm:text-[8px] font-bold rounded">
                        SOLD
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* show a small loader or hint when more items available */}
          {!loading && visibleCount < TOTAL_NUMBERS && (
            <div className="mt-3 text-center text-sm text-gray-500">Loading more numbers...</div>
          )}
        </div>
      ) : activeTab === "steps" ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-gray-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-lg sm:text-xl font-bold mb-3">📖 Steps to Purchase (English + Hindi)</h2>

          <ol className="list-decimal ml-5 space-y-2">
            <li>
              <b>Go to the Skim number and click.</b>
              <br />
              स्कीम नंबर पर जाएं और क्लिक करें।
            </li>

            <li>
              <b>Select your favourite number.</b>
              <br />
              अपना पसंदीदा नंबर चुनें।
            </li>

            <li>
              <b>You will get a form. Enter valid details (for KYC in case of winning).</b>
              <br />
              आपको एक फॉर्म मिलेगा। उसमें सही जानकारी भरें (जीतने पर KYC के लिए)।
            </li>

            <li>
              <b>Click on Pay option. Razorpay will open.</b>
              <br />
              पे ऑप्शन पर क्लिक करें। Razorpay खुलेगा।
            </li>

            <li>
              <b>Enter your UPI ID, approve payment in your UPI app, and enter UPI password.</b>
              <br />
              अपना UPI ID डालें, UPI ऐप में पेमेंट को अप्रूव करें और UPI पासवर्ड डालें।
            </li>

            <li>
              <b>You will see your ticket. Take a screenshot.</b>
              <br />
              आपको अपना टिकट दिखेगा। उसका स्क्रीनशॉट लें।
            </li>

            <li>
              <b>After a few seconds, download option will appear. Download and take another screenshot.</b>
              <br />
              कुछ सेकंड बाद डाउनलोड ऑप्शन आएगा। टिकट डाउनलोड करें और फिर से स्क्रीनशॉट लें।
            </li>

            <li>
              <b>If download fails due to technical issue, revisit the website.</b>
              <br />
              अगर तकनीकी समस्या के कारण डाउनलोड नहीं होता है, तो वेबसाइट पर दोबारा जाएं।
            </li>
          </ol>

          <h3 className="text-md sm:text-lg font-bold mt-5 mb-2">⚠️ Important (महत्वपूर्ण)</h3>

          <p className="mb-2">
            <b>If payment is deducted but ticket is not shown, immediately contact us:</b>
            <br />
            📞 <b>9956927789</b>
            <br />
            <span className="text-red-600">⚠️ अगर पेमेंट कट गया है लेकिन टिकट नहीं दिख रहा है, तो तुरंत इस नंबर पर संपर्क करें – 9956927789</span>
          </p>

          <p className="mt-4">
            <b>If the website is slow or heavy traffic occurs, contact us in our WhatsApp group:</b>
            <br />
            👉 <b>Join WhatsApp Group</b>
            <br />
            यदि वेबसाइट पर अधिक लोड है, तो हमारे व्हाट्सएप ग्रुप में संपर्क करें।
          </p>
        </div>
      ) : (
        <div className="relative min-h-[70vh] p-2 rounded shadow bg-white">
          {soldTicketsLoading ? (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
              <p className="mt-4 text-lg text-gray-600">Loading Sold Tickets...</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2 overflow-auto max-h-[calc(70vh-5rem)]">
                {Array.from(purchasedNumbers).map((num) => {
                  const displayNum = formatTicketNumber(skimId, num);
                  return (
                    <div
                      key={displayNum}
                      className="flex items-center justify-center aspect-square font-semibold rounded-lg bg-red-200 text-red-700 shadow text-[0.55rem] sm:text-xs md:text-sm"
                      style={{ minWidth: "45px" }}
                    >
                      {displayNum}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end gap-6 text-sm sm:text-base">
                <p>Total Sold: {purchasedNumbers.size}</p>
                <p>Total Left: {TOTAL_NUMBERS - purchasedNumbers.size}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedNumber && currentSkim && (
        <NumberPurchaseModal
          number={selectedNumber}
          amount={currentSkim.ticketPrice}
          skimId={skimId}
          onClose={handleModalClose}
          onPurchase={handleSuccessfulPurchase}
        />
      )}
    </div>
  );
};

export default LotteryPage;
