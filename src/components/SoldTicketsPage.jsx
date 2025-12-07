import React, { useState, useEffect, useCallback } from 'react';

// --- MOCK DATA (can be removed once backend is ready) ---
const MOCK_SCHEMES = [
  { id: 1, skim_no: '101' },
  { id: 2, skim_no: '102' },
  { id: 3, skim_no: '103' },
];

const SoldTicketsPage = () => {
  const [schemes, setSchemes] = useState([]); // Holds all schemes
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [soldTickets, setSoldTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Fetch all schemes when page loads

  // Handle clicking on a scheme to fetch sold tickets
  const handleSchemeClick = useCallback(async (scheme) => {
    setSelectedScheme(scheme);
    setIsLoading(true);
    setError("");
    setSoldTickets([]);

    try {
      const response = await fetch(
        `${backendUrl}/api/schemes/${scheme.id}/sold-tickets`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSoldTickets(data.tickets || []); // Expecting [{ number: "..." }, ...]
    } catch (err) {
      console.error("Error fetching sold tickets:", err);
      setError("Failed to fetch sold tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]); // Dependencies for useCallback

  useEffect(() => {
    const fetchSchemes = async () => {
      // Reset states for new fetch
      setError("");
      setIsLoading(true);
      try {
        // ----- REAL BACKEND FETCH -----
        const response = await fetch(`${backendUrl}/api/schemes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const schemesData = await response.json();
        setSchemes(schemesData);
        // Automatically load tickets for the first scheme
        if (schemesData && schemesData.length > 0) {
          await handleSchemeClick(schemesData[0]);
        }
      } catch (err) {
        console.error("Error fetching schemes:", err);
        setError("Failed to fetch schemes. Please try again later.");
      }
    };

    fetchSchemes();
  }, [backendUrl, handleSchemeClick]); // Dependencies for useEffect

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Sold Numbers</h1>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {/* Tabs for each scheme */}
      <div className="flex justify-center border-b mb-6 flex-wrap gap-2">
        {schemes.map((scheme) => (
          <button
            key={scheme.id}
            onClick={() => handleSchemeClick(scheme)}
            className={`py-2 px-6 font-semibold text-lg rounded-t ${
              selectedScheme?.id === scheme.id
                ? 'border-b-2 border-red-600 text-red-700'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            Scheme #{scheme.skim_no}
          </button>
        ))}
      </div>

      {/* Sold Tickets Grid */}
      <div className="max-w-4xl mx-auto">
        {selectedScheme && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading tickets...</p>
              </div>
            ) : soldTickets.length > 0 ? (
              <>
                <p className="mb-4 text-lg">
                  Total tickets sold: <strong>{soldTickets.length}</strong>
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-12 gap-2">
                  {soldTickets.map((ticket) => (
                    <div
                      key={ticket.number}
                      className="p-2 bg-gray-200 text-center rounded text-sm font-semibold"
                    >
                      {ticket.number}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center">No tickets have been sold for this scheme yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoldTicketsPage;
