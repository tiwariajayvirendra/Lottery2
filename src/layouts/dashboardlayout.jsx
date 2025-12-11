import React from "react";
import { useNavigate } from "react-router-dom";

export const skims = [
  {
    id: 1,
    name: "🎯 Skim One - Golden Chance",
    bgColor: "bg-yellow-100",
    ticketPrice: 50,
    winnings: [
      { position: "1st Position", amount: 50000 },
      { position: "2nd to 11th Position", amount: 10000 },
    ],
    winners: [
      { name: "Aarav Sharma", ticket: "GOLD01", position: "1st Position" },
      { name: "Diya Patel", ticket: "GOLD02", position: "2nd Position" },
    ],
    disclaimer:
      "Number is subject to terms & conditions. Results will be declared once all numbers are sold.",
  },
  {
    id: 2,
    name: "💎 Skim Two - Silver Luck",
    bgColor: "bg-blue-100",
    ticketPrice: 100,
    winnings: [
      { position: "1st Position", amount: 100000 },
      { position: "2nd to 5th Position", amount: 20000 },
    ],
    winners: [
      { name: "Vivaan Singh", ticket: "SILV01", position: "1st Position" },
      { name: "Ishaan Gupta", ticket: "SILV02", position: "2nd Position" },
    ],
    disclaimer: "Please ensure valid KYC details. Numbers are non-refundable.",
  },
  {
    id: 3,
    name: "🔥 Skim Three - Mega Blast",
    bgColor: "bg-red-100",
    ticketPrice: 200,
    winnings: [
      { position: "1st Position", amount: 200000 },
      { position: "2nd to 10th Position", amount: 50000 },
    ],
    winners: [
      { name: "Ananya Reddy", ticket: "MEGA01", position: "1st Position" },
      { name: "Kabir Kumar", ticket: "MEGA02", position: "2nd Position" },
    ],
    disclaimer: "Play responsibly. Winning numbers are selected randomly.",
  },
  {
    id: 4,
    name: "🌟 Skim Four - Platinum Dream",
    bgColor: "bg-green-100",
    ticketPrice: 500,
    winnings: [
      { position: "1st Position", amount: 500000 },
      { position: "2nd to 20th Position", amount: 100000 },
    ],
    winners: [
      { name: "Myra Joshi", ticket: "PLAT01", position: "1st Position" },
      { name: "Sai Desai", ticket: "PLAT02", position: "2nd Position" },
    ],
    disclaimer:
      "Ensure you save your number screenshot. Technical issues may delay downloads.",
  },
];

// ----------------------------
// ✨ Ads Component (3 Ads)
// ----------------------------
const AdsRow = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
    {/* AD 1 */}
    <div className="p-5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-md border border-white/30 shadow-md">
      <h3 className="text-lg font-bold text-indigo-800">⭐ Premium Membership</h3>
      <p className="text-sm text-gray-700">Unlock exclusive Numbers deals.</p>
    </div>

    {/* AD 2 */}
    <div className="p-5 rounded-xl bg-gradient-to-r from-pink-500/20 to-yellow-500/20 backdrop-blur-md border border-white/30 shadow-md">
      <h3 className="text-lg font-bold text-pink-700">🎁 Daily Rewards</h3>
      <p className="text-sm text-gray-700">Login daily & collect free points.</p>
    </div>

    {/* AD 3 */}
    <div className="p-5 rounded-xl bg-gradient-to-r from-teal-500/20 to-green-500/20 backdrop-blur-md border border-white/30 shadow-md">
      <h3 className="text-lg font-bold text-green-700">🔥 Festive Offer</h3>
      <p className="text-sm text-gray-700">Big discounts during festival week!</p>
    </div>
  </div>
);

// ---------------------------------
// ✨ Skim Card Component with Tabs
// ---------------------------------
const SkimCard = ({ skim }) => {
  const [activeTab, setActiveTab] = React.useState("details");
  const navigate = useNavigate(); // 1. useNavigate हुक को कॉल करें

  return (
    <div
      className={`${skim.bgColor} rounded-xl shadow-lg p-6 flex flex-col justify-between`}
    >
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-4">
          {skim.name}
        </h2>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-300 mb-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "details"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("winners")}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "winners"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            Winners
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div>
            <p className="text-lg font-semibold text-indigo-700 mb-2">
              🎟 Number Price: ₹{skim.ticketPrice}
            </p>
            <div className="space-y-2 mb-4">
              {skim.winnings.map((win, idx) => (
                <p key={idx} className="text-md font-medium text-gray-700">
                  🏆 {win.position}: ₹{win.amount}
                </p>
              ))}
            </div>
            <p className="text-sm text-gray-600 italic border-t pt-2">
              {skim.disclaimer}
            </p>
          </div>
        )}

        {activeTab === "winners" && (
          <div className="space-y-3">
            {skim.winners.map((winner, idx) => (
              <div key={idx} className="p-3 bg-white/50 rounded-lg">
                <p className="font-bold text-gray-800">🎉 {winner.name}</p>
                <p className="text-sm text-gray-600">Position: {winner.position}</p>
                <p className="text-sm text-gray-600">Ticket: {winner.ticket}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(`/lottery/${skim.id}`)} // 2. navigate फ़ंक्शन का उपयोग करें
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Purchase Number for {skim.name}
      </button>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f7fa] to-[#f5f5f5] p-6">
      <h1 className="text-3xl font-bold text-center text-indigo-800 mb-10">
        🎁 Special Number Skims Dashboard
      </h1>

      {/* Loop skims AND add ads after every row */}
      {Array.from({ length: Math.ceil(skims.length / 2) }).map((_, rowIndex) => {
        const startIndex = rowIndex * 2;
        const rowSkims = skims.slice(startIndex, startIndex + 2);

        return (
          <div key={rowIndex}>
            {/* Skim Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rowSkims.map((skim) => (
                <SkimCard key={skim.id} skim={skim} />
              ))}
            </div>

            {/* Ads Row Below This Row */}
            <AdsRow />
          </div>
        );
      })}
    </div>
  );
};

export default DashboardLayout;
