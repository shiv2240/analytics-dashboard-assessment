import Papa from 'papaparse';

export const loadCSVData = async (filePath) => {
    try {
        const response = await fetch(filePath);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error("Error loading CSV:", error);
        throw error;
    }
};

export const processData = (data) => {
    if (!data || data.length === 0) return null;

    let totalEVs = 0;
    let bevCount = 0;
    let phevCount = 0;
    let totalRange = 0;
    let rangeCount = 0;

    const manufacturers = {};
    const modelYears = {}; // { year: { BEV: 0, PHEV: 0, Total: 0 } }
    const cities = {};
    const scatterData = []; // { range: number, price: number, type: string }

    // Helper to safely get string key
    const getKey = (val) => String(val || 'Unknown');

    data.forEach(row => {
        // Basic Parsing
        const type = row['Electric Vehicle Type'];
        const range = Number(row['Electric Range']) || 0;
        const price = Number(row['Base MSRP']) || 0;
        const make = getKey(row['Make']);
        const city = getKey(row['City']);
        const year = row['Model Year'];

        if (!year || !make) return; // Skip invalid rows

        totalEVs++;

        // BEV vs PHEV
        const isBEV = type && type.includes('Battery Electric Vehicle');
        if (isBEV) bevCount++;
        else phevCount++; // Assumes PHEV if not BEV (simplification based on known types)

        // Average Range (Only consider > 0 for meaningful avg)
        if (range > 0) {
            totalRange += range;
            rangeCount++;
        }

        // Manufacturers
        manufacturers[make] = (manufacturers[make] || 0) + 1;

        // Cities
        cities[city] = (cities[city] || 0) + 1;

        // Model Year Trends
        if (!modelYears[year]) modelYears[year] = { BEV: 0, PHEV: 0, Total: 0 };
        modelYears[year].Total++;
        if (isBEV) modelYears[year].BEV++;
        else modelYears[year].PHEV++;

        // Scatter Plot (Filter valid Price & Range logic: Price > 0 implies data is present, same for Range)
        // To keep it clean, let's only take a subset or all non-zero pairs?
        // Dataset has many 0 MSRP. Let's include them but maybe tooltips explain.
        // Requirement says "Range vs Price", if Price is 0 it's not useful analysis.
        // Let's filter calculate points where MSRP > 0 for the scatter plot to be insightful
        if (price > 0 && range > 0) {
            scatterData.push({ range, price, type: isBEV ? 'BEV' : 'PHEV', make, model: row['Model'] });
        }
    });

    // Aggregations
    const avgRange = rangeCount > 0 ? Math.round(totalRange / rangeCount) : 0;

    // Top Manufacturer
    const sortedManufacturers = Object.entries(manufacturers)
        .sort((a, b) => b[1] - a[1]);
    const topManufacturer = sortedManufacturers[0] || ['Unknown', 0];

    // Format Charts

    // 1. Manufacturer Distribution (Top 10)
    const manufacturerChartData = sortedManufacturers
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // 2. Adoption Trends (Sort by year)
    const adoptionTrendData = Object.entries(modelYears)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([year, counts]) => ({
            year,
            BEV: counts.BEV,
            PHEV: counts.PHEV
        }));

    // 3. Geo Distribution (Top 10 Cities)
    const geoData = Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    return {
        kpi: {
            totalEVs,
            bevPercentage: ((bevCount / totalEVs) * 100).toFixed(1),
            phevPercentage: ((phevCount / totalEVs) * 100).toFixed(1),
            avgRange,
            topManufacturer: topManufacturer[0],
            topManufacturerCount: topManufacturer[1]
        },
        charts: {
            adoptionTrend: adoptionTrendData,
            manufacturerDist: manufacturerChartData,
            geoDist: geoData,
            scatter: scatterData
        },
        rawTable: data.map((row, index) => ({
            id: index,
            ...row,
            // Pre-compute unique search string for O(1) matching per filter op
            searchStr: `${row['VIN (1-10)'] || ''} ${row.Make || ''} ${row.Model || ''} ${row.City || ''} ${row['Model Year'] || ''}`.toLowerCase()
        })) // Add ID for React keys
    };
};
