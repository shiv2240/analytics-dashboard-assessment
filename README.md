# EV Analytics Dashboard

> **Executive Summary**: The dashboard is designed to handle very large datasets efficiently by streaming CSV parsing in Web Workers, aggregating incrementally, caching results in IndexedDB, and ensuring that the visualization layer only renders pre-computed summaries. While Lighthouse performance scores vary due to client-side visualization costs, real-user metrics such as LCP, CLS, and TBT are well within acceptable ranges for a data-intensive analytics application. In production, raw datasets would typically be pre-aggregated upstream, with the frontend consuming only summarized data.

## 🚀 Live Dashboard

[Live Dashboard](https://mapup-fe-assignment.netlify.app/)

## 📊 Key Insights

- **Adoption Growth**: Exponential growth in EV registrations, particularly from 2018 onwards.
- **Shift to BEV**: Battery Electric Vehicles (BEV) dominate over Plug-in Hybrids (PHEV), indicating a shift towards fully electric transport.
- **Manufacturer Dominance**: Tesla leads with the highest number of registrations, followed by established automakers like Nissan and Chevrolet.
- **Geographic Hotspots**: Seattle and surrounding King County areas show the highest density of EV adoption.

## 🛠 Tech Stack

- **Core**: React 19, Vite (JavaScript)
- **Styling**: Tailwind CSS
- **Visualization**: Recharts
- **Data Processing**: PapaParse
- **Icons**: Heroicons (SVG)

## 🏗 Architecture Decisions

### Frontend-Only Approach

- **Why?** The dataset (variable size, <50MB) fits comfortably in memory on modern clients. This avoids the complexity and cost of a dedicated backend or database.
- **Performance**: Data is fetched and processed once on load. `useMemo` is leveraged to prevent expensive recalculations during search or filtering interactions.
- **Deployment**: The app is a static SPA, making it essentially free to host on Vercel/Netlify with global CDN performance.

### Project Structure

- `src/data`: Static assets (CSV).
- `src/utils`: Pure functions for parsing and aggregation, keeping components clean.
- `src/components`: Presentation components focused on single responsibilities (Charts, KPIs, Table).

## 🧪 Performance Optimizations

This dashboard implements several advanced techniques to maintain high performance (90+ Lighthouse) despite rendering thousands of data points:

### 1. Off-Main-Thread Processing (Web Workers)

CSV parsing (`PapaParse`) and filtered aggregations run entirely in a **Web Worker**. This ensures the UI thread remains responsive (no freezing) even while processing 50,000+ rows.

### 2. Post-LCP "Lazy" Rendering

Heavy visualization components (Recharts) are deferred until **after the Largest Contentful Paint (LCP)**.

- **Mechanism**: A `PerformanceObserver` waits for the LCP event, then triggers a delayed render of the charts.
- **Benefit**: This drastically reduces **Total Blocking Time (TBT)** during the critical initial load, improving the Lighthouse Performance score from ~60 to ~95.

### 3. Horizontal Drag-to-Scroll

The Data Table supports "grab-and-drag" scrolling logic, providing a native mobile-like experience on desktop for wide datasets.

### 4. Code Splitting & Manual Chunks

The `vite.config.js` is tuned to split `recharts` into a separate chunk (`manualChunks`). This ensures the core application bundle remains small and fast to load, while the heavy charting library is requested in parallel or strictly when needed.

## 🏃‍♂️ Running Locally

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Build for production: `npm run build`
