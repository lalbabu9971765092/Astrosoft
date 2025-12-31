// routes/astrologyRoutes.js
import express from 'express'; // Using import syntax

import { body, query, param, validationResult } from 'express-validator';
import moment from 'moment-timezone';
import Chart from '../models/Chart.js';
// --- Import Logger ---
import logger from '../utils/logger.js';

// --- Import Utilities from the new structure ---
// Assuming you have utils/index.js re-exporting everything
import {
    PLANET_ORDER, normalizeAngle, getNakshatraDetails, getRashiDetails,
    calculateNakshatraPada, getJulianDateUT, calculateAyanamsa, convertToDMS,
    convertDMSToDegrees, getNakshatraPadaAlphabet,
    calculateMidpoint, calculateSunMoonTimes, calculateBadhakDetails, calculateLongevityFactors, calculateHouseBasedLongevity,
    calculatePlanetaryPositions, calculateVimshottariBalance, calculateVimshottariDashas,
    calculateNavamsaLongitude, calculateHoraLongitude, calculateDrekkanaLongitude, calculateSaptamsaLongitude, calculateDwadasamsaLongitude, calculateTrimsamsaLongitude, calculateShashtiamsaLongitude, calculateDasamsaLongitude, calculateShasthamsaLongitude, calculateMangalDosha, calculateKaalsarpaDosha,
    calculateMoolDosha, calculatePlanetStates, calculateAspects,
    PLANETARY_RELATIONS, FRIENDSHIP_PLANETS_ORDER, calculateTemporalFriendshipForPlanet,
    getResultingFriendship, calculateShadbala, calculateBhinnaAshtakavarga,
    calculateSarvaAshtakavarga, ASHTAKAVARGA_PLANETS, calculateSolarReturnJulianDay,
    calculateMuntha, calculateYearLord, calculateMuddaDasha, RASHIS,
    getNumberBasedAscendantDegree, getSubLordDetails, getSubSubLordDetails, NAKSHATRA_SPAN, RASHI_SPAN, calculateKpSignificators, getHouseOfPlanet,
    calculateUPBS, calculateAllBirthChartYogas
} from '../utils/index.js'; // Adjust path if your index is elsewhere or import directly
import { calculatePanchang } from '../utils/panchangUtils.js';
import { calculateHousesAndAscendant } from '../utils/coreUtils.js';
import { calculateMuhurta } from '../utils/muhurtaUtils.js';
import { rotateHouses, applyHouseRotation } from '../utils/rotationUtils.js';
import { calculateYogasForMonth } from '../utils/monthlyYogaUtils.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const muhurtaCache = new Map();



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
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.'),
    body('lang').optional().isIn(['en', 'hi']).withMessage('Language must be "en" or "hi".')
];

const rotatedChartValidation = [
    ...baseChartValidation,
    body('house_to_rotate').isInt({ min: 1, max: 12 }).toInt().withMessage('House to rotate must be an integer between 1 and 12.')
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

const rotatedPrashnaValidation = [
    ...prashnaValidation,
    body('house_to_rotate').isInt({ min: 1, max: 12 }).toInt().withMessage('House to rotate must be an integer between 1 and 12.')
];

const varshphalValidation = [
    body('natalDate').isISO8601().withMessage('Invalid natal date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('natalLatitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Natal latitude must be a number between -90 and 90.'),
    body('natalLongitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Natal longitude must be a number between -180 and 180.'),
    body('varshphalYear').isInt({ min: 1900, max: 2100 }).toInt().withMessage('Varshphal year must be a number between 1900 and 2100.') // Adjust range if needed
];

const rotatedVarshphalValidation = [
    ...varshphalValidation,
    body('house_to_rotate').isInt({ min: 1, max: 12 }).toInt().withMessage('House to rotate must be an integer between 1 and 12.')
];

const paginationValidation = [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.') // Max limit for performance
];
const deleteChartValidation = [
    param('id').isMongoId().withMessage('Invalid Chart ID format.')
];

// Helper function to calculate planets and houses for a given divisional chart
const calculateDivisionalChartData = (siderealPositions, siderealAscendantDeg, divisionalCalculationFunction) => {
    const divisional_planets = {};
    PLANET_ORDER.forEach(planetName => {
        const siderealData = siderealPositions[planetName];
        if (siderealData && typeof siderealData.longitude === 'number' && !isNaN(siderealData.longitude)) {
            try {
                const divisionalLongitude = divisionalCalculationFunction(siderealData.longitude);
                const divisionalNakDetails = getNakshatraDetails(divisionalLongitude);
                const divisionalRashiDetails = getRashiDetails(divisionalLongitude);
                const divisionalPada = calculateNakshatraPada(divisionalLongitude);
                const divisionalSubLordDetails = getSubLordDetails(divisionalLongitude);
                const divisionalPositionWithinNakshatra = divisionalLongitude - (divisionalNakDetails.index * NAKSHATRA_SPAN);
                const divisionalSubSubLordDetails = getSubSubLordDetails(divisionalPositionWithinNakshatra, divisionalSubLordDetails);

                divisional_planets[planetName] = {
                    longitude: divisionalLongitude,
                    dms: convertToDMS(divisionalLongitude),
                    nakshatra: divisionalNakDetails.name,
                    nakLord: divisionalNakDetails.lord,
                    rashi: divisionalRashiDetails.name,
                    rashiLord: divisionalRashiDetails.lord,
                    pada: divisionalPada,
                    subLord: divisionalSubLordDetails.lord,
                    subSubLord: divisionalSubSubLordDetails.lord,
                    // Inherit avasthas from D1 for now, or calculate if specific logic exists
                    avasthas: siderealData.avasthas ? { ...siderealData.avasthas } : { dignity: 'N/A', balaadi: 'N/A', jagradadi: 'N/A', deeptaadi: 'N/A', speedLongitude: 'N/A', isRetrograde: false, isCombust: false },
                };
            } catch (divisionalError) {
                logger.warn(`Divisional calculation (${divisionalCalculationFunction.name}) failed for ${planetName}: ${divisionalError.message}`);
                divisional_planets[planetName] = {
                    dms: "Error",
                    avasthas: { dignity: 'N/A', balaadi: 'N/A', jagradadi: 'N/A', deeptaadi: 'N/A', speedLongitude: 'N/A', isRetrograde: false, isCombust: false }
                };
            }
        } else if (PLANET_ORDER.includes(planetName)) {
            divisional_planets[planetName] = {
                dms: "N/A",
                avasthas: { dignity: 'N/A', balaadi: 'N/A', jagradadi: 'N/A', deeptaadi: 'N/A', speedLongitude: 'N/A', isRetrograde: false, isCombust: false }
            };
        }
    });

    let divisionalAscendantDms = "N/A";
    let divisionalAscendantDeg;
    const divisionalHouses = [];

    try {
        divisionalAscendantDeg = divisionalCalculationFunction(siderealAscendantDeg);
        divisionalAscendantDms = convertToDMS(divisionalAscendantDeg);

        const ascendantRashiName = getRashiDetails(divisionalAscendantDeg).name;
        const ascendantRashiIndex = RASHIS.indexOf(ascendantRashiName);

        if (ascendantRashiIndex !== -1) {
            for (let i = 0; i < 12; i++) {
                const house_number = i + 1;
                const currentRashiIndex = (ascendantRashiIndex + i) % 12;
                const rashiStartDeg = currentRashiIndex * RASHI_SPAN;

                const rashiEndDeg = normalizeAngle(rashiStartDeg + RASHI_SPAN);
                const rashiMeanDeg = normalizeAngle(rashiStartDeg + RASHI_SPAN / 2);

                const start_rashi_details = getRashiDetails(rashiStartDeg);
                const start_nakshatra_details = getNakshatraDetails(rashiStartDeg);
                const start_sub_lord_details = getSubLordDetails(rashiStartDeg);

                divisionalHouses.push({
                    house_number: house_number,
                    start_dms: convertToDMS(rashiStartDeg),
                    mean_dms: convertToDMS(rashiMeanDeg),
                    end_dms: convertToDMS(rashiEndDeg),
                    start_rashi: start_rashi_details.name,
                    start_rashi_lord: start_rashi_details.lord,
                    start_nakshatra: start_nakshatra_details.name,
                    start_nakshatra_lord: start_nakshatra_details.lord,
                    start_sub_lord: start_sub_lord_details.lord,
                });
            }
        }
    } catch (ascError) {
        logger.warn(`Divisional Ascendant calculation (${divisionalCalculationFunction.name}) failed: ${ascError.message}`);
    }
    return { divisional_planets, divisionalHouses, divisional_ascendant_dms: divisionalAscendantDms };
};

// --- Route: Calculate Astrology Details ---
router.post('/calculate', baseChartValidation, async (req, res) => { // Added async
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { date, latitude, longitude, placeName, lang } = req.body;
        const latNum = latitude; // Already parsed to float by validator
        const lonNum = longitude; // Already parsed to float by validator

        

        // --- Core Calculation Steps ---
        // *** CORRECTED CALL: Pass latNum and lonNum in the correct order ***
        const { julianDayUT, utcDate, timezoneOffsetHours, momentLocal } = getJulianDateUT(date, latNum, lonNum);

        // Check if getJulianDateUT failed (returned nulls)
        if (julianDayUT === null) {
            // Error should have been logged within getJulianDateUT
            throw new Error('Failed to calculate Julian Day UT. Check input date/coordinates or timezone lookup.');
        }

        // Log results from getJulianDateUT (optional but helpful)
        
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

        const { siderealCuspStartDegrees, siderealAscendantDeg, rotatedCusps, rotatedAscendantDeg } = applyHouseRotation({ tropicalCusps, tropicalAscendant, ayanamsa, houseToRotate: req.body?.house_to_rotate });

        // Determine whether to use the rotated ascendant (if a valid rotation was requested)
        const htr = req.body?.house_to_rotate;
        const useRotated = typeof htr === 'number' && !isNaN(htr) && htr >= 1 && htr <= 12 && htr !== 1;
        const ascendantDegToUse = useRotated ? rotatedAscendantDeg : siderealAscendantDeg;

        // Ascendant / Lagna details should be computed from the (possibly rotated) ascendant
        const ascendantNakDetails = getNakshatraDetails(ascendantDegToUse);
        const ascendantRashiDetails = getRashiDetails(ascendantDegToUse); // Get Rashi details for Ascendant
        const ascendantPada = calculateNakshatraPada(ascendantDegToUse); // Get Pada for Ascendant
        const ascendantPadaAlphabet = getNakshatraPadaAlphabet(ascendantNakDetails.name, ascendantPada); // Get the alphabet
        const ascendantSubLordDetails = getSubLordDetails(ascendantDegToUse);
        const ascendantPositionWithinNakshatra = ascendantDegToUse - (ascendantNakDetails.index * NAKSHATRA_SPAN);
        const ascendantSubSubLordDetails = getSubSubLordDetails(ascendantPositionWithinNakshatra, ascendantSubLordDetails);

        // Calculate Badhak details and divisional ascendant using the chosen ascendant
        const ascendantDegForBadhak = ascendantDegToUse;
        const ascForDivisional = ascendantDegToUse;
        const badhakDetails = calculateBadhakDetails(ascendantDegForBadhak);
        let badhakDetailsToReturn = { ...badhakDetails };

        if (useRotated) {
            badhakDetailsToReturn.rotatedHouse = badhakDetails.badhakHouse;
        }

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        // planetaryPositions util now throws on critical failure

        const siderealPositions = planetaryPositions.sidereal; // Extract for convenience        
        const sunMoonTimes = calculateSunMoonTimes(utcDate, latNum, lonNum); // Pass UTC Date object

        // --- Calculate sunrise/nextSunrise moments for Mool Dosha timing ---
        const nextDayUtcDate = moment(utcDate).add(1, 'day').toDate();
        const nextDaySunMoonTimes = calculateSunMoonTimes(nextDayUtcDate, latNum, lonNum); // Pass UTC Date object
        const sunriseMoment = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const nextSunriseMoment = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

        const detailedPanchang = await calculatePanchang(utcDate, latNum, lonNum, planetaryPositions); // Throws on error
        
 // *** CONSISTENCY FIX: Ensure Panchang Nakshatra name matches Moon's calculated Nakshatra ***
 const moonNakshatraNameFromPosition = siderealPositions['Moon']?.nakshatra;
 if (detailedPanchang?.Nakshatra && moonNakshatraNameFromPosition && detailedPanchang.Nakshatra.name_en_IN !== moonNakshatraNameFromPosition) {
     detailedPanchang.Nakshatra.name_en_IN = moonNakshatraNameFromPosition;
 }
           const rotatedSiderealCuspStartDegrees = rotatedCusps;
           const housesData = [];
           for (let i = 0; i < 12; i++) {
               const houseNumber = i + 1;
              const startDeg = rotatedSiderealCuspStartDegrees[i];
              const endDeg = rotatedSiderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            const startRashiDetails = getRashiDetails(startDeg);
            const startNakDetails = getNakshatraDetails(startDeg); // Ensure nakshatra details are captured for the start of the cusp
            const startSubLordDetails = getSubLordDetails(startDeg); // Calculate sub lord for the cusp start
            housesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                start_deg: startDeg, // ADDED: Numerical degree for house cusp start
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
                start_rashi: startRashiDetails.name,
                start_rashi_lord: startRashiDetails.lord,
                start_nakshatra: startNakDetails.name, 
                start_nakshatra_lord: startNakDetails.lord,
                start_sub_lord: startSubLordDetails.lord, // Add the sub lord to the house data
            });
        }

        // Calculate Longevity Factors (Maraka, etc.)
        const longevityFactors = calculateLongevityFactors(housesData);

        // Calculate House-Based Longevity
        const houseBasedLongevity = calculateHouseBasedLongevity(siderealPositions, rotatedSiderealCuspStartDegrees, badhakDetails);

        const dashaBalance = calculateVimshottariBalance(siderealPositions['Moon']?.longitude); // Throws on error
        const dashaPeriods = calculateVimshottariDashas(utcDate, dashaBalance); // Throws on error

        // D9 (Navamsa) Calculations
        const { divisional_planets: d9_planets, divisionalHouses: d9_houses, divisional_ascendant_dms: d9_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateNavamsaLongitude);

        // D2 (Hora) Calculations
        const { divisional_planets: d2_planets, divisionalHouses: d2_houses, divisional_ascendant_dms: d2_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateHoraLongitude);

        // D3 (Drekkana) Calculations
        const { divisional_planets: d3_planets, divisionalHouses: d3_houses, divisional_ascendant_dms: d3_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateDrekkanaLongitude);

        // D7 (Saptamsa) Calculations
        const { divisional_planets: d7_planets, divisionalHouses: d7_houses, divisional_ascendant_dms: d7_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateSaptamsaLongitude);

        // D12 (Dwadasamsa) Calculations
        const { divisional_planets: d12_planets, divisionalHouses: d12_houses, divisional_ascendant_dms: d12_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateDwadasamsaLongitude);

        // D30 (Trimsamsa) Calculations
        const { divisional_planets: d30_planets, divisionalHouses: d30_houses, divisional_ascendant_dms: d30_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateTrimsamsaLongitude);

        // D60 (Shashtiamsa) Calculations
        const { divisional_planets: d60_planets, divisionalHouses: d60_houses, divisional_ascendant_dms: d60_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateShashtiamsaLongitude);

        // D10 (Dasamsa) Calculations
        const { divisional_planets: d10_planets, divisionalHouses: d10_houses, divisional_ascendant_dms: d10_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateDasamsaLongitude);

        // D6 (Shasthamsa) Calculations
        const { divisional_planets: d6_planets, divisionalHouses: d6_houses, divisional_ascendant_dms: d6_ascendant_dms } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateShasthamsaLongitude);
        
        const mangalDoshaResult = calculateMangalDosha(siderealPositions, siderealCuspStartDegrees, siderealAscendantDeg);

        const kaalsarpaDoshaResult = calculateKaalsarpaDosha(siderealPositions);
        const moolDoshaResult = await calculateMoolDosha(date, latNum, lonNum, siderealPositions, sunriseMoment, nextSunriseMoment);
        const { directAspects, reverseAspects } = calculateAspects(siderealPositions, rotatedSiderealCuspStartDegrees);
        const planetStateData = calculatePlanetStates(siderealPositions);

        const temporalFriendshipData = {}; const resultingFriendshipData = {};
        const naturalFriendshipMatrix = PLANETARY_RELATIONS; const friendshipOrder = FRIENDSHIP_PLANETS_ORDER;
        for (const planet of friendshipOrder) {
            temporalFriendshipData[planet] = calculateTemporalFriendshipForPlanet(planet, siderealPositions);
            resultingFriendshipData[planet] = {}; const naturalRow = naturalFriendshipMatrix[planet]; const temporalRow = temporalFriendshipData[planet];
            for (const otherPlanet of friendshipOrder) {
                if (planet === otherPlanet) { resultingFriendshipData[planet][otherPlanet] = '-'; continue; }
                let naturalStatus;
                if (naturalRow.friends.includes(otherPlanet)) {
                    naturalStatus = 'F';
                } else if (naturalRow.enemies.includes(otherPlanet)) {
                    naturalStatus = 'E';
                } else if (naturalRow.neutrals.includes(otherPlanet)) {
                    naturalStatus = 'N';
                } else {
                    naturalStatus = 'N/A'; // Fallback, should ideally not be reached if PLANETARY_RELATIONS covers all cases
                }
                const temporalStatus = temporalRow ? temporalRow[otherPlanet] : 'N/A';
                resultingFriendshipData[planet][otherPlanet] = getResultingFriendship(naturalStatus, temporalStatus);
            }
        }

                const divisionalPositions = {
            D1: siderealPositions,
            D2: d2_planets,
            D3: d3_planets,
            D7: d7_planets,
            D9: d9_planets,
            D12: d12_planets,
            D30: d30_planets,
            D60: d60_planets,
            D10: d10_planets,
            D6: d6_planets
        };
        const shadbalaData = calculateShadbala(siderealPositions, housesData, directAspects, sunMoonTimes, utcDate, divisionalPositions);

        const bhinnaAshtakavargaData = {};
        ASHTAKAVARGA_PLANETS.forEach(planetName => { bhinnaAshtakavargaData[planetName] = calculateBhinnaAshtakavarga(planetName, siderealPositions, siderealAscendantDeg); });
        const sarvaAshtakavargaData = calculateSarvaAshtakavarga(bhinnaAshtakavargaData);
        const ashtakavargaResult = { bhinna: bhinnaAshtakavargaData, sarva: sarvaAshtakavargaData };

        // Calculate planet house placements for Bhava Chalit chart
        const planetHousePlacements = {};
        const cuspStartForPlanets = useRotated ? rotatedSiderealCuspStartDegrees : siderealCuspStartDegrees;
        PLANET_ORDER.forEach(planetName => {
            const planetData = siderealPositions[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                planetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, cuspStartForPlanets);
            }
        });

        // --- Prepare data for UPBS calculation ---
        const unifiedChartData = {
            planetaryPositions: planetaryPositions, // Contains sidereal with avasthas
            planetHousePlacements: planetHousePlacements, // From Nirayana Bhav Chalit
            planetDetails: {
                aspects: {
                    directAspects: directAspects,
                    reverseAspects: reverseAspects
                },
                states: planetStateData // D1 dignity (calculatePlanetStates result)
            },
            shadbala: shadbalaData,
            d9_planets: d9_planets, // For Navamsa strength
            ascendant: {
                sidereal_dms: convertToDMS(ascendantDegToUse),
                siderealAscendantDeg: ascendantDegToUse // Raw degree, for getRashiDetails in FBS
            },
            houses: housesData // For house lordship in FBS (start_rashi_lord)
        };

        // --- Calculate UPBS for each planet ---
        const upbsScores = {};
        for (const planet of FRIENDSHIP_PLANETS_ORDER) {
            upbsScores[planet] = calculateUPBS(planet, unifiedChartData);
        }

        const allBirthChartYogas = calculateAllBirthChartYogas(siderealPositions, housesData, lang);

        // --- Assemble Response Payload ---
         const responsePayload = {
            inputParameters: { date: date, latitude: latNum, longitude: lonNum, placeName: placeName || '', utcDate: utcDate.toISOString(), julianDayUT: julianDayUT, ayanamsa: ayanamsa, timezoneOffsetHours: timezoneOffsetHours }, // Added placeName, offset
            ascendant: {
                tropical_dms: convertToDMS(tropicalAscendant),
                sidereal_dms: convertToDMS(ascendantDegToUse),
                nakshatra: ascendantNakDetails.name,
                nakLord: ascendantNakDetails.lord,
                rashi: ascendantRashiDetails.name, // Use calculated Rashi details
                rashiLord: ascendantRashiDetails.lord, // Use calculated Rashi details
                pada: ascendantPada, // Use calculated Pada
                padaAlphabet: ascendantPadaAlphabet, // Add the alphabet here
                subLord: ascendantSubLordDetails.lord, // Add Ascendant Sub Lord
                subSubLord: ascendantSubSubLordDetails.lord // Add Ascendant Sub-Sub Lord
            },
            badhakDetails: badhakDetailsToReturn,
            longevityFactors: longevityFactors,
            houseBasedLongevity: houseBasedLongevity,
            houses: housesData,
            planetaryPositions, // Contains both tropical and sidereal
            planetHousePlacements: planetHousePlacements, // Add this line for Bhava Chalit
            sunMoonTimes: {
                sunrise: sunMoonTimes.sunrise === null ? "N/A" : sunMoonTimes.sunrise,
                sunset: sunMoonTimes.sunset === null ? "N/A" : sunMoonTimes.sunset,
                moonrise: sunMoonTimes.moonrise === null ? "N/A" : sunMoonTimes.moonrise,
                moonset: sunMoonTimes.moonset === null ? "N/A" : sunMoonTimes.moonset
            },
            dashaBalance: {
                lord: dashaBalance.lord,
                balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`,
                balance_years_decimal: dashaBalance.balanceYears
            },
            dashaPeriods: dashaPeriods,
            d9_planets: d9_planets,
            d9_ascendant_dms: d9_ascendant_dms,
            d9_houses: d9_houses,
            d2_planets: d2_planets,
            d2_ascendant_dms: d2_ascendant_dms,
            d2_houses: d2_houses,
            d3_planets: d3_planets,
            d3_ascendant_dms: d3_ascendant_dms,
            d3_houses: d3_houses,
            d7_planets: d7_planets,
            d7_ascendant_dms: d7_ascendant_dms,
            d7_houses: d7_houses,
            d12_planets: d12_planets,
            d12_ascendant_dms: d12_ascendant_dms,
            d12_houses: d12_houses,
            d30_planets: d30_planets,
            d30_ascendant_dms: d30_ascendant_dms,
            d30_houses: d30_houses,
            d60_planets: d60_planets,
            d60_ascendant_dms: d60_ascendant_dms,
            d60_houses: d60_houses,
            d10_planets: d10_planets,
            d10_ascendant_dms: d10_ascendant_dms,
            d10_houses: d10_houses,
            d6_planets: d6_planets,
            d6_ascendant_dms: d6_ascendant_dms,
            d6_houses: d6_houses,
            panchang: detailedPanchang, // Includes Masa, Samvat etc. from calculatePanchang
            doshas: {
                mangal: mangalDoshaResult,
                kaalsarpa: kaalsarpaDoshaResult,
                mool: moolDoshaResult
            },
            planetDetails: {
                states: planetStateData,
                aspects: directAspects,
                reverseAspects: reverseAspects, // Add this line
                naturalFriendship: { matrix: naturalFriendshipMatrix, order: friendshipOrder },
                temporalFriendship: temporalFriendshipData,
                resultingFriendship: resultingFriendshipData,
                shadbala: shadbalaData,
                upbsScores: upbsScores // <--- ADD THIS
            },
            ashtakavarga: ashtakavargaResult,
            yogas: allBirthChartYogas,
            kpSignificators: calculateKpSignificators(siderealPositions, rotatedSiderealCuspStartDegrees, housesData, { directAspects, reverseAspects }),
        };
        
        res.json(responsePayload);

    } catch (error) {
        // Use the centralized error handler
        handleRouteError(res, error, '/calculate', req.body);
    }
});

router.post('/calculate/rotated', rotatedChartValidation, async (req, res) => { // Added async
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Destructure validated data
        const { date, latitude, longitude, placeName, house_to_rotate } = req.body;
        const latNum = latitude; // Already parsed to float by validator
        const lonNum = longitude; // Already parsed to float by validator

       
        // --- Core Calculation Steps ---
        const { julianDayUT, utcDate, timezoneOffsetHours, momentLocal } = getJulianDateUT(date, latNum, lonNum);

        if (julianDayUT === null) {
            throw new Error('Failed to calculate Julian Day UT. Check input date/coordinates or timezone lookup.');
        }

        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
             throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
        if (tropicalCusps === null) {
             throw new Error(`Failed to calculate House Cusps for JD ${julianDayUT}, Lat ${latNum}, Lon ${lonNum}`);
        }

        const { siderealCuspStartDegrees, siderealAscendantDeg, rotatedCusps, rotatedAscendantDeg } = applyHouseRotation({ tropicalCusps, tropicalAscendant, ayanamsa, houseToRotate: house_to_rotate });
        const rotatedSiderealCuspStartDegrees = rotatedCusps;
        const ascToUse = (typeof house_to_rotate === 'number' && !isNaN(house_to_rotate) && house_to_rotate >= 1 && house_to_rotate <= 12 && house_to_rotate !== 1) ? rotatedAscendantDeg : siderealAscendantDeg;
        const ascendantNakDetails = getNakshatraDetails(ascToUse);
        const ascendantRashiDetails = getRashiDetails(ascToUse);
        const ascendantPada = calculateNakshatraPada(ascToUse);
        const ascendantPadaAlphabet = getNakshatraPadaAlphabet(ascendantNakDetails.name, ascendantPada); // Get the alphabet
        const ascendantSubLordDetails = getSubLordDetails(ascToUse);
        const ascendantPositionWithinNakshatra = ascToUse - (ascendantNakDetails.index * NAKSHATRA_SPAN);
        const ascendantSubSubLordDetails = getSubSubLordDetails(ascendantPositionWithinNakshatra, ascendantSubLordDetails);
        const ascendantDetails = {
            sidereal_dms: convertToDMS(ascToUse),
            nakshatra: ascendantNakDetails.name, nakLord: ascendantNakDetails.lord,
            rashi: ascendantRashiDetails.name, rashiLord: ascendantRashiDetails.lord,
            pada: ascendantPada,
            padaAlphabet: ascendantPadaAlphabet, // Add the alphabet here
            subLord: ascendantSubLordDetails.lord,
            subSubLord: ascendantSubSubLordDetails.lord
        };

        const badhakDetails = calculateBadhakDetails(ascToUse);
        let badhakDetailsToReturn = { ...badhakDetails };

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        const siderealPositions = planetaryPositions.sidereal;
        const sunMoonTimes = calculateSunMoonTimes(utcDate, latNum, lonNum);

        const nextDayUtcDate = moment(utcDate).add(1, 'day').toDate();
        const nextDaySunMoonTimes = calculateSunMoonTimes(nextDayUtcDate, latNum, lonNum);
        const sunriseMoment = sunMoonTimes.sunrise ? moment(sunMoonTimes.sunrise) : null;
        const nextSunriseMoment = nextDaySunMoonTimes.sunrise ? moment(nextDaySunMoonTimes.sunrise) : null;

        const detailedPanchang = await calculatePanchang(utcDate, latNum, lonNum, planetaryPositions);

        const housesData = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = rotatedSiderealCuspStartDegrees[i];
            const endDeg = rotatedSiderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            const startRashiDetails = getRashiDetails(startDeg);
            const startNakDetails = getNakshatraDetails(startDeg); // Define startNakDetails
            const startSubLordDetails = getSubLordDetails(startDeg); // Calculate sub lord for the cusp start
            housesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
                start_rashi: startRashiDetails.name,
                start_rashi_lord: startRashiDetails.lord,
                start_nakshatra: startNakDetails.name, // Ensure nakshatra details are captured for the start of the cusp
                start_nakshatra_lord: startNakDetails.lord,
                start_sub_lord: startSubLordDetails.lord, // Add the sub lord to the house data
            });
        }

        const longevityFactors = calculateLongevityFactors(housesData);
        const houseBasedLongevity = calculateHouseBasedLongevity(siderealPositions, rotatedSiderealCuspStartDegrees, badhakDetails);
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

        const mangalDoshaResult = calculateMangalDosha(siderealPositions, rotatedSiderealCuspStartDegrees, siderealAscendantDeg);
        const kaalsarpaDoshaResult = calculateKaalsarpaDosha(siderealPositions);
        const moolDoshaResult = await calculateMoolDosha(date, latNum, lonNum, siderealPositions, sunriseMoment, nextSunriseMoment);
        const { directAspects, reverseAspects } = calculateAspects(siderealPositions, rotatedSiderealCuspStartDegrees);
        const planetStateData = calculatePlanetStates(siderealPositions);

        const temporalFriendshipData = {}; const resultingFriendshipData = {};
        const naturalFriendshipMatrix = PLANETARY_RELATIONS; const friendshipOrder = FRIENDSHIP_PLANETS_ORDER;
        for (const planet of friendshipOrder) {
            temporalFriendshipData[planet] = calculateTemporalFriendshipForPlanet(planet, siderealPositions);
            resultingFriendshipData[planet] = {}; const naturalRow = naturalFriendshipMatrix[planet]; const temporalRow = temporalFriendshipData[planet];
            for (const otherPlanet of friendshipOrder) {
                if (planet === otherPlanet) { resultingFriendshipData[planet][otherPlanet] = '-'; continue; }
                let naturalStatus;
                if (naturalRow.friends.includes(otherPlanet)) {
                    naturalStatus = 'F';
                } else if (naturalRow.enemies.includes(otherPlanet)) {
                    naturalStatus = 'E';
                } else if (naturalRow.neutrals.includes(otherPlanet)) {
                    naturalStatus = 'N';
                } else {
                    naturalStatus = 'N/A'; // Fallback, should ideally not be reached if PLANETARY_RELATIONS covers all cases
                }
                const temporalStatus = temporalRow ? temporalRow[otherPlanet] : 'N/A';
                resultingFriendshipData[planet][otherPlanet] = getResultingFriendship(naturalStatus, temporalStatus);
            }
        }

        const shadbalaData = calculateShadbala(siderealPositions, housesData, directAspects, sunMoonTimes, utcDate);

        const bhinnaAshtakavargaData = {};
        ASHTAKAVARGA_PLANETS.forEach(planetName => { bhinnaAshtakavargaData[planetName] = calculateBhinnaAshtakavarga(planetName, siderealPositions, siderealAscendantDeg); });
        const sarvaAshtakavargaData = calculateSarvaAshtakavarga(bhinnaAshtakavargaData);
        const ashtakavargaResult = { bhinna: bhinnaAshtakavargaData, sarva: sarvaAshtakavargaData };

        const kpSignificators = calculateKpSignificators(siderealPositions, rotatedSiderealCuspStartDegrees, housesData, { directAspects, reverseAspects });

        const planetHousePlacements = {};
        PLANET_ORDER.forEach(planetName => {
            const planetData = siderealPositions[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                planetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, rotatedSiderealCuspStartDegrees);
            }
        });

        // --- Prepare data for UPBS calculation ---
        const unifiedChartData = {
            planetaryPositions: planetaryPositions, // Contains sidereal with avasthas
            planetHousePlacements: planetHousePlacements, // From Nirayana Bhav Chalit
            planetDetails: {
                aspects: {
                    directAspects: directAspects,
                    reverseAspects: reverseAspects
                },
                states: planetStateData // D1 dignity (calculatePlanetStates result)
            },
            shadbala: shadbalaData,
            d9_planets: d9_planets, // For Navamsa strength
            ascendant: {
                sidereal_dms: convertToDMS(ascToUse),
                siderealAscendantDeg: ascToUse // Raw degree, for getRashiDetails in FBS
            },
            houses: housesData // For house lordship in FBS (start_rashi_lord)
        };

        // --- Calculate UPBS for each planet ---
        const upbsScores = {};
        for (const planet of FRIENDSHIP_PLANETS_ORDER) {
            upbsScores[planet] = calculateUPBS(planet, unifiedChartData);
        }

         const responsePayload = {
            inputParameters: { date: date, latitude: latNum, longitude: lonNum, placeName: placeName || '', utcDate: utcDate.toISOString(), julianDayUT: julianDayUT, ayanamsa: ayanamsa, timezoneOffsetHours: timezoneOffsetHours },
            ascendant: {
                tropical_dms: convertToDMS(tropicalAscendant),
                sidereal_dms: convertToDMS(ascToUse),
                nakshatra: ascendantNakDetails.name,
                nakLord: ascendantNakDetails.lord,
                rashi: ascendantRashiDetails.name,
                rashiLord: ascendantRashiDetails.lord, // Corrected typo here
                pada: ascendantPada,
                padaAlphabet: ascendantPadaAlphabet, // Add the alphabet here
                subLord: ascendantSubLordDetails.lord,
                subSubLord: ascendantSubSubLordDetails.lord
            },
            badhakDetails: badhakDetailsToReturn,
            longevityFactors: longevityFactors,
            houseBasedLongevity: houseBasedLongevity,
            houses: housesData,
            planetaryPositions,
            planetHousePlacements: planetHousePlacements,
            sunMoonTimes: {
                sunrise: sunMoonTimes.sunrise === null ? "N/A" : sunMoonTimes.sunrise,
                sunset: sunMoonTimes.sunset === null ? "N/A" : sunMoonTimes.sunset,
                moonrise: sunMoonTimes.moonrise === null ? "N/A" : sunMoonTimes.moonrise,
                moonset: sunMoonTimes.moonset === null ? "N/A" : sunMoonTimes.moonset
            },
            dashaBalance: {
                lord: dashaBalance.lord,
                balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`,
                balance_years_decimal: dashaBalance.balanceYears
            },
            dashaPeriods: dashaPeriods,
            d9_planets: d9_planets,
            d9_ascendant_dms: d9AscendantDms,
            panchang: detailedPanchang,
            vikram_samvat: detailedPanchang?.calculatedVikramSamvat || "N/A",
            samvatsar: detailedPanchang?.calculatedSamvatsar || "N/A",
            doshas: {
                mangal: mangalDoshaResult,
                kaalsarpa: kaalsarpaDoshaResult,
                mool: moolDoshaResult
            },
            planetDetails: {
                states: planetStateData,
                aspects: directAspects,
                reverseAspects: reverseAspects, // Add this line
                naturalFriendship: { matrix: naturalFriendshipMatrix, order: friendshipOrder },
                temporalFriendship: temporalFriendshipData,
                resultingFriendship: resultingFriendshipData,
                shadbala: shadbalaData,
                upbsScores: upbsScores // <--- ADD THIS
            },
            ashtakavarga: ashtakavargaResult,
            kpSignificators: kpSignificators,
        };
      
        res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate/rotated', req.body);
    }
});

// --- Route: Save Birth Chart Data ---
router.post('/charts', protect, saveChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, gender, date, latitude, longitude, placeName } = req.body;
        const chartDataToSave = { name, gender: gender || '', date, latitude, longitude, placeName: placeName || '', user: req.user._id };
        const savedChart = await Chart.create(chartDataToSave);
      
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
router.get('/charts', protect, paginationValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const page = req.query.page || 1;
        const limit = parseInt(req.query.limit) || 999999;
        const skip = (page - 1) * limit;
        const savedCharts = await Chart.find({ user: req.user._id })
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const totalCharts = await Chart.countDocuments({ user: req.user._id });
        const chartsForFrontend = savedCharts.map(chart => ({ ...chart, id: chart._id.toString() }));
        res.json({ charts: chartsForFrontend, currentPage: page, totalPages: Math.ceil(totalCharts / limit), totalCharts });
    } catch (error) {
        handleRouteError(res, error, 'GET /charts');
    }
});

// --- Route: Delete Saved Chart ---
router.delete('/charts/:id', protect, deleteChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const chartId = req.params.id;

        const chart = await Chart.findById(chartId);

        if (!chart) {
            logger.warn(`Chart not found for deletion with ID: ${chartId}`);
            return res.status(404).json({ error: 'Chart not found.' });
        }

        // Check if user owns the chart
        if (chart.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: 'Not authorized to delete this chart.' });
        }

        const deletedChart = await Chart.findByIdAndDelete(chartId);
        if (!deletedChart) {
            logger.warn(`Chart not found for deletion with ID: ${chartId}`);
            return res.status(404).json({ error: 'Chart not found.' });
        }
       
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

        // For Prashna, generate equal house cusps based on the Prashna Ascendant
        const siderealCuspStartDegrees = [];
        for (let i = 0; i < 12; i++) {
            siderealCuspStartDegrees.push(normalizeAngle(siderealAscendantDeg + (i * 30)));
        }

        const prashnaHouseToRotate = req.body?.house_to_rotate || 1;
        const rotatedSiderealCuspStartDegrees = rotateHouses(siderealCuspStartDegrees, prashnaHouseToRotate);

        // --- Populate Ascendant Details ---
        const ascToUse = (prashnaHouseToRotate && prashnaHouseToRotate !== 1) ? rotatedSiderealCuspStartDegrees[0] : siderealAscendantDeg;
        const ascendantNakDetails = getNakshatraDetails(ascToUse);
        const ascendantRashiDetails = getRashiDetails(ascToUse);
        const ascendantPada = calculateNakshatraPada(ascToUse);
        const ascendantPadaAlphabet = getNakshatraPadaAlphabet(ascendantNakDetails.name, ascendantPada); // Get the alphabet
        const ascendantSubLordDetails = getSubLordDetails(ascToUse);
        const ascendantPositionWithinNakshatra = ascToUse - (ascendantNakDetails.index * NAKSHATRA_SPAN);
        const ascendantSubSubLordDetails = getSubSubLordDetails(ascendantPositionWithinNakshatra, ascendantSubLordDetails);
        const ascendantDetails = {
            sidereal_dms: convertToDMS(ascToUse),
            nakshatra: ascendantNakDetails.name, nakLord: ascendantNakDetails.lord,
            rashi: ascendantRashiDetails.name, rashiLord: ascendantRashiDetails.lord,
            pada: ascendantPada,
            padaAlphabet: ascendantPadaAlphabet, // Add the alphabet here
            subLord: ascendantSubLordDetails.lord,
            subSubLord: ascendantSubSubLordDetails.lord
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

        const aspects = calculateAspects(siderealPositions, rotatedSiderealCuspStartDegrees);
        const kpSignificators = calculateKpSignificators(siderealPositions, rotatedSiderealCuspStartDegrees, housesData, aspects);

        // --- Assemble Response Payload ---
        // Calculate planet house placements for Bhava Chalit chart
        const prashnaPlanetHousePlacements = {};
        PLANET_ORDER.forEach(planetName => {
            const planetData = siderealPositions[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                prashnaPlanetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, rotatedSiderealCuspStartDegrees);
            }
        });

        // --- Assemble Response Payload ---
        const responsePayload = {
            inputParameters: { number, date, latitude: latNum, longitude: lonNum, placeName: placeName || '', ayanamsa, timezoneOffsetHours },
            ascendant: ascendantDetails,
            houses: housesData,
            planetaryPositions, // Based on CURRENT time
            planetHousePlacements: prashnaPlanetHousePlacements, // Add this line
            dashaBalance: { lord: dashaBalance.lord, balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`, balance_years_decimal: dashaBalance.balanceYears },
            dashaPeriods: dashaPeriods,
            kpSignificators: kpSignificators,
            siderealCuspStartDegrees: rotatedSiderealCuspStartDegrees, // Add this line (rotated)
        };

         res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-prashna-number', req.body);
    }
});

router.post('/calculate-prashna-number/rotated', rotatedPrashnaValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { number, latitude, longitude, placeName, date, house_to_rotate } = req.body;
        const latNum = latitude; // Already parsed
        const lonNum = longitude; // Already parsed

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

        // For Prashna, generate equal house cusps based on the Prashna Ascendant
        const siderealCuspStartDegrees = [];
        for (let i = 0; i < 12; i++) {
            siderealCuspStartDegrees.push(normalizeAngle(siderealAscendantDeg + (i * 30)));
        }

        const rotatedSiderealCuspStartDegrees = rotateHouses(siderealCuspStartDegrees, house_to_rotate);

        // --- Populate Ascendant Details ---
        const ascToUse = (typeof house_to_rotate === 'number' && !isNaN(house_to_rotate) && house_to_rotate >= 1 && house_to_rotate <= 12 && house_to_rotate !== 1) ? rotatedSiderealCuspStartDegrees[0] : siderealAscendantDeg;
        const ascendantNakDetails = getNakshatraDetails(ascToUse);
        const ascendantRashiDetails = getRashiDetails(ascToUse);
        const ascendantPada = calculateNakshatraPada(ascToUse);
        const ascendantPadaAlphabet = getNakshatraPadaAlphabet(ascendantNakDetails.name, ascendantPada); // Get the alphabet
        const ascendantSubLordDetails = getSubLordDetails(ascToUse);
        const ascendantPositionWithinNakshatra = ascToUse - (ascendantNakDetails.index * NAKSHATRA_SPAN);
        const ascendantSubSubLordDetails = getSubSubLordDetails(ascendantPositionWithinNakshatra, ascendantSubLordDetails);
        const ascendantDetails = {
            sidereal_dms: convertToDMS(ascToUse),
            nakshatra: ascendantNakDetails.name, nakLord: ascendantNakDetails.lord,
            rashi: ascendantRashiDetails.name, rashiLord: ascendantRashiDetails.lord,
            pada: ascendantPada,
            padaAlphabet: ascendantPadaAlphabet, // Add the alphabet here
            subLord: ascendantSubLordDetails.lord,
            subSubLord: ascendantSubSubLordDetails.lord
        };

        // --- Populate House Data (using potentially overridden cusps) ---
        const housesData = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = rotatedSiderealCuspStartDegrees[i];
            const endDeg = rotatedSiderealCuspStartDegrees[(i + 1) % 12];
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

        const aspects = calculateAspects(siderealPositions, rotatedSiderealCuspStartDegrees);
        const kpSignificators = calculateKpSignificators(siderealPositions, rotatedSiderealCuspStartDegrees, housesData, aspects);

        // --- Assemble Response Payload ---
        // Calculate planet house placements for Bhava Chalit chart
        const prashnaPlanetHousePlacements = {};
        PLANET_ORDER.forEach(planetName => {
            const planetData = siderealPositions[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                prashnaPlanetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, siderealCuspStartDegrees);
            }
        });

        // --- Assemble Response Payload ---
        const responsePayload = {
            inputParameters: { number, date, latitude: latNum, longitude: lonNum, placeName: placeName || '', ayanamsa, timezoneOffsetHours },
            ascendant: ascendantDetails,
            houses: housesData,
            planetaryPositions, // Based on CURRENT time
            planetHousePlacements: prashnaPlanetHousePlacements, // Add this line
            dashaBalance: { lord: dashaBalance.lord, balance_str: `${dashaBalance.balanceYMD.years}Y ${dashaBalance.balanceYMD.months}M ${dashaBalance.balanceYMD.days}D`, balance_years_decimal: dashaBalance.balanceYears },
            dashaPeriods: dashaPeriods,
            kpSignificators: kpSignificators,
            siderealCuspStartDegrees: rotatedSiderealCuspStartDegrees, // Add this line
        };

         res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-prashna-number/rotated', req.body);
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

       
        // --- Step 1: Calculate Natal Details Needed ---
        const { julianDayUT: natalJD_UT, utcDate: natalUTCDate, timezoneOffsetHours: natalTzOffset } = getJulianDateUT(natalDate, latNum, lonNum); // Pass lat/lon
        if (natalJD_UT === null) { throw new Error('Failed to calculate Natal Julian Day UT.'); }

        const natalAyanamsa = calculateAyanamsa(natalJD_UT);
        if (isNaN(natalAyanamsa)) { throw new Error(`Failed to calculate Natal Ayanamsa for JD ${natalJD_UT}`); }

        const natalPlanetaryPositions = calculatePlanetaryPositions(natalJD_UT);
        const natalSunLongitude = natalPlanetaryPositions?.sidereal?.Sun?.longitude;
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

        // Calculate aspects for the Varshphal chart
        const srAspects = calculateAspects(srPlanetaryPositions.sidereal, srSiderealCuspStartDegrees);

        // Populate SR Ascendant details
        const srAscNakDetails = getNakshatraDetails(srSiderealAscDeg);
        const srAscRashiDetails = getRashiDetails(srSiderealAscDeg);
        const srAscPada = calculateNakshatraPada(srSiderealAscDeg);
        const srAscendantData = {
            sidereal_dms: convertToDMS(srSiderealAscDeg),
            nakshatra: srAscNakDetails.name, nakLord: srAscNakDetails.lord,
            rashi: srAscRashiDetails.name, rashiLord: srAscRashiDetails.lord,
            pada: srAscPada,
            signIndex: srAscRashiDetails.index
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
            const startNakDetails = getNakshatraDetails(startDeg);
            const startSubLordDetails = getSubLordDetails(startDeg);

            const startRashiDetails = getRashiDetails(startDeg); // Get Rashi details for startDeg

            srHousesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
                start_rashi: startRashiDetails.name, // Add start_rashi
                start_rashi_lord: startRashiDetails.lord, // Add start_rashi_lord
                start_nakshatra: startNakDetails.name, start_nakshatra_lord: startNakDetails.lord,
                start_sub_lord: startSubLordDetails.lord,
            });
        }

        // --- Step 4: Calculate Muntha ---
        const birthYear = natalUTCDate.getUTCFullYear();
        const ageAtVarshphalStart = varshphalYear - birthYear;
        const munthaResult = calculateMuntha(natalAscendantSignIndex, ageAtVarshphalStart);
        const munthaSignName = RASHIS[munthaResult.signIndex] || 'N/A';
        const munthaDegree = munthaResult.signIndex * 30; // Approximating to the start of the sign
        const munthaHouse = getHouseOfPlanet(munthaDegree, srSiderealCuspStartDegrees);
        const munthaData = { sign: munthaSignName, signIndex: munthaResult.signIndex, house: munthaHouse };

        // --- Step 5: Calculate Year Lord ---
        const solarReturnWeekDay = solarReturnUTCDate.getUTCDay();

        // Calculate D-charts for Varshphal chart
        const { divisional_planets: d9_planets, divisionalHouses: d9_houses, divisional_ascendant_dms: d9_ascendant_dms } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateNavamsaLongitude);
        const { divisional_planets: d2_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateHoraLongitude);
        const { divisional_planets: d3_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateDrekkanaLongitude);
        const { divisional_planets: d7_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateSaptamsaLongitude);
        const { divisional_planets: d12_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateDwadasamsaLongitude);
        const { divisional_planets: d30_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateTrimsamsaLongitude);
        const { divisional_planets: d60_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateShashtiamsaLongitude);
        
        // Assemble divisional positions for Varshphal Shadbala
        const srDivisionalPositions = {
            D1: srPlanetaryPositions.sidereal,
            D2: d2_planets,
            D3: d3_planets,
            D7: d7_planets,
            D9: d9_planets,
            D12: d12_planets,
            D30: d30_planets,
            D60: d60_planets
        };

        // Calculate Shadbala for Varshphal chart
        const srShadbala = calculateShadbala(srPlanetaryPositions.sidereal, srHousesData, srAspects.directAspects, { sunrise: solarReturnUTCDate, sunset: solarReturnUTCDate }, solarReturnUTCDate, srDivisionalPositions);

        // Calculate planet house placements for Bhava Chalit chart
        const srPlanetHousePlacements = {};
        PLANET_ORDER.forEach(planetName => {
            const planetData = srPlanetaryPositions.sidereal[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                srPlanetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, srSiderealCuspStartDegrees);
            }
        });

        const srPlanetStateData = calculatePlanetStates(srPlanetaryPositions.sidereal);

        // --- Prepare data for UPBS calculation ---
        const unifiedChartData = {
            planetaryPositions: srPlanetaryPositions, // Contains sidereal with avasthas
            planetHousePlacements: srPlanetHousePlacements, // From Nirayana Bhav Chalit
            planetDetails: {
                aspects: {
                    directAspects: srAspects.directAspects,
                    reverseAspects: srAspects.reverseAspects
                },
                states: srPlanetStateData // D1 dignity (calculatePlanetStates result)
            },
            shadbala: srShadbala,
            d9_planets: d9_planets,
            ascendant: {
                sidereal_dms: convertToDMS(srSiderealAscDeg),
                siderealAscendantDeg: srSiderealAscDeg // Raw degree, for getRashiDetails in FBS
            },
            houses: srHousesData // For house lordship in FBS (start_rashi_lord)
        };

        // --- Calculate UPBS for each planet ---
        const upbsScores = {};
        for (const planet of FRIENDSHIP_PLANETS_ORDER) {
            upbsScores[planet] = calculateUPBS(planet, unifiedChartData);
        }

        const varshphalChart = {
            ascendant: srAscendantData,
            houses: srHousesData,
            planetaryPositions: srPlanetaryPositions,
            planetHousePlacements: srPlanetHousePlacements,
            planetDetails: {
                states: srPlanetStateData,
                aspects: srAspects,
                upbsScores: upbsScores
            },
            d9_planets: d9_planets,
            shadbala: srShadbala,
            muntha: munthaData
        };

        const yearLord = calculateYearLord(varshphalChart, natalAscendantLord, solarReturnWeekDay);

        // --- Step 6: Calculate Mudda Dasha ---
        const muddaDashaPeriods = calculateMuddaDasha(solarReturnJD_UT, latNum, lonNum); // Pass lat/lon

        // Calculate KP Significators for Varshphal Chart
        const kpSignificators = calculateKpSignificators(srPlanetaryPositions.sidereal, srSiderealCuspStartDegrees, srHousesData, srAspects);

        // --- Assemble Response Payload ---
        const responsePayload = {
            inputDetails: { natalDate, natalLatitude: latNum, natalLongitude: lonNum, natalPlaceName: natalPlaceName || '', varshphalYear, solarReturnUTC: solarReturnUTCDate.toISOString(), solarReturnJD_UT, natalTzOffset },
            varshphalChart: varshphalChart,
            muntha: munthaData,
            yearLord: yearLord,
            muddaDasha: muddaDashaPeriods,
            kpSignificators: kpSignificators,
        };

        res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-varshphal', req.body);
    }
});

router.post('/calculate-varshphal/rotated', rotatedVarshphalValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { natalDate, natalLatitude, natalLongitude, varshphalYear, natalPlaceName, house_to_rotate } = req.body;
        const latNum = natalLatitude;
        const lonNum = natalLongitude;

       
        // --- Step 1: Calculate Natal Details Needed ---
        const { julianDayUT: natalJD_UT, utcDate: natalUTCDate, timezoneOffsetHours: natalTzOffset } = getJulianDateUT(natalDate, latNum, lonNum);
        if (natalJD_UT === null) { throw new Error('Failed to calculate Natal Julian Day UT.'); }

        const natalAyanamsa = calculateAyanamsa(natalJD_UT);
        if (isNaN(natalAyanamsa)) { throw new Error(`Failed to calculate Natal Ayanamsa for JD ${natalJD_UT}`); }

        const natalPlanetaryPositions = calculatePlanetaryPositions(natalJD_UT);
        const natalSunLongitude = natalPlanetaryPositions?.sidereal?.Sun?.longitude;
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
        const rotatedSrSiderealCuspStartDegrees = rotateHouses(srSiderealCuspStartDegrees, house_to_rotate);

        const srAscendantDetails = getRashiDetails(srSiderealAscDeg);
        const srAscendantLord = srAscendantDetails.lord;
        const srPlanetaryPositions = calculatePlanetaryPositions(solarReturnJD_UT);

        const srAspects = calculateAspects(srPlanetaryPositions.sidereal, rotatedSrSiderealCuspStartDegrees);

        const srAscNakDetails = getNakshatraDetails(srSiderealAscDeg);
        const srAscRashiDetails = getRashiDetails(srSiderealAscDeg);
        const srAscPada = calculateNakshatraPada(srSiderealAscDeg);
        const srAscendantData = {
            sidereal_dms: convertToDMS(srSiderealAscDeg),
            nakshatra: srAscNakDetails.name, nakLord: srAscNakDetails.lord,
            rashi: srAscRashiDetails.name, rashiLord: srAscRashiDetails.lord,
            pada: srAscPada
        };

        const srHousesData = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = rotatedSrSiderealCuspStartDegrees[i];
            const endDeg = rotatedSrSiderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            const startNakDetails = getNakshatraDetails(startDeg);
            const startSubLordDetails = getSubLordDetails(startDeg);

            const startRashiDetails = getRashiDetails(startDeg); // Get Rashi details for startDeg

            srHousesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
                start_rashi: startRashiDetails.name, // Add start_rashi
                start_rashi_lord: startRashiDetails.lord, // Add start_rashi_lord
                start_nakshatra: startNakDetails.name, start_nakshatra_lord: startNakDetails.lord,
                start_sub_lord: startSubLordDetails.lord,
            });
        }

        const birthYear = natalUTCDate.getUTCFullYear();
        const ageAtVarshphalStart = varshphalYear - birthYear;
        const munthaResult = calculateMuntha(natalAscendantSignIndex, ageAtVarshphalStart);
        const munthaSignName = RASHIS[munthaResult.signIndex] || 'N/A';
        let munthaHouse = null;
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

        const solarReturnWeekDay = solarReturnUTCDate.getUTCDay();

        const muddaDashaPeriods = calculateMuddaDasha(solarReturnJD_UT, latNum, lonNum);

        const kpSignificators = calculateKpSignificators(srPlanetaryPositions.sidereal, rotatedSrSiderealCuspStartDegrees, srHousesData, srAspects);

        const srPlanetHousePlacements = {};
        PLANET_ORDER.forEach(planetName => {
            const planetData = srPlanetaryPositions.sidereal[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                srPlanetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, rotatedSrSiderealCuspStartDegrees);
            }
        });

        const srPlanetStateData = calculatePlanetStates(srPlanetaryPositions.sidereal);
        // Calculate D-charts for Varshphal chart
        const { divisional_planets: d9_planets, divisionalHouses: d9_houses, divisional_ascendant_dms: d9_ascendant_dms } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateNavamsaLongitude);
        const { divisional_planets: d2_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateHoraLongitude);
        const { divisional_planets: d3_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateDrekkanaLongitude);
        const { divisional_planets: d7_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateSaptamsaLongitude);
        const { divisional_planets: d12_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateDwadasamsaLongitude);
        const { divisional_planets: d30_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateTrimsamsaLongitude);
        const { divisional_planets: d60_planets } = calculateDivisionalChartData(srPlanetaryPositions.sidereal, srSiderealAscDeg, calculateShashtiamsaLongitude);

        // Assemble divisional positions for Varshphal Shadbala
        const srDivisionalPositions = {
            D1: srPlanetaryPositions.sidereal,
            D2: d2_planets,
            D3: d3_planets,
            D7: d7_planets,
            D9: d9_planets,
            D12: d12_planets,
            D30: d30_planets,
            D60: d60_planets
        };

        // Calculate Shadbala for Varshphal chart
        const srShadbala = calculateShadbala(srPlanetaryPositions.sidereal, srHousesData, srAspects.directAspects, { sunrise: solarReturnUTCDate, sunset: solarReturnUTCDate }, solarReturnUTCDate, srDivisionalPositions);

        // --- Prepare data for UPBS calculation ---
        const unifiedChartData = {
            planetaryPositions: srPlanetaryPositions, // Contains sidereal with avasthas
            planetHousePlacements: srPlanetHousePlacements, // From Nirayana Bhav Chalit
            planetDetails: {
                aspects: {
                    directAspects: srAspects.directAspects,
                    reverseAspects: srAspects.reverseAspects
                },
                states: srPlanetStateData // D1 dignity (calculatePlanetStates result)
            },
            shadbala: srShadbala,
            d9_planets: d9_planets,
            ascendant: {
                sidereal_dms: convertToDMS(srSiderealAscDeg),
                siderealAscendantDeg: srSiderealAscDeg // Raw degree, for getRashiDetails in FBS
            },
            houses: srHousesData // For house lordship in FBS (start_rashi_lord)
        };

        // --- Calculate UPBS for each planet ---
        const upbsScores = {};
        for (const planet of FRIENDSHIP_PLANETS_ORDER) {
            upbsScores[planet] = calculateUPBS(planet, unifiedChartData);
        }

        // Build a Varshphal chart object for Year Lord calculation (match non-rotated flow)
        const varshphalChart = {
            ascendant: srAscendantData,
            houses: srHousesData,
            planetaryPositions: srPlanetaryPositions,
            planetHousePlacements: srPlanetHousePlacements,
            planetDetails: {
                states: srPlanetStateData,
                aspects: srAspects,
                upbsScores: upbsScores
            },
            d9_planets: d9_planets,
            shadbala: srShadbala,
            muntha: munthaData
        };

        const yearLord = calculateYearLord(varshphalChart, natalAscendantLord, solarReturnWeekDay);

        const responsePayload = {
            inputDetails: { natalDate, natalLatitude: latNum, natalLongitude: lonNum, natalPlaceName: natalPlaceName || '', varshphalYear, solarReturnUTC: solarReturnUTCDate.toISOString(), solarReturnJD_UT, natalTzOffset },
            varshphalChart: { 
                ascendant: srAscendantData, 
                houses: srHousesData, 
                planetaryPositions: srPlanetaryPositions, 
                planetHousePlacements: srPlanetHousePlacements,
                planetDetails: {
                    states: srPlanetStateData,
                    aspects: srAspects,
                    upbsScores: upbsScores
                }
            },
            muntha: munthaData,
            yearLord: yearLord,
            muddaDasha: muddaDashaPeriods,
            kpSignificators: kpSignificators,
        };

        res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-varshphal/rotated', req.body);
    }
});


router.post('/calculate-muhurta', baseChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { date, latitude, longitude } = req.body;
        const latNum = latitude;
        const lonNum = longitude;

        const cacheKey = `${date}:${latNum}:${lonNum}`;
        if (muhurtaCache.has(cacheKey)) {
            return res.json(muhurtaCache.get(cacheKey));
        }

        const muhurtaResult = await calculateMuhurta(date, latNum, lonNum);

        const responsePayload = {
            inputParameters: muhurtaResult.inputParameters,
            choghadiya: muhurtaResult.choghadiya,
            horas: muhurtaResult.horas,
            lagnas: muhurtaResult.lagnas,
            muhurta: muhurtaResult.muhurta,
            activeChoghadiya: muhurtaResult.activeChoghadiya,
            activeHora: muhurtaResult.activeHora,
            activeLagna: muhurtaResult.activeLagna,
            dishaShool: muhurtaResult.dishaShool,
            moonRashi: muhurtaResult.moonRashi,
            sanmukhChandra: muhurtaResult.sanmukhChandra,
            panchang: muhurtaResult.panchang,
            activeYogas: muhurtaResult.activeYogas,
        };

        muhurtaCache.set(cacheKey, responsePayload);

       res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/calculate-muhurta', req.body);
    }
});

// --- Route: Calculate KP Significators ---
router.post('/kp-significators', baseChartValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { date, latitude, longitude } = req.body;
        const latNum = latitude;
        const lonNum = longitude;

       
        const { julianDayUT, utcDate } = getJulianDateUT(date, latNum, lonNum);
        if (julianDayUT === null) {
            throw new Error('Failed to calculate Julian Day UT for KP Significators.');
        }

        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
            throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
        if (tropicalCusps === null) {
            throw new Error(`Failed to calculate House Cusps for JD ${julianDayUT}, Lat ${latNum}, Lon ${lonNum}`);
        }

        const { siderealCuspStartDegrees, siderealAscendantDeg, rotatedCusps } = applyHouseRotation({ tropicalCusps, tropicalAscendant, ayanamsa, houseToRotate: req.body?.house_to_rotate });
        const rotatedSiderealCuspStartDegrees = rotatedCusps;
        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        const siderealPositions = planetaryPositions.sidereal;
        const aspects = calculateAspects(siderealPositions, rotatedSiderealCuspStartDegrees);
        
        // Generate housesData for this route's context
        const housesData = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = rotatedSiderealCuspStartDegrees[i];
            const endDeg = rotatedSiderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            const startRashiDetails = getRashiDetails(startDeg);
            const startNakDetails = getNakshatraDetails(startDeg);
            const startSubLordDetails = getSubLordDetails(startDeg);
            housesData.push({
                house_number: houseNumber, start_dms: convertToDMS(startDeg), mean_dms: convertToDMS(meanDeg), end_dms: convertToDMS(endDeg),
                start_deg: startDeg,
                mean_nakshatra: meanNakDetails.name, mean_nakshatra_charan: meanCharan, mean_nakshatra_lord: meanNakDetails.lord,
                mean_rashi: meanRashiDetails.name, mean_rashi_lord: meanRashiDetails.lord,
                start_rashi: startRashiDetails.name,
                start_rashi_lord: startRashiDetails.lord,
                start_nakshatra: startNakDetails.name, 
                start_nakshatra_lord: startNakDetails.lord,
                start_sub_lord: startSubLordDetails.lord,
            });
        }

        const kpSignificatorsData = calculateKpSignificators(siderealPositions, rotatedSiderealCuspStartDegrees, housesData, aspects);

        const responsePayload = {
            inputParameters: { date, latitude: latNum, longitude: lonNum },
            kpSignificatorsData: kpSignificatorsData,
        };

        res.json(responsePayload);

    } catch (error) {
        handleRouteError(res, error, '/kp-significators', req.body);
    }
});

router.post('/calculate-monthly-yogas', [
    body('year').isInt({ min: 1900, max: 2100 }).toInt(),
    body('month').isInt({ min: 1, max: 12 }).toInt(),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat(),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { year, month, latitude, longitude } = req.body;
        const yogas = await calculateYogasForMonth(year, month, latitude, longitude);
        res.json(yogas);
    } catch (error) {
        handleRouteError(res, error, '/calculate-monthly-yogas', req.body);
    }
});


// Export the router
export default router; // Using ES module export
