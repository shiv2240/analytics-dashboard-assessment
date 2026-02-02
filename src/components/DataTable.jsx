import React, { useState, useEffect } from "react";
import useDebounce from "../hooks/useDebounce";

// Now a "Server-Side" (Worker-Side) Component
const DataTable = ({ rows, totalCount, onQuery }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Effect: Sync with Worker when Filter or Page changes
  useEffect(() => {
    // Determine if this effect run is triggered by SEARCH vs PAGE
    // If search changed, we reset page to 1
    // But we need to be careful not to create loops.
    // Let's implement this simply:
    // When local state changes, tell parent.

    // We can't strictly differentiate inside one useEffect easily without ref logic,
    // but actually, if search changed, we SHOULD request page 1.
    // Effectively, onQuery(term, page) is the contract.
    onQuery(debouncedSearchTerm, currentPage);
  }, [debouncedSearchTerm, currentPage]);

  // Reset page when search changes (Local Logic)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage) => {
    const p = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(p);
  };

  // Drag-to-Scroll Logic
  const tableContainerRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

  const onMouseDown = (e) => {
    isDragging.current = true;
    tableContainerRef.current.classList.add("cursor-grabbing");
    tableContainerRef.current.classList.remove("cursor-grab");
    startX.current = e.pageX - tableContainerRef.current.offsetLeft;
    scrollLeft.current = tableContainerRef.current.scrollLeft;
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    if (tableContainerRef.current) {
      tableContainerRef.current.classList.remove("cursor-grabbing");
      tableContainerRef.current.classList.add("cursor-grab");
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (tableContainerRef.current) {
      tableContainerRef.current.classList.remove("cursor-grabbing");
      tableContainerRef.current.classList.add("cursor-grab");
    }
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll-fast multiplier
    tableContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Vehicle Data</h3>
        <div className="relative mt-2 sm:mt-0 w-full sm:w-64">
          <input
            type="text"
            placeholder="Search VIN, Make, Model, City..."
            className="p-2 pl-3 border border-slate-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="absolute right-3 top-2.5">
              <svg
                className="animate-spin h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>

      <div
        ref={tableContainerRef}
        className="overflow-x-auto min-h-[460px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {[
                "VIN (1-10)",
                "County",
                "City",
                "State",
                "Postal Code",
                "Model Year",
                "Make",
                "Model",
                "Electric Vehicle Type",
                "Clean Alternative Fuel Vehicle (CAFV) Eligibility",
                "Electric Range",
                "Base MSRP",
                "Legislative District",
                "DOL Vehicle ID",
                "Vehicle Location",
                "Electric Utility",
                "2020 Census Tract",
              ].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rows.map((row) => (
              <tr
                key={row.id || row["VIN (1-10)"] + Math.random()}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-slate-900 font-mono whitespace-nowrap">
                  {row["VIN (1-10)"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row.County}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row.City}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row.State}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row["Postal Code"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row["Model Year"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row.Make}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row.Model}
                </td>
                <td
                  className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate"
                  title={row["Electric Vehicle Type"]}
                >
                  {row["Electric Vehicle Type"]}
                </td>
                <td
                  className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate"
                  title={
                    row["Clean Alternative Fuel Vehicle (CAFV) Eligibility"]
                  }
                >
                  {row["Clean Alternative Fuel Vehicle (CAFV) Eligibility"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-medium text-right whitespace-nowrap">
                  {row["Electric Range"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right whitespace-nowrap">
                  ${row["Base MSRP"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row["Legislative District"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row["DOL Vehicle ID"]}
                </td>
                <td
                  className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap truncate max-w-[200px]"
                  title={row["Vehicle Location"]}
                >
                  {row["Vehicle Location"]}
                </td>
                <td
                  className="px-4 py-3 text-xs text-slate-500 truncate max-w-[250px]"
                  title={row["Electric Utility"]}
                >
                  {row["Electric Utility"]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {row["2020 Census Tract"]}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan="17"
                  className="px-4 py-12 text-center text-slate-400"
                >
                  {debouncedSearchTerm
                    ? `No results found`
                    : "No data available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <span className="text-sm text-slate-500">
          Showing {rows.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount}{" "}
          entries
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="p-2 border border-slate-300 rounded text-slate-600 disabled:opacity-50 hover:bg-slate-50"
            title="First Page"
          >
            <span className="sr-only">First</span>«
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50 min-w-[80px]"
          >
            Previous
          </button>

          <span className="px-4 py-1 text-sm text-slate-600 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50 min-w-[80px]"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-slate-300 rounded text-slate-600 disabled:opacity-50 hover:bg-slate-50"
            title="Last Page"
          >
            <span className="sr-only">Last</span>»
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
