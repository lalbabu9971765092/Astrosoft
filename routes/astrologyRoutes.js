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
router.post('/calculate', baseChartValidation, async (req, res) => { // Added async
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { date, latitude, longitude, placeName } = req.body;
        const latNum = latitude; // Already parsed to float by validator
        const lonNum = longitude; // Already parsed to float by validator

        logger.info(`Starting calculation for date=${date}, lat=${latNum}, lon=${lonNum}`);

        // --- Core Calculation Steps ---
        // *** CORRECTED CALL: Pass latNum and lonNum in the correct order ***
        const { julianDayUT, utcDate, timezoneOffsetHours } = getJulianDateUT(date, latNum, lonNum);

        // Check if getJulianDateUT failed (returned nulls)
        if (julianDayUT === null) {
            // Error should have been logged within getJulianDateUT
            throw new Error('Failed to calculate Julian Day UT. Check input date/coordinates or timezone lookup.');
        }

        // Log results from getJulianDateUT (optional but helpful)
        logger.debug(`[Route /calculate] JD UT: ${julianDayUT}, UTC: ${utcDate?.toISOString()}, Offset: ${timezoneOffsetHours}`);

        // Proceed with calculations that depend on julianDayUT
        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
             throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
        // Check if house calculation failed (returned null cusps)
        if (tropicalCusps === null) {
             throw new Error(`Failed to calculate House Cusps for JD ${julianDayUT}, Lat ${latNum}, Lon ${lonNum}`);
        }

        const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
        const siderealCuspStartDegrees = tropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        const ascendantNakDetails = getNakshatraDetails(siderealAscendantDeg);
        const ascendantRashiDetails = getRashiDetails(siderealAscendantDeg); // Get Rashi details for Ascendant
        const ascendantPada = calculateNakshatraPada(siderealAscendantDeg); // Get Pada for Ascendant

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        // planetaryPositions util now throws on critical failure

        const siderealPositions = planetaryPositions.sidereal; // Extract for convenience
        const sunMoonTimes = calculateSunMoonTimes(date, latNum, lonNum);
        const detailedPanchang = await calculatePanchang(utcDate, latNum, lonNum); // Throws on error
 // *** CONSISTENCY FIX: Ensure Panchang Nakshatra name matches Moon's calculated Nakshatra ***
 const moonNakshatraNameFromPosition = siderealPositions['Moon']?.nakshatra;
 if (detailedPanchang?.Nakshatra && moonNakshatraNameFromPosition && detailedPanchang.Nakshatra.name_en_IN !== moonNakshatraNameFromPosition) {
     logger.debug(`Aligning Panchang Nakshatra name (${detailedPanchang.Nakshatra.name_en_IN}) with Moon's position Nakshatra (${moonNakshatraNameFromPosition})`);
     detailedPanchang.Nakshatra.name_en_IN = moonNakshatraNameFromPosition;
 }
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

        const dashaBalance = calculateVimshottariBalance(siderealPositions['Moon']?.longitude); // Throws on error
        const dashaPeriods = calculateVimshottariDashas(utcDate, dashaBalance); // Throws on error

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
            inputParameters: { date: date, latitude: latNum, longitude: lonNum, placeName: placeName || '', utcDate: utcDate.toISOString(), julianDayUT: julianDayUT, ayanamsa: ayanamsa, timezoneOffsetHours: timezoneOffsetHours }, // Added placeName, offset
            ascendant: {
                tropical_dms: convertToDMS(tropicalAscendant),
                sidereal_dms: convertToDMS(siderealAscendantDeg),
                nakshatra: ascendantNakDetails.name,
                nakLord: ascendantNakDetails.lord,
                rashi: ascendantRashiDetails.name, // Use calculated Rashi details
                rashiLord: ascendantRashiDetails.lord, // Use calculated Rashi details
                pada: ascendantPada // Use calculated Pada
            },
            houses: housesData,
            planetaryPositions, // Contains both tropical and sidereal
            sunMoonTimes: {
                sunrise: sunMoonTimes.sunrise || "N/A",
                sunset: sunMoonTimes.sunset || "N/A",
                moonrise: sunMoonTimes.moonrise || "N/A",
                moonset: sunMoonTimes.moonset || "N/A"
            },
            dashaBalance: {
                lord: dashaBalance.lord,
                balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`,
                balance_years_decimal: dashaBalance.balanceYears
            },
            dashaPeriods: dashaPeriods,
            d9_planets: d9_planets,
            d9_ascendant_dms: d9AscendantDms,
            panchang: detailedPanchang, // Includes Masa, Samvat etc. from calculatePanchang
            vikram_samvat: detailedPanchang?.calculatedVikramSamvat || "N/A",
            samvatsar: detailedPanchang?.calculatedSamvatsar || "N/A",
            doshas: {
                mangal: mangalDoshaResult,
                kaalsarpa: kaalsarpaDoshaResult,
                mool: moolDoshaResult
            },
            planetDetails: {
                states: planetStateData,
                aspects: aspectData,
                naturalFriendship: { matrix: naturalFriendshipMatrix, order: friendshipOrder },
                temporalFriendship: temporalFriendshipData,
                resultingFriendship: resultingFriendshipData,
                shadbala: shadbalaData
            },
            ashtakavarga: ashtakavargaResult,
        };
        logger.info(`Calculation successful for date=${date}, lat=${latNum}, lon=${lonNum}`);
        res.json(responsePayload);

    } catch (error) {
        // Use the centralized error handler
        handleRouteError(res, error, '/calculate', req.body);
    }
});

// --- Other Routes (Save, Get, Delete Charts, Prashna, Varshphal) ---
// ... (Keep the rest of your routes as they were, ensuring they also use handleRouteError and correct variable names) ...

// --- Route: Save Birth Chart Data ---
router.post('/charts', saveChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, gender, date, latitude, longitude, placeName } = req.body;
        const chartDataToSave = { name, gender: gender || '', date, latitude, longitude, placeName: placeName || '' };
        const savedChart = await Chart.create(chartDataToSave);
        logger.info(`Saved chart to DB: ${savedChart.name} (ID: ${savedChart._id})`);
        res.status(201).json(savedChart);
    } catch (error) {
        if (error.name === 'ValidationError') {
            logger.warn("Mongoose Validation Error on save:", { errors: error.errors });
            return res.status(400).json({ error: "Validation failed during save.", details: error.errors });
        }
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
        const limit = req.query.limit || 20;
        const skip = (page - 1) * limit;
        const savedCharts = await Chart.find({})
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const totalCharts = await Chart.countDocuments();
        logger.info(`Fetched ${savedCharts.length} of ${totalCharts} saved charts from DB (Page ${page}, Limit ${limit}).`);
        const chartsForFrontend = savedCharts.map(chart => ({ ...chart, id: chart._id.toString() }));
        res.json({ charts: chartsForFrontend, currentPage: page, totalPages: Math.ceil(totalCharts / limit), totalCharts });
    } catch (error) {
        handleRouteError(res, error, 'GET /charts');
    }
});

// --- Route: Delete Saved Chart ---
router.delete('/charts/:id', deleteChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const chartId = req.params.id;
        logger.info(`Attempting to delete chart with ID: ${chartId}`);
        const deletedChart = await Chart.findByIdAndDelete(chartId);
        if (!deletedChart) {
            logger.warn(`Chart not found for deletion with ID: ${chartId}`);
            return res.status(404).json({ error: 'Chart not found.' });
        }
        logger.info(`Successfully deleted chart: ${deletedChart.name} (ID: ${chartId})`);
        res.status(200).json({ message: `Chart '${deletedChart.name}' deleted successfully.` });
    } catch (error) {
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
        const { number, latitude, longitude, placeName, date } = req.body;
        const latNum = latitude; // Already parsed
        const lonNum = longitude; // Already parsed

        logger.info(`Starting Prashna calculation for number=${number}, date=${date}, lat=${latNum}, lon=${lonNum}`);

        // --- Core Calculation ---
        const siderealAscendantDeg = getNumberBasedAscendantDegree(number); // Throws on invalid number

        // Use current time for JD UT and planetary positions
        const { julianDayUT: currentJD_UT, utcDate: currentUTCDate, timezoneOffsetHours } = getJulianDateUT(date, latNum, lonNum); // Pass latNum, lonNum
        if (currentJD_UT === null) {
            throw new Error('Failed to calculate Julian Day UT for Prashna time.');
        }

        const ayanamsa = calculateAyanamsa(currentJD_UT);
        if (isNaN(ayanamsa)) { throw new Error(`Failed to calculate Ayanamsa for Prashna JD ${currentJD_UT}`); }

        const planetaryPositions = calculatePlanetaryPositions(currentJD_UT);
        const siderealPositions = planetaryPositions.sidereal;

        // Calculate houses based on the *number-derived* Ascendant, but use current time's ephemeris data
        // This requires a way to calculate cusps from a given Ascendant degree.
        // Swisseph's swe_houses_ex might be needed, or a manual Placidus calculation.
        // For now, let's use the time-based cusps but override the first one.
        // WARNING: This is an approximation, true KP Prashna might use different house system or method.
        const { tropicalCusps: timeBasedTropicalCusps } = calculateHousesAndAscendant(currentJD_UT, latNum, lonNum);
        if (timeBasedTropicalCusps === null) {
            throw new Error(`Failed to calculate time-based House Cusps for Prashna JD ${currentJD_UT}`);
        }
        const siderealCuspStartDegrees = timeBasedTropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        siderealCuspStartDegrees[0] = siderealAscendantDeg; // Override 1st cusp

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

        // --- Populate House Data (using potentially overridden cusps) ---
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
            inputParameters: { number, date, latitude: latNum, longitude: lonNum, placeName: placeName || '', ayanamsa, timezoneOffsetHours },
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
        const { natalDate, natalLatitude, natalLongitude, varshphalYear, natalPlaceName } = req.body; // Added natalPlaceName
        const latNum = natalLatitude; // Already parsed
        const lonNum = natalLongitude; // Already parsed

        logger.info(`Starting Varshphal calculation for natalDate=${natalDate}, year=${varshphalYear}, lat=${latNum}, lon=${lonNum}`);

        // --- Step 1: Calculate Natal Details Needed ---
        const { julianDayUT: natalJD_UT, utcDate: natalUTCDate, timezoneOffsetHours: natalTzOffset } = getJulianDateUT(natalDate, latNum, lonNum); // Pass lat/lon
        if (natalJD_UT === null) { throw new Error('Failed to calculate Natal Julian Day UT.'); }

        const natalAyanamsa = calculateAyanamsa(natalJD_UT);
        if (isNaN(natalAyanamsa)) { throw new Error(`Failed to calculate Natal Ayanamsa for JD ${natalJD_UT}`); }

        const natalPlanetaryPositions = calculatePlanetaryPositions(natalJD_UT);
        const natalSunLongitude = natalPlanetaryPositions?.tropical?.Sun?.longitude;
        if (natalSunLongitude === undefined || isNaN(natalSunLongitude)) { throw new Error("Could not determine natal TROPICAL Sun longitude."); }

        const { tropicalAscendant: natalTropicalAsc } = calculateHousesAndAscendant(natalJD_UT, latNum, lonNum);
        const natalSiderealAscDeg = normalizeAngle(natalTropicalAsc - natalAyanamsa);
        const natalAscendantDetails = getRashiDetails(natalSiderealAscDeg);
        const natalAscendantSignIndex = natalAscendantDetails.index;
        const natalAscendantLord = natalAscendantDetails.lord;

        // --- Step 2: Calculate Solar Return (SR) Moment ---
        const solarReturnJD_UT = await calculateSolarReturnJulianDay(natalJD_UT, natalSunLongitude, varshphalYear);
        const solarReturnUTCDate = new Date((solarReturnJD_UT - 2440587.5) * 86400000);

        // --- Step 3: Calculate Varshphal Chart for SR Moment & Natal Location ---
        const srAyanamsa = calculateAyanamsa(solarReturnJD_UT);
        if (isNaN(srAyanamsa)) { throw new Error(`Failed to calculate SR Ayanamsa for JD ${solarReturnJD_UT}`); }

        const { tropicalAscendant: srTropicalAsc, tropicalCusps: srTropicalCusps } = calculateHousesAndAscendant(solarReturnJD_UT, latNum, lonNum); // Use NATAL Lat/Lon
        if (srTropicalCusps === null) { throw new Error(`Failed to calculate SR House Cusps for JD ${solarReturnJD_UT}`); }

        const srSiderealAscDeg = normalizeAngle(srTropicalAsc - srAyanamsa);
        const srSiderealCuspStartDegrees = srTropicalCusps.map(cusp => normalizeAngle(cusp - srAyanamsa));
        const srAscendantDetails = getRashiDetails(srSiderealAscDeg);
        // const srAscendantSignIndex = srAscendantDetails.index; // Not needed directly?
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
        // Find the house where the Muntha sign falls in the SR chart
        for(let i=0; i<12; i++) {
            // Check the Rashi of the *start* of the house cusp in the SR chart
            const houseStartDeg = srSiderealCuspStartDegrees[i];
            const houseRashiIndex = getRashiDetails(houseStartDeg).index;
            if (houseRashiIndex === munthaResult.signIndex) {
                munthaHouse = i + 1;
                break;
            }
        }
        const munthaData = { sign: munthaSignName, signIndex: munthaResult.signIndex, house: munthaHouse };

        // --- Step 5: Calculate Year Lord ---
        const solarReturnWeekDay = solarReturnUTCDate.getUTCDay();
        const yearLord = calculateYearLord(solarReturnWeekDay, natalAscendantLord, srAscendantLord);

        // --- Step 6: Calculate Mudda Dasha ---
        const muddaDashaPeriods = calculateMuddaDasha(solarReturnJD_UT, latNum, lonNum); // Pass lat/lon

        // --- Assemble Response Payload ---
        const responsePayload = {
            inputDetails: { natalDate, natalLatitude: latNum, natalLongitude: lonNum, natalPlaceName: natalPlaceName || '', varshphalYear, solarReturnUTC: solarReturnUTCDate.toISOString(), solarReturnJD_UT, natalTzOffset },
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
