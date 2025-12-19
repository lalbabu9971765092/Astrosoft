
import express from 'express';
import { body, validationResult } from 'express-validator';
import moment from 'moment-timezone';
import logger from '../utils/logger.js';
import {
    PLANET_ORDER, normalizeAngle, getNakshatraDetails, getRashiDetails, RASHIS, RASHI_SPAN, NAKSHATRA_SPAN,
    calculateNakshatraPada, getJulianDateUT, calculateAyanamsa, convertToDMS,
    convertDMSToDegrees, getNakshatraPadaAlphabet, getSubLordDetails, getSubSubLordDetails,
    calculateMidpoint, calculateSunMoonTimes, calculateBadhakDetails, calculateLongevityFactors, calculateHouseBasedLongevity,
    calculatePlanetaryPositions, calculateVimshottariBalance, calculateVimshottariDashas,
    calculateNavamsaLongitude, calculateHoraLongitude, calculateDrekkanaLongitude, calculateSaptamsaLongitude, calculateDwadasamsaLongitude, calculateTrimsamsaLongitude, calculateShashtiamsaLongitude, calculateMangalDosha, calculateKaalsarpaDosha,
    calculateMoolDosha, calculatePlanetStates, calculateAspects,
    PLANETARY_RELATIONS, FRIENDSHIP_PLANETS_ORDER, calculateTemporalFriendshipForPlanet,
    getResultingFriendship, calculateShadbala, calculateBhinnaAshtakavarga,
    calculateSarvaAshtakavarga, ASHTAKAVARGA_PLANETS, getHouseOfPlanet,
    calculateUPBS, calculateAllBirthChartYogas
} from '../utils/index.js';
import { calculatePanchang } from '../utils/panchangUtils.js';
import { calculateHousesAndAscendant } from '../utils/coreUtils.js';
import predictionEngine from '../utils/predictionEngine.js'; // Ensure predictionEngine is imported

const router = express.Router();

function handleRouteError(res, error, routeName, inputData = {}) {
    logger.error(`Error in ${routeName} route: ${error.message}`, {
        routeName,
        error: error.stack || error
    });
    const statusCode = error.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = (isProduction && statusCode === 500)
        ? "An internal server error occurred. Please try again later."
        : error.message || "An internal server error occurred.";
    const errorResponse = { error: errorMessage };
    if (!isProduction && error.stack) {
        errorResponse.stack = error.stack.split('\n');
    }
    res.status(statusCode).json(errorResponse);
}

// Validation for holistic prediction endpoint
const holisticPredictionValidation = [
    body('birthDate').isISO8601().withMessage('Invalid birthDate format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('transitDate').optional().isISO8601().withMessage('Invalid transitDate format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.'),
    body('lang').optional().isIn(['en', 'hi']).withMessage('Language must be "en" or "hi".')
];

// Helper function for divisional chart calculations (copied from astrologyRoutes)
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
                const divisionalPositionWithinNakshatra = divisionalLongitude - (getNakshatraDetails(divisionalLongitude).index * NAKSHATRA_SPAN);
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
                const rashiStartDeg = currentRashiIndex * 30;

                const rashiEndDeg = normalizeAngle(rashiStartDeg + 30);
                const rashiMeanDeg = normalizeAngle(rashiStartDeg + 30 / 2);

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


// --- NEW HOLISTIC PREDICTION ENDPOINT ---
router.post('/', holisticPredictionValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { birthDate, transitDate, latitude, longitude, placeName, lang } = req.body;
        const latNum = latitude;
        const lonNum = longitude;

        // Use transitDate for all calculations if provided, otherwise use birthDate
        const dateForCalculations = transitDate || birthDate;

        // --- Core Calculation Steps for Natal Chart ---
        // These calculations should always be based on the NATAL birthDate
        const { julianDayUT, utcDate: natalUtcDate, timezoneOffsetHours } = getJulianDateUT(birthDate, latNum, lonNum);

        if (julianDayUT === null) {
            throw new Error('Failed to calculate Julian Day UT for birth date. Check input date/coordinates or timezone lookup.');
        }

        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
            throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalAscendant, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
        if (tropicalCusps === null) {
            throw new Error(`Failed to calculate House Cusps for JD ${julianDayUT}, Lat ${latNum}, Lon ${lonNum}`);
        }

        const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
        const siderealCuspStartDegrees = tropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        const ascendantNakDetails = getNakshatraDetails(siderealAscendantDeg);
        const ascendantRashiDetails = getRashiDetails(siderealAscendantDeg);
        const ascendantPada = calculateNakshatraPada(siderealAscendantDeg);
        const ascendantPadaAlphabet = getNakshatraPadaAlphabet(ascendantNakDetails.name, ascendantPada);
        const ascendantSubLordDetails = getSubLordDetails(siderealAscendantDeg);
        const ascendantPositionWithinNakshatra = siderealAscendantDeg - (getNakshatraDetails(siderealAscendantDeg).index * NAKSHATRA_SPAN);
        const ascendantSubSubLordDetails = getSubSubLordDetails(ascendantPositionWithinNakshatra, ascendantSubLordDetails);

        const badhakDetails = calculateBadhakDetails(siderealAscendantDeg);

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        const siderealPositions = planetaryPositions.sidereal;
        const sunMoonTimes = calculateSunMoonTimes(natalUtcDate, latNum, lonNum); // Use natalUtcDate

        const detailedPanchang = await calculatePanchang(natalUtcDate, latNum, lonNum, planetaryPositions); // Use natalUtcDate

        const houses = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = siderealCuspStartDegrees[i];
            const endDeg = siderealCuspStartDegrees[(i + 1) % 12];
            const meanDeg = calculateMidpoint(startDeg, endDeg);
            const meanNakDetails = getNakshatraDetails(meanDeg);
            const meanRashiDetails = getRashiDetails(meanDeg);
            const meanCharan = calculateNakshatraPada(meanDeg);
            const startRashiDetails = getRashiDetails(startDeg);
            const startNakDetails = getNakshatraDetails(startDeg);
            const startSubLordDetails = getSubLordDetails(startDeg);
            houses.push({
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

        const dashaBalance = calculateVimshottariBalance(siderealPositions['Moon']?.longitude);
        const dashaPeriods = calculateVimshottariDashas(natalUtcDate, dashaBalance); // Use natalUtcDate

        const { directAspects, reverseAspects } = calculateAspects(siderealPositions, siderealCuspStartDegrees);
        const planetStateData = calculatePlanetStates(siderealPositions);

        // --- Start of Divisional Chart Calculations ---
        const { divisional_planets: d9_planets } = calculateDivisionalChartData(siderealPositions, siderealAscendantDeg, calculateNavamsaLongitude);
        const { divisional_planets: d2_planets } = calculateDivisionalChartData(siderealPositions, siderealAscendantDeg, calculateHoraLongitude);
        const { divisional_planets: d3_planets } = calculateDivisionalChartData(siderealPositions, siderealAscendantDeg, calculateDrekkanaLongitude);
        const { divisional_planets: d7_planets } = calculateDivisionalChartData(siderealPositions, siderealAscendantDeg, calculateSaptamsaLongitude);
        const { divisional_planets: d12_planets } = calculateDivisionalChartData(siderealPositions, siderealAscendantDeg, calculateDwadasamsaLongitude);
        const { divisional_planets: d30_planets } = calculateDivisionalChartData(siderealPositions, siderealAscendantDeg, calculateTrimsamsaLongitude);

        const divisionalPositions = {
            D1: siderealPositions,
            D2: d2_planets,
            D3: d3_planets,
            D7: d7_planets,
            D9: d9_planets,
            D12: d12_planets,
            D30: d30_planets
        };
        // --- End of Divisional Chart Calculations ---

        const shadbalaData = calculateShadbala(siderealPositions, houses, directAspects, sunMoonTimes, natalUtcDate, divisionalPositions);

        const bhinnaAshtakavargaData = {};
        ASHTAKAVARGA_PLANETS.forEach(planetName => { bhinnaAshtakavargaData[planetName] = calculateBhinnaAshtakavarga(planetName, siderealPositions, siderealAscendantDeg); });
        const sarvaAshtakavargaData = calculateSarvaAshtakavarga(bhinnaAshtakavargaData);
        const ashtakavargaResult = { bhinna: bhinnaAshtakavargaData, sarva: sarvaAshtakavargaData };
        
        const allBirthChartYogas = calculateAllBirthChartYogas(siderealPositions, houses, lang);

        // --- Assemble chartData for predictionEngine (using transitDate for relevant parts) ---
        const chartDataForPrediction = {
            // inputParameters should reflect the actual calculation context for the prediction
            // Use birthDate for chart details, and transitDate (or birthDate if not provided) for dynamic predictions
            inputParameters: { 
                date: birthDate, 
                latitude: latNum, 
                longitude: lonNum, 
                placeName: placeName || '', 
                utcDate: (getJulianDateUT(dateForCalculations, latNum, lonNum).utcDate || natalUtcDate).toISOString(), // Use dateForCalculations here
                julianDayUT: julianDayUT, 
                ayanamsa: ayanamsa, 
                timezoneOffsetHours: timezoneOffsetHours 
            },
            ascendant: {
                tropical_dms: convertToDMS(tropicalAscendant),
                sidereal_dms: convertToDMS(siderealAscendantDeg),
                nakshatra: ascendantNakDetails.name,
                nakLord: ascendantNakDetails.lord,
                rashi: ascendantRashiDetails.name,
                rashiLord: ascendantRashiDetails.lord,
                pada: ascendantPada,
                padaAlphabet: ascendantPadaAlphabet,
                subLord: ascendantSubLordDetails.lord,
                subSubLord: ascendantSubSubLordDetails.lord
            },
            houses: houses,
            planetaryPositions,
            divisionalPositions: divisionalPositions,
            dashaPeriods: dashaPeriods,
            planetDetails: {
                shadbala: shadbalaData,
            },
            yogas: allBirthChartYogas,
            ashtakavarga: ashtakavargaResult,
        };

        const holisticPrediction = await predictionEngine.generateHolisticPrediction(chartDataForPrediction);

        res.json(holisticPrediction);

    } catch (error) {
        handleRouteError(res, error, '/predictions/holistic', req.body);
    }
});

export default router;
