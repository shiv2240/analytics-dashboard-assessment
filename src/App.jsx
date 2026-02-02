import React, { useState, useEffect, useRef, Suspense } from "react";
import KPICards from "./components/KPICards";
import DataTable from "./components/DataTable";
import csvUrl from "./data/Electric_Vehicle_Population_Data.csv?url";

// Lazy Load Charts for Bundle Optimization
const AdoptionTrend = React.lazy(() => import("./components/AdoptionTrend"));
const ManufacturerChart = React.lazy(
  () => import("./components/ManufacturerChart"),
);
const GeoDistribution = React.lazy(
  () => import("./components/GeoDistribution"),
);
const RangeVsPriceScatter = React.lazy(
  () => import("./components/RangeVsPriceScatter"),
);

function App() {
  const [aggregates, setAggregates] = useState(null);
  const [tableData, setTableData] = useState({ rows: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./workers/evData.worker.js", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === "INIT_COMPLETE") {
        setAggregates(payload.aggregates);
        setLoading(false);
        // Request first page of data
        workerRef.current.postMessage({
          type: "QUERY",
          payload: { search: "", page: 1, limit: 10 },
        });
      } else if (type === "QUERY_RESULT") {
        const { rows, totalCount } = payload;
        setTableData({ rows, totalCount });
      } else if (type === "ERROR") {
        setError(payload);
        setLoading(false);
      }
    };

    workerRef.current.postMessage({ type: "INIT", payload: { url: csvUrl } });

    return () => workerRef.current.terminate();
  }, []);

  // Post-LCP Chart Rendering
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    // Safety fallback: Ensure charts load after 2.5s worst case
    const fallbackTimer = setTimeout(() => setShowCharts(true), 2500);

    const observer = new PerformanceObserver((list) => {
      const lcp = list.getEntries().at(-1);
      if (lcp) {
        clearTimeout(fallbackTimer);
        setTimeout(() => setShowCharts(true), 2000);
        observer.disconnect();
      }
    });

    try {
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {
      console.warn("LCP observer failed", e);
      setShowCharts(true);
    }

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleTableQuery = (search, page) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "QUERY",
        payload: { search, page, limit: 10 },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <div className="text-slate-500 font-medium">
            Processing EV Dataset (Off-thread)...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-red-500 font-medium">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-8 w-8 text-blue-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              EV Analytics Dashboard
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Production Build | Worker Optimized
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Section */}
        <section>
          <KPICards kpi={aggregates.kpi} />
        </section>

        {/* Data Table - Worker Backed */}
        <section>
          <DataTable
            rows={tableData.rows}
            totalCount={tableData.totalCount}
            onQuery={handleTableQuery}
          />
        </section>

        {/* Charts Grid - Lazy Loaded */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Suspense
              fallback={
                <div className="h-80 bg-white rounded-lg animate-pulse border border-slate-200" />
              }
            >
              <section className="lg:col-span-2">
                <AdoptionTrend data={aggregates.charts.adoptionTrend} />
              </section>
            </Suspense>

            <Suspense
              fallback={
                <div className="h-80 bg-white rounded-lg animate-pulse border border-slate-200" />
              }
            >
              <section>
                <ManufacturerChart data={aggregates.charts.manufacturerDist} />
              </section>
            </Suspense>

            <Suspense
              fallback={
                <div className="h-80 bg-white rounded-lg animate-pulse border border-slate-200" />
              }
            >
              <section>
                <GeoDistribution data={aggregates.charts.geoDist} />
              </section>
            </Suspense>

            <Suspense
              fallback={
                <div className="h-80 bg-white rounded-lg animate-pulse border border-slate-200" />
              }
            >
              <section className="lg:col-span-2">
                <RangeVsPriceScatter data={aggregates.charts.scatter} />
              </section>
            </Suspense>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-400 text-sm border-t border-slate-200 mt-12">
        <p>
          &copy; 2024 EV Analytics Dashboard. Powered by Web Workers & Vite.
        </p>
      </footer>
    </div>
  );
}

export default App;
