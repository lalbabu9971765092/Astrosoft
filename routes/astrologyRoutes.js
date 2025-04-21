// routes/astrologyRoutes.js
import express from 'express'; // Using import syntax
import mongoose from 'mongoose';
import { body, query, param, validationResult } from 'express-validator';
import Chart from '../models/Chart.js';
// --- Import Logger ---
import logger from '../utils/logger.js';

// --- Import Utilities from the new structure ---
// Assuming you have utils/index.js re-exporting everything
import {
    PLANET_ORDER, normalizeAngle, getNakshatraDetails, getRashiDetails,
    calculateNakshatraPada, getJulianDateUT, calculateAyanamsa, convertToDMS,
    convertDMSToDegrees, // Added this import
    calculateMidpoint, calculateHousesAndAscendant, calculateSunMoonTimes,
    calculatePlanetaryPositions, calculateVimshottariBalance, calculateVimshottariDashas,
    calculateNavamsaLongitude, calculateMangalDosha, calculateKaalsarpaDosha,
    calculateMoolDosha, calculatePanchang, calculatePlanetStates, calculateAspects,
    NATURAL_FRIENDSHIP, FRIENDSHIP_PLANETS_ORDER, calculateTemporalFriendshipForPlanet,
    getResultingFriendship, calculateShadbala, calculateBhinnaAshtakavarga,
    calculateSarvaAshtakavarga, ASHTAKAVARGA_PLANETS, calculateSolarReturnJulianDay,
    calculateMuntha, calculateYearLord, calculateMuddaDasha, RASHIS,
    getNumberBasedAscendantDegree,
} from '../utils/index.js'; // Adjust path if your index is elsewhere or import directly

const router = express.Router();



// --- Helper Function for Error Handling ---
// Centralizes the error response logic
function handleRouteError(res, error, routeName, inputData = {}) {
    logger.error(`Error in ${routeName} route: ${error.message}`, {
        routeName,
        // input: inputData, // Be cautious logging full input in production
        error: error.stack || error // Log stack trace
    });

    const statusCode = error.status || 500;
    // Use NODE_ENV from process.env, ensure it's set in your environment
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = (isProduction && statusCode === 500)
        ? "An internal server error occurred. Please try again later."
        : error.message || "An internal server error occurred.";

    // Avoid sending stack trace in production response
    const errorResponse = { error: errorMessage };
    if (!isProduction && error.stack) {
        errorResponse.stack = error.stack.split('\n'); // Optionally include stack in dev
    }

    res.status(statusCode).json(errorResponse);
}

// --- Validation Rules ---
// Extracted validation rules for reusability and clarity
const baseChartValidation = [
    body('date').isISO8601().withMessage('Invalid date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.')
];

const saveChartValidation = [
    body('name').notEmpty().trim().escape().withMessage('Name is required.'), // Added escape
    body('gender').optional().trim().escape(),
    body('date').isISO8601().withMessage('Invalid date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.'),
    body('placeName').optional().trim().escape()
];

const prashnaValidation = [
    body('number').isInt({ min: 1, max: 249 }).toInt().withMessage('Prashna number must be between 1 and 249.'),
    body('date').isISO8601().withMessage('Invalid current date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.'),
    body('placeName').optional().trim().escape()
];

const varshphalValidation = [
    body('natalDate').isISO8601().withMessage('Invalid natal date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('natalLatitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Natal latitude must be a number between -90 and 90.'),
    body('natalLongitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Natal longitude must be a number between -180 and 180.'),
    body('varshphalYear').isInt({ min: 1900, max: 2100 }).toInt().withMessage('Varshphal year must be a number between 1900 and 2100.') // Adjust range if needed
];

const paginationValidation = [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.') // Max limit for performance
];
const deleteChartValidation = [
    param('id').isMongoId().withMessage('Invalid Chart ID format.')
];

// --- Route: Calculate Astrology Details ---
router.post('/calculate', baseChartValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { date } = req.body;
        const latNum = req.body.latitude; // Already float
        const lonNum = req.body.longitude; // Already float

        logger.info(`Starting calculation for date=${date}, lat=${latNum}, lon=${lonNum}`);

        // --- Core Calculation Steps (Functionality preserved) ---
        const { julianDayUT, utcDate } = getJulianDateUT(date, lonNum);
        // Throwing errors from utils allows catching them here
        const ayanamsa = calculateAyanamsa(julianDayUT);
        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
        const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
        const siderealCuspStartDegrees = tropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        const ascendantNakDetails = getNakshatraDetails(siderealAscendantDeg);
        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        // planetaryPositions util now throws on critical failure

        const siderealPositions = planetaryPositions.sidereal; // Extract for convenience
        const sunMoonTimes = calculateSunMoonTimes(date, latNum, lonNum);
        const detailedPanchang = calculatePanchang(date, latNum, lonNum);

        const housesData = [];
        for (let i = 0; i < 12; i++) {
             const houseNumber = i + 1;
            const startDeg = siderealCuspStartDegrees[i];
            const endDeg = siderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            housesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
            });
        }

        const dashaBalance = calculateVimshottariBalance(siderealPositions['Moon']?.longitude);
        const dashaPeriods = calculateVimshottariDashas(utcDate, dashaBalance);

        const d9_planets = {};
        const planetsToCalculate = PLANET_ORDER || Object.keys(siderealPositions);
        planetsToCalculate.forEach(planetName => {
            const siderealData = siderealPositions[planetName];
            if (siderealData && typeof siderealData.longitude === 'number' && !isNaN(siderealData.longitude)) {
                try {
                    const d9Longitude = calculateNavamsaLongitude(siderealData.longitude);
                    const d9NakDetails = getNakshatraDetails(d9Longitude);
                    const d9RashiDetails = getRashiDetails(d9Longitude);
                    d9_planets[planetName] = { longitude: d9Longitude, dms: convertToDMS(d9Longitude), nakshatra: d9NakDetails.name, nakLord: d9NakDetails.lord, rashi: d9RashiDetails.name, rashiLord: d9RashiDetails.lord, pada: calculateNakshatraPada(d9Longitude) };
                } catch (d9Error) {
                     logger.warn(`D9 calculation failed for ${planetName}: ${d9Error.message}`);
                     d9_planets[planetName] = { dms: "Error" };
                }
            } else if (PLANET_ORDER.includes(planetName)) {
                 d9_planets[planetName] = { dms: "N/A" };
            }
        });
        let d9AscendantDms = "Error";
        try {
            const d9AscendantDeg = calculateNavamsaLongitude(siderealAscendantDeg);
            d9AscendantDms = convertToDMS(d9AscendantDeg);
        } catch(d9AscError) {
             logger.warn(`D9 Ascendant calculation failed: ${d9AscError.message}`);
        }

        const mangalDoshaResult = calculateMangalDosha(siderealPositions, siderealCuspStartDegrees, siderealAscendantDeg);
        const kaalsarpaDoshaResult = calculateKaalsarpaDosha(siderealPositions);
        const moolDoshaResult = calculateMoolDosha(siderealPositions);
        const aspectData = calculateAspects(siderealPositions);
        const planetStateData = calculatePlanetStates(siderealPositions);

        const temporalFriendshipData = {}; const resultingFriendshipData = {};
        const naturalFriendshipMatrix = NATURAL_FRIENDSHIP; const friendshipOrder = FRIENDSHIP_PLANETS_ORDER;
        for (const planet of friendshipOrder) {
            temporalFriendshipData[planet] = calculateTemporalFriendshipForPlanet(planet, siderealPositions);
            resultingFriendshipData[planet] = {}; const naturalRow = naturalFriendshipMatrix[planet]; const temporalRow = temporalFriendshipData[planet];
            for (const otherPlanet of friendshipOrder) {
                if (planet === otherPlanet) { resultingFriendshipData[planet][otherPlanet] = '-'; continue; }
                const naturalIdx = friendshipOrder.indexOf(otherPlanet); const naturalStatus = naturalRow && naturalIdx !== -1 ? naturalRow[naturalIdx] : 'N/A';
                const temporalStatus = temporalRow ? temporalRow[otherPlanet] : 'N/A';
                resultingFriendshipData[planet][otherPlanet] = getResultingFriendship(naturalStatus, temporalStatus);
            }
        }

        // Pass necessary data to Shadbala
        const shadbalaData = calculateShadbala(siderealPositions, housesData, aspectData, sunMoonTimes, utcDate);

        const bhinnaAshtakavargaData = {};
        ASHTAKAVARGA_PLANETS.forEach(planetName => { bhinnaAshtakavargaData[planetName] = calculateBhinnaAshtakavarga(planetName, siderealPositions, siderealAscendantDeg); });
        const sarvaAshtakavargaData = calculateSarvaAshtakavarga(bhinnaAshtakavargaData);
        const ashtakavargaResult = { bhinna: bhinnaAshtakavargaData, sarva: sarvaAshtakavargaData };

        // --- Assemble Response Payload ---
         const responsePayload = {
            inputParameters: { date: date, latitude: latNum, longitude: lonNum, utcDate: utcDate.toISOString(), julianDayUT: julianDayUT, ayanamsa: ayanamsa },
            ascendant: { tropical_dms: convertToDMS(tropicalAscendant), sidereal_dms: convertToDMS(siderealAscendantDeg), nakshatra: ascendantNakDetails.name, nakLord: ascendantNakDetails.lord, rashi: getRashiDetails(siderealAscendantDeg).name, rashiLord: getRashiDetails(siderealAscendantDeg).lord, pada: calculateNakshatraPada(siderealAscendantDeg) },
            houses: housesData, planetaryPositions,
            sunMoonTimes: { sunrise: sunMoonTimes.sunrise || "N/A", sunset: sunMoonTimes.sunset || "N/A", moonrise: sunMoonTimes.moonrise || "N/A", moonset: sunMoonTimes.moonset || "N/A" },
            dashaBalance: { lord: dashaBalance.lord, balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`, balance_years_decimal: dashaBalance.balanceYears },
            dashaPeriods: dashaPeriods, d9_planets: d9_planets, d9_ascendant_dms: d9AscendantDms,
            panchang: detailedPanchang, vikram_samvat: detailedPanchang?.Samvat?.number || "N/A", samvatsar: detailedPanchang?.Samvatsara?.name_en_IN || "N/A",
            doshas: { mangal: mangalDoshaResult, kaalsarpa: kaalsarpaDoshaResult, mool: moolDoshaResult },
            planetDetails: { states: planetStateData, aspects: aspectData, naturalFriendship: { matrix: naturalFriendshipMatrix, order: friendshipOrder }, temporalFriendship: temporalFriendshipData, resultingFriendship: resultingFriendshipData, shadbala: shadbalaData },
            ashtakavarga: ashtakavargaResult,
        };
        logger.info(`Calculation successful for date=${date}, lat=${latNum}, lon=${lonNum}`);
        res.json(responsePayload);

    } catch (error) {
        // Use the centralized error handler
        handleRouteError(res, error, '/calculate', req.body);
    }
});


// --- Route: Save Birth Chart Data ---
router.post('/charts', saveChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { name, gender, date, latitude, longitude, placeName } = req.body;

        const chartDataToSave = {
            name: name, // Already trimmed and potentially escaped by validator
            gender: gender || '',
            date: date,
            latitude: latitude, // Already float
            longitude: longitude, // Already float
            placeName: placeName || '',
        };

        // --- Save to MongoDB using Mongoose Model ---
        const savedChart = await Chart.create(chartDataToSave);
        logger.info(`Saved chart to DB: ${savedChart.name} (ID: ${savedChart._id})`);

        // Respond with the newly created chart data
        res.status(201).json(savedChart); // 201 Created

    } catch (error) {
        // Check for specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            logger.warn("Mongoose Validation Error on save:", { errors: error.errors });
            return res.status(400).json({ error: "Validation failed during save.", details: error.errors });
        }
        // Use the centralized error handler for other errors
        handleRouteError(res, error, 'POST /charts', req.body);
    }
});

// --- Route: Get Saved Birth Chart Data (with Pagination) ---
router.get('/charts', paginationValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 20; // Default limit
        const skip = (page - 1) * limit;

        // Retrieve data from MongoDB with pagination and sorting
        const savedCharts = await Chart.find({})
            .sort({ name: 1 }) // Sort by name
            .skip(skip)
            .limit(limit)
            .lean(); // Use .lean() for faster queries returning plain JS objects

        const totalCharts = await Chart.countDocuments(); // Get total count for pagination info

        logger.info(`Fetched ${savedCharts.length} of ${totalCharts} saved charts from DB (Page ${page}, Limit ${limit}).`);

        // Map _id to id for frontend compatibility (already done by lean() potentially, but explicit is safe)
        const chartsForFrontend = savedCharts.map(chart => ({
            ...chart, // Spread the plain JS object
            id: chart._id.toString(), // Ensure id is a string
        }));


        res.json({
            charts: chartsForFrontend,
            currentPage: page,
            totalPages: Math.ceil(totalCharts / limit),
            totalCharts: totalCharts
        });

    } catch (error) {
        handleRouteError(res, error, 'GET /charts');
    }
});
router.delete('/charts/:id', deleteChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const chartId = req.params.id; // ID is validated as MongoId

        logger.info(`Attempting to delete chart with ID: ${chartId}`);

        const deletedChart = await Chart.findByIdAndDelete(chartId);

        if (!deletedChart) {
            logger.warn(`Chart not found for deletion with ID: ${chartId}`);
            return res.status(404).json({ error: 'Chart not found.' });
        }

        logger.info(`Successfully deleted chart: ${deletedChart.name} (ID: ${chartId})`);

        // Respond with success
        // Option 1: 200 OK with a message
        res.status(200).json({ message: `Chart '${deletedChart.name}' deleted successfully.` });

        // Option 2: 204 No Content (often used for DELETE success)
        // res.status(204).send();

    } catch (error) {
        // Use the centralized error handler
        handleRouteError(res, error, `DELETE /charts/${req.params.id}`, { id: req.params.id });
    }
});

// --- Route: Calculate Prashna Chart based on Number ---
router.post('/calculate-prashna-number', prashnaValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { number, latitude, longitude, placeName, date } = req.body;
        // number, latitude, longitude already parsed by validator

        logger.info(`Starting Prashna calculation for number=${number}, date=${date}, lat=${latitude}, lon=${longitude}`);

        // --- Core Calculation ---
        const siderealAscendantDeg = getNumberBasedAscendantDegree(number); // Throws on invalid number
        const { julianDayUT: currentJD_UT, utcDate: currentUTCDate } = getJulianDateUT(date, longitude);
        const ayanamsa = calculateAyanamsa(currentJD_UT);
        const planetaryPositions = calculatePlanetaryPositions(currentJD_UT);
        const siderealPositions = planetaryPositions.sidereal; // Extract for convenience
        const { tropicalAscendant: timeBasedTropicalAsc, tropicalCusps } = calculateHousesAndAscendant(currentJD_UT, latitude, longitude);
        const siderealCuspStartDegrees = tropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));

        // Override 1st cusp
        siderealCuspStartDegrees[0] = siderealAscendantDeg;

        // --- Populate Ascendant Details ---
        const ascendantNakDetails = getNakshatraDetails(siderealAscendantDeg);
        const ascendantRashiDetails = getRashiDetails(siderealAscendantDeg);
        const ascendantPada = calculateNakshatraPada(siderealAscendantDeg);
        const ascendantDetails = {
            sidereal_dms: convertToDMS(siderealAscendantDeg),
            nakshatra: ascendantNakDetails.name, nakLord: ascendantNakDetails.lord,
            rashi: ascendantRashiDetails.name, rashiLord: ascendantRashiDetails.lord,
            pada: ascendantPada
        };

        // --- Populate House Data ---
        const housesData = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = siderealCuspStartDegrees[i];
            const endDeg = siderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            housesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
            });
        }

        // --- Calculate Dasha based on CURRENT Moon ---
        const dashaBalance = calculateVimshottariBalance(siderealPositions['Moon']?.longitude);
        const dashaPeriods = calculateVimshottariDashas(currentUTCDate, dashaBalance);

        // --- Assemble Response Payload ---
        const responsePayload = {
            inputParameters: { number, date, latitude, longitude, placeName: placeName || '', ayanamsa },
            ascendant: ascendantDetails,
            houses: housesData,
            planetaryPositions, // Based on CURRENT time
            dashaBalance: { lord: dashaBalance.lord, balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`, balance_years_decimal: dashaBalance.balanceYears },
            dashaPeriods: dashaPeriods,
        };

        logger.info(`Prashna calculation successful for number=${number}`);
        res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-prashna-number', req.body);
    }
});

// --- Route: Calculate Varshphal (Annual Chart) ---
router.post('/calculate-varshphal', varshphalValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { natalDate, natalLatitude, natalLongitude, varshphalYear } = req.body;
        // natalLatitude, natalLongitude, varshphalYear already parsed by validator

        logger.info(`Starting Varshphal calculation for natalDate=${natalDate}, year=${varshphalYear}, lat=${natalLatitude}, lon=${natalLongitude}`);

        // --- Step 1: Calculate Natal Details Needed ---
        const { julianDayUT: natalJD_UT, utcDate: natalUTCDate } = getJulianDateUT(natalDate, natalLongitude);
        const natalAyanamsa = calculateAyanamsa(natalJD_UT);
        const natalPlanetaryPositions = calculatePlanetaryPositions(natalJD_UT);
        const natalSunLongitude = natalPlanetaryPositions?.tropical?.Sun?.longitude; // Use TROPICAL Sun for SR
        const { tropicalAscendant: natalTropicalAsc } = calculateHousesAndAscendant(natalJD_UT, natalLatitude, natalLongitude);
        const natalSiderealAscDeg = normalizeAngle(natalTropicalAsc - natalAyanamsa);
        const natalAscendantDetails = getRashiDetails(natalSiderealAscDeg);
        const natalAscendantSignIndex = natalAscendantDetails.index;
        const natalAscendantLord = natalAscendantDetails.lord;

        if (natalSunLongitude === undefined || isNaN(natalSunLongitude)) {
            throw new Error("Could not determine natal TROPICAL Sun longitude.");
        }

        // --- Step 2: Calculate Solar Return (SR) Moment ---
        const solarReturnJD_UT = await calculateSolarReturnJulianDay(natalJD_UT, natalSunLongitude, varshphalYear);
        const solarReturnUTCDate = new Date((solarReturnJD_UT - 2440587.5) * 86400000);

        // --- Step 3: Calculate Varshphal Chart for SR Moment & Natal Location ---
        const srAyanamsa = calculateAyanamsa(solarReturnJD_UT);
        const { tropicalAscendant: srTropicalAsc, tropicalCusps: srTropicalCusps } = calculateHousesAndAscendant(solarReturnJD_UT, natalLatitude, natalLongitude); // Use NATAL Lat/Lon
        const srSiderealAscDeg = normalizeAngle(srTropicalAsc - srAyanamsa);
        const srSiderealCuspStartDegrees = srTropicalCusps.map(cusp => normalizeAngle(cusp - srAyanamsa));
        const srAscendantDetails = getRashiDetails(srSiderealAscDeg);
        const srAscendantSignIndex = srAscendantDetails.index;
        const srAscendantLord = srAscendantDetails.lord;
        const srPlanetaryPositions = calculatePlanetaryPositions(solarReturnJD_UT);

        // Populate SR Ascendant details
        const srAscNakDetails = getNakshatraDetails(srSiderealAscDeg);
        const srAscRashiDetails = getRashiDetails(srSiderealAscDeg);
        const srAscPada = calculateNakshatraPada(srSiderealAscDeg);
        const srAscendantData = {
            sidereal_dms: convertToDMS(srSiderealAscDeg),
            nakshatra: srAscNakDetails.name, nakLord: srAscNakDetails.lord,
            rashi: srAscRashiDetails.name, rashiLord: srAscRashiDetails.lord,
            pada: srAscPada
        };

        // Populate SR House details
        const srHousesData = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = srSiderealCuspStartDegrees[i];
            const endDeg = srSiderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            srHousesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
            });
        }

        // --- Step 4: Calculate Muntha ---
        const birthYear = natalUTCDate.getUTCFullYear();
        const ageAtVarshphalStart = varshphalYear - birthYear;
        const munthaResult = calculateMuntha(natalAscendantSignIndex, ageAtVarshphalStart);
        const munthaSignName = RASHIS[munthaResult.signIndex] || 'N/A';
        let munthaHouse = null;
        for(let i=0; i<12; i++) {
            const houseRashiIndex = getRashiDetails(srSiderealCuspStartDegrees[i]).index;
            if (houseRashiIndex === munthaResult.signIndex) { munthaHouse = i + 1; break; }
        }
        const munthaData = { sign: munthaSignName, signIndex: munthaResult.signIndex, house: munthaHouse };

        // --- Step 5: Calculate Year Lord ---
        const solarReturnWeekDay = solarReturnUTCDate.getUTCDay();
        const yearLord = calculateYearLord(solarReturnWeekDay, natalAscendantLord, srAscendantLord);

        // --- Step 6: Calculate Mudda Dasha ---
        const muddaDashaPeriods = calculateMuddaDasha(solarReturnJD_UT, natalLatitude, natalLongitude);

        // --- Assemble Response Payload ---
        const responsePayload = {
            inputDetails: { natalDate, natalLatitude, natalLongitude, varshphalYear, solarReturnUTC: solarReturnUTCDate.toISOString(), solarReturnJD_UT },
            varshphalChart: { ascendant: srAscendantData, houses: srHousesData, planetaryPositions: srPlanetaryPositions },
            muntha: munthaData,
            yearLord: yearLord,
            muddaDasha: muddaDashaPeriods,
        };

        logger.info(`Varshphal calculation successful for natalDate=${natalDate}, year=${varshphalYear}`);
        res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-varshphal', req.body);
    }
});

// Export the router
export default router; // Using ES module export
