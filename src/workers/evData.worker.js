import Papa from 'papaparse';

// Heavy CSV parsing and aggregation are offloaded to Web Workers
// to avoid blocking the main thread for large datasets.

// Internal State
let allData = [];
let isInitialized = false;

const DB_NAME = 'EV_DASHBOARD_DB';
const DB_VERSION = 1;
const STORE_NAME = 'datasets';
const DATA_KEY = 'ev_population_data';

// Helper: Open IDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

// Helper: Get Data
const getFromDB = async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Helper: Put Data
const putToDB = async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Optimization: Pre-allocate properties
const processRow = (row) => {
    const type = row['Electric Vehicle Type'];
    const range = Number(row['Electric Range']) || 0;
    const price = Number(row['Base MSRP']) || 0;
    const make = String(row['Make'] || 'Unknown');
    const city = String(row['City'] || 'Unknown');
    const model = String(row['Model'] || '');
    const year = row['Model Year'];
    const vin = String(row['VIN (1-10)'] || '');

    const searchStr = `${vin} ${make} ${model} ${city} ${year}`.toLowerCase();

    return {
        ...row,
        _processed: {
            type, range, price, make, city, year,
            isBEV: type && type.includes('Battery Electric'),
            searchStr
        }
    };
};

const aggregateData = (data) => {
    let totalEVs = 0;
    let bevCount = 0;
    let phevCount = 0;
    let totalRange = 0;
    let rangeCount = 0;

    const manufacturers = {};
    const modelYears = {};
    const cities = {};
    const scatterData = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const p = row._processed;

        if (!p.year || !p.make) continue;

        totalEVs++;
        if (p.isBEV) bevCount++;
        else phevCount++;

        if (p.range > 0) {
            totalRange += p.range;
            rangeCount++;
        }

        manufacturers[p.make] = (manufacturers[p.make] || 0) + 1;
        cities[p.city] = (cities[p.city] || 0) + 1;

        if (!modelYears[p.year]) modelYears[p.year] = { BEV: 0, PHEV: 0, Total: 0 };
        modelYears[p.year].Total++;
        if (p.isBEV) modelYears[p.year].BEV++;
        else modelYears[p.year].PHEV++;

        if (p.price > 0 && p.range > 0) {
            scatterData.push({ range: p.range, price: p.price, type: p.isBEV ? 'BEV' : 'PHEV' });
        }
    }

    const sortedManufacturers = Object.entries(manufacturers).sort((a, b) => b[1] - a[1]);
    const topManufacturer = sortedManufacturers[0] || ['Unknown', 0];

    return {
        kpi: {
            totalEVs,
            bevPercentage: totalEVs ? ((bevCount / totalEVs) * 100).toFixed(1) : 0,
            phevPercentage: totalEVs ? ((phevCount / totalEVs) * 100).toFixed(1) : 0,
            avgRange: rangeCount ? Math.round(totalRange / rangeCount) : 0,
            topManufacturer: topManufacturer[0],
            topManufacturerCount: topManufacturer[1]
        },
        charts: {
            adoptionTrend: Object.entries(modelYears).sort((a, b) => Number(a[0]) - Number(b[0])).map(([year, counts]) => ({ year, ...counts })),
            manufacturerDist: sortedManufacturers.slice(0, 10).map(([name, count]) => ({ name, count })),
            geoDist: Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
            scatter: scatterData
        }
    };
};

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            try {
                // 1. Try Cache First
                const cached = await getFromDB(DATA_KEY);

                if (cached) {
                    allData = cached;
                    const aggregates = aggregateData(allData);
                    isInitialized = true;
                    self.postMessage({
                        type: 'INIT_COMPLETE',
                        payload: { aggregates, totalCount: allData.length, source: 'CACHE' }
                    });
                    return;
                }

                // 2. Fetch & Parse if not cached
                const response = await fetch(payload.url);
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        allData = results.data.map(processRow);

                        // Save to Cache (Async, don't block return)
                        putToDB(DATA_KEY, allData).catch(err => console.error("Cache Write Failed", err));

                        const aggregates = aggregateData(allData);
                        isInitialized = true;

                        self.postMessage({
                            type: 'INIT_COMPLETE',
                            payload: { aggregates, totalCount: allData.length, source: 'NETWORK' }
                        });
                    },
                    error: (err) => self.postMessage({ type: 'ERROR', payload: err.message })
                });
            } catch (err) {
                self.postMessage({ type: 'ERROR', payload: err.message });
            }
            break;

        case 'QUERY':
            if (!isInitialized) return;
            const { search, page, limit } = payload;
            const searchLower = search ? search.toLowerCase() : '';

            let filtered = [];
            if (!searchLower) {
                filtered = allData;
            } else {
                for (let i = 0; i < allData.length; i++) {
                    if (allData[i]._processed.searchStr.includes(searchLower)) {
                        filtered.push(allData[i]);
                    }
                }
            }

            const start = (page - 1) * limit;
            const end = start + limit;
            const rows = filtered.slice(start, end);

            self.postMessage({
                type: 'QUERY_RESULT',
                payload: { rows, totalCount: filtered.length, page, search }
            });
            break;
    }
};
