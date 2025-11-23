import React, { useState } from 'react';
import winnersData from '../data/winners.json'; // Import the manual winner data

const WinnersPage = () => {
  // Set the first scheme as active by default
  const [selectedSchemeId, setSelectedSchemeId] = useState(winnersData[0]?.schemeId);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Scheme Winners</h1>

      {/* Tabs for each Scheme */}
      <div className="flex justify-center border-b mb-6">
        {winnersData.map((scheme) => (
          <button
            key={scheme.schemeId}
            onClick={() => setSelectedSchemeId(scheme.schemeId)}
            className={`py-2 px-6 font-semibold text-lg ${
              selectedSchemeId === scheme.schemeId
                ? 'border-b-2 border-blue-600 text-blue-700'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            {scheme.schemeName}
          </button>
        ))}
      </div>

      {/* Winner Details */}
      <div className="max-w-2xl mx-auto">
        {winnersData
          .filter((scheme) => scheme.schemeId === selectedSchemeId)
          .map((scheme) => (
            <div key={scheme.schemeId} className="bg-white p-8 rounded-xl shadow-2xl text-center">
              {scheme.winner ? (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-3">🎉 Congratulations! 🎉</h2>
                  <p className="text-xl my-2"><strong>Winner:</strong> {scheme.winner.name}</p>
                  <p className="text-xl my-2"><strong>Winning Ticket:</strong> #{scheme.winner.ticketNumber}</p>
                  <p className="text-xl my-2"><strong>Prize:</strong> {scheme.winner.prize}</p>
                </div>
              ) : (
                <p className="text-xl text-gray-600">The winner for this scheme has not been announced yet. Stay tuned!</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default WinnersPage;