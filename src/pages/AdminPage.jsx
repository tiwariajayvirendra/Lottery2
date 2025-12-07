import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// =============================================================================
// ✨ ICON COMPONENTS
// =============================================================================
// Simple SVG components used to indicate sorting direction in table headers.
const ArrowUpward = () => <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const ArrowDownward = () => <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;

const AdminPage = () => {
  // =============================================================================
  // ⚛️ COMPONENT STATE & HOOKS
  // =============================================================================
  // State for storing fetched tickets, error messages, and loading status.
  const [tickets, setTickets] = useState([]); // Holds the list of tickets fetched from the API.
  const [error, setError] = useState(""); // Stores any error messages to display to the user.
  const [loading, setLoading] = useState(true); // Tracks loading state for the main tickets table.
  const navigate = useNavigate();

  // Configuration constants.
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const ticketsPerPage = 15; // Defines how many tickets are shown per page.

  // State for pagination, filtering, and sorting.
  const [currentPage, setCurrentPage] = useState(1); // Manages the current page number for pagination.
  const [totalPages, setTotalPages] = useState(1); // Stores the total number of pages from the API response.
  const [totalTickets, setTotalTickets] = useState(0); // Total count of tickets based on the current filter.
  const [selectedSkim, setSelectedSkim] = useState("all"); // Tracks the currently selected skim ID for filtering.
  const [sortConfig, setSortConfig] = useState({ key: 'purchaseDate', direction: 'desc' }); // Manages table sorting state (column and direction).

  // State for additional features like exporting and statistics.
  const [exporting, setExporting] = useState(false); // Tracks the loading state of the CSV export process.
  const [skimStats, setSkimStats] = useState([]); // Stores the overview statistics for each skim.
  const [statsLoading, setStatsLoading] = useState(true); // Tracks loading state for the skim statistics section.
  const [purchasedCounts, setPurchasedCounts] = useState({}); // Stores purchased ticket counts for each skim.

  // Available skims for the filter tabs.
  const skims = ["all", "1", "2", "3", "4"];

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    navigate("/admin-login");
  }, [navigate]);

  // =============================================================================
  // 🎣 DATA FETCHING EFFECTS
  // =============================================================================

  // Effect to fetch overall statistics for all skims (e.g., unsold tickets).
  useEffect(() => {
    const fetchSkimStats = async () => {
      setStatsLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      try {
        const res = await fetch(`${backendUrl}/api/admin/skims/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            handleLogout();
            return;
          }
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.hint || "Failed to fetch skim stats");
        }
        const data = await res.json();
        // Convert the array of stats into a map for easy lookup by skimId
        const statsMap = (data.data || []).reduce((acc, stat) => {
          if (stat.skimId) {
            acc[stat.skimId] = stat;
          }
          return acc;
        }, {});
        setSkimStats(statsMap);
      } catch (err) {
        console.error("Skim stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchSkimStats();

    // Effect to fetch purchased ticket counts for all skims to display on tabs.
    const fetchPurchasedCounts = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      try {
        const res = await fetch(`${backendUrl}/api/admin/tickets/counts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            handleLogout();
            return;
          }
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.hint || "Failed to fetch purchased counts");
        }
        const data = await res.json();
        setPurchasedCounts(data.data || {});
      } catch (err) {
        console.error("Purchased counts error:", err);
      }
    };
    fetchPurchasedCounts();
  }, [backendUrl]);

  // Main effect to fetch tickets based on pagination, sorting, and filtering.
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setError("Not logged in as admin");
      navigate("/admin-login");
      return;
    }
    
    const fetchTickets = async () => {
      setLoading(true);
      // Construct query parameters for the API request.
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: ticketsPerPage,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction,
        });
        
        if (selectedSkim !== "all") {
          params.append("skimId", selectedSkim);
        }

        const res = await fetch(`${backendUrl}/api/admin/tickets?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Handle non-OK responses, including unauthorized access.
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            const errorData = await res.json().catch(() => ({}));
            setError(errorData.message || "Session expired. Please login again.");
            handleLogout();
            return;
          }
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || data.hint || `Failed to fetch tickets. Status: ${res.status}`);
        }
        
        // On success, update the state with the fetched data.
        const data = await res.json();
        setTickets(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalTickets(data.totalTickets || 0);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Server error, could not fetch tickets");
        setTickets([]);
        setTotalPages(1);
        setTotalTickets(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [navigate, backendUrl, currentPage, selectedSkim, sortConfig, handleLogout]);

  // =============================================================================
  // 📦 HANDLER FUNCTIONS
  // =============================================================================

  // Handles the CSV export functionality.
  const handleExport = async () => {
    setExporting(true);
    setError("");
    const token = localStorage.getItem("adminToken");

    let exportUrl = `${backendUrl}/api/admin/tickets/export`;
    if (selectedSkim !== "all") {
      exportUrl += `?skimId=${selectedSkim}`;
    }

    try {
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || "Session expired. Please login again.");
          handleLogout();
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.hint || `Failed to export tickets for Skim ${selectedSkim}.`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const skimPart = selectedSkim === 'all' ? 'all-skims' : `skim-${selectedSkim}`;
      a.download = `tickets-export-${skimPart}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Export error:", err);
      setError(err.message || "An unexpected error occurred during export.");
    } finally {
      setExporting(false);
    }
  };

  // Updates the current page for pagination.
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // Updates the selected skim and resets pagination.
  const handleSkimChange = (skim) => {
    setSelectedSkim(skim);
    setCurrentPage(1); // Reset to first page when skim changes
  };

  // Toggles the sort direction when a table header is clicked.
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // A reusable component for creating sortable table headers.
  const SortableHeader = ({ columnKey, title }) => {
    const isSorted = sortConfig.key === columnKey;
    return (
      <th className="py-3 px-4 border-b cursor-pointer" onClick={() => requestSort(columnKey)}>
        <div className="flex items-center justify-center">
          {title}
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUpward /> : <ArrowDownward />
          ) : <span className="w-4 h-4"></span>}
        </div>
      </th>
    );
  };

  // =============================================================================
  // 🎨 RENDER METHOD
  // =============================================================================
  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
      {/* SECTION 1: HEADER & CONTROLS */}
      {/* Contains the main title, total ticket count, and action buttons. */}
      <div className="flex flex-wrap justify-between items-center mb-6 bg-white shadow-md rounded-lg p-4 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🎟️ Admin Panel</h1>
          <p className="text-sm text-gray-500">
            Viewing tickets for: <span className="font-semibold text-purple-700">{selectedSkim === 'all' ? 'All Skims' : `Skim ID ${selectedSkim}`}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalTickets > 0 && (
            <div className="px-4 py-2 bg-purple-100 text-purple-800 font-bold text-md rounded-lg">
              Total Tickets: {totalTickets}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded-lg">{error}</p>}

      {/* SECTION 2: SKIM STATISTICS */}
      {/* Displays a grid of cards with key stats for each skim, like available tickets. */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Skims Overview</h2>
        {statsLoading ? (
           <div className="text-center text-gray-500">Loading stats...</div>
        ) : Object.keys(skimStats).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(skimStats).map((stat) => (
              <div key={stat.skimId} className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-sm font-semibold text-gray-500">SKIM ID {stat.skimId}</p>
                <p className="text-2xl font-bold text-purple-700">{(stat?.unsoldTickets ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Available Tickets</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white p-4 rounded-lg shadow-md text-gray-500">
            Could not load skim statistics.
          </div>
        )}
      </div>


      {/* SECTION 3: FILTER TABS */}
      {/* Allows the admin to filter the tickets table by a specific skim ID. */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
          {skims.map((skim) => (
            <button
              key={skim}
              onClick={() => handleSkimChange(skim)}
              className={`relative px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center gap-2 ${
                selectedSkim === skim
                  ? "bg-purple-600 text-white font-semibold shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {skim === "all" ? "All Skims" : `SKIM ID ${skim}`}
              {/* Purchased Ticket Count Badge */}
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${selectedSkim === skim ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-800'}`}>
                {purchasedCounts[skim] !== undefined ? purchasedCounts[skim] : '...'}
              </span>
            </button>
          ))}
          </div>
          {/* Contextual Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || totalTickets === 0}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? "Exporting..." : `Export ${selectedSkim === 'all' ? 'All' : `Skim ${selectedSkim}`} CSV`}
          </button>
        </div>
      </div>

      {/* SECTION 4: TICKETS TABLE */}
      {/* The main data table displaying all purchased ticket information. */}
      <div className="overflow-x-auto shadow-lg rounded-lg bg-white">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-xs text-center font-bold">
              <SortableHeader columnKey="fullName" title="Name" />
              <SortableHeader columnKey="mobile" title="Mobile" />
              <SortableHeader columnKey="age" title="Age" />
              <SortableHeader columnKey="state" title="State" />
              <th className="py-3 px-4 border-b">Aadhaar</th>
              <SortableHeader columnKey="ticketNumber" title="Ticket #" />
              <SortableHeader columnKey="skimId" title="Skim ID" />
              <SortableHeader columnKey="amountPaid" title="Amount Paid" />
              <th className="py-3 px-4 border-b">Order ID</th>
              <th className="py-3 px-4 border-b">Payment ID</th>
              <SortableHeader columnKey="purchaseDate" title="Purchase Date" />
              <th className="py-3 px-4 border-b">Download</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td colSpan="12" className="text-center py-10">
                  <div className="flex justify-center items-center flex-col gap-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
                    <span className="text-purple-700 font-semibold mt-2">Loading Tickets, Please Wait...</span>
                  </div>
                </td>
              </tr>
            ) : tickets.length > 0 ? (
              tickets.map((ticket) => (
                <tr key={ticket._id} className="text-center hover:bg-purple-50 transition-colors duration-200">
                  <td className="py-3 px-4 border-b">{ticket.fullName}</td>
                  <td className="py-3 px-4 border-b">{ticket.mobile}</td>
                  <td className="py-3 px-4 border-b">{ticket.age}</td>
                  <td className="py-3 px-4 border-b">{ticket.state}</td>
                  <td className="py-3 px-4 border-b">{ticket.aadhaar || "N/A"}</td>
                  <td className="py-3 px-4 border-b font-bold text-blue-600">{ticket.ticketNumber}</td>
                  <td className="py-3 px-4 border-b">{ticket.skimId || "N/A"}</td>
                  <td className="py-3 px-4 border-b font-semibold text-green-600">₹{ticket.amountPaid}</td>
                  <td className="py-3 px-4 border-b text-xs truncate" title={ticket.razorpayOrderId}>{ticket.razorpayOrderId || "N/A"}</td>
                  <td className="py-3 px-4 border-b text-xs truncate" title={ticket.razorpayPaymentId}>{ticket.razorpayPaymentId || "N/A"}</td>
                  <td className="py-3 px-4 border-b">{new Date(ticket.purchaseDate).toLocaleString()}</td>
                  <td className="py-3 px-4 border-b">
                    <a
                      href={ticket.downloadLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                        ticket.downloadLink
                          ? "bg-blue-500 text-white hover:bg-blue-600 shadow"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      aria-disabled={!ticket.downloadLink}
                      onClick={(e) => !ticket.downloadLink && e.preventDefault()}
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-5xl">🧐</span>
                    <p className="text-gray-600 font-semibold text-lg">No Tickets Found</p>
                    <p className="text-gray-400 text-sm">There are no purchased tickets matching your current filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECTION 5: PAGINATION CONTROLS */}
      {/* Renders Previous/Next buttons and page count if there's more than one page. */}
      {totalPages > 1 && (
      <div className="flex justify-center items-center mt-6 space-x-2">
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg shadow-sm transition-colors"
          >
            Previous
          </button>
        )}
        <span className="text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        {currentPage < totalPages && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg shadow-sm transition-colors"
          >
            Next
          </button>
        )}
      </div>
      )}
    </div>
  );
};

export default AdminPage;