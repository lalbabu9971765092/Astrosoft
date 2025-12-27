
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
    calculateUPBS, calculateAllBirthChartYogas, calculateKpSignificators
} from '../utils/index.js';
import { calculatePanchang } from '../utils/panchangUtils.js';
import { calculateHousesAndAscendant, calculateWholeSignHouses } from '../utils/coreUtils.js';
import predictionEngine from '../utils/predictionEngine.js'; // Ensure predictionEngine is imported
import { rotateHouses, applyHouseRotation } from '../utils/rotationUtils.js';

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
    body('lang').optional().isIn(['en', 'hi']).withMessage('Language must be "en" or "hi".'),
    body('houseSystem').optional().isIn(['placidus', 'whole_sign']).withMessage('House system must be "placidus" or "whole_sign".')
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
        const { birthDate, transitDate, latitude, longitude, placeName, lang, houseSystem = 'placidus' } = req.body;
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

        // --- Conditional House System Calculation ---
        let tropicalAscendant, siderealCuspStartDegrees;
        let rotatedSiderealCuspStartDegrees;
        let rotatedSiderealAscendantDeg;

        if (houseSystem === 'whole_sign') {
            // For Whole Sign, we only need the Ascendant degree to determine the signs.
            // We still call calculateHousesAndAscendant to get the accurate tropical ascendant degree.
            const { tropicalAscendant: asc } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
            if (asc === null) throw new Error(`Failed to calculate Ascendant for JD ${julianDayUT}`);
            tropicalAscendant = asc;
            const siderealAscendant = normalizeAngle(tropicalAscendant - ayanamsa);
            siderealCuspStartDegrees = calculateWholeSignHouses(siderealAscendant);
            rotatedSiderealCuspStartDegrees = siderealCuspStartDegrees;
            rotatedSiderealAscendantDeg = siderealAscendant;
        } else { // Default to Placidus
            const { tropicalAscendant: asc, tropicalCusps } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);
            if (tropicalCusps === null) {
                throw new Error(`Failed to calculate Placidus House Cusps for JD ${julianDayUT}, Lat ${latNum}, Lon ${lonNum}`);
            }
            tropicalAscendant = asc;
                const rotationResult = applyHouseRotation({ tropicalCusps, tropicalAscendant: asc, ayanamsa, houseToRotate: req.body?.house_to_rotate });
                siderealCuspStartDegrees = rotationResult.siderealCuspStartDegrees;
                rotatedSiderealCuspStartDegrees = rotationResult.rotatedCusps;
                rotatedSiderealAscendantDeg = rotationResult.rotatedAscendantDeg;
        }

        const siderealAscendantDeg = normalizeAngle(tropicalAscendant - ayanamsa);
        const useRotated = typeof req.body?.house_to_rotate === 'number' && !isNaN(req.body.house_to_rotate) && req.body.house_to_rotate > 1;
        const effectiveCuspStartDegrees = useRotated ? rotatedSiderealCuspStartDegrees : siderealCuspStartDegrees;
        const ascForDivisional = useRotated ? rotatedSiderealAscendantDeg : siderealAscendantDeg;
        const ascendantDegUsed = ascForDivisional;
        const ascendantNakDetails = getNakshatraDetails(ascendantDegUsed);
        const ascendantRashiDetails = getRashiDetails(ascendantDegUsed);
        const ascendantPada = calculateNakshatraPada(ascendantDegUsed);
        const ascendantPadaAlphabet = getNakshatraPadaAlphabet(ascendantNakDetails.name, ascendantPada);
        const ascendantSubLordDetails = getSubLordDetails(ascendantDegUsed);
        const ascendantPositionWithinNakshatra = ascendantDegUsed - (getNakshatraDetails(ascendantDegUsed).index * NAKSHATRA_SPAN);
        const ascendantSubSubLordDetails = getSubSubLordDetails(ascendantPositionWithinNakshatra, ascendantSubLordDetails);

        const badhakDetails = calculateBadhakDetails(ascendantDegUsed);
        // Provide rotated house index for badhak when a rotation is requested
        let badhakDetailsToReturn = { ...badhakDetails };
        try {
            const htr = req.body?.house_to_rotate;
            if (!badhakDetailsToReturn.error && typeof htr === 'number' && !isNaN(htr)) {
                const orig = badhakDetailsToReturn.badhakHouse;
                badhakDetailsToReturn.rotatedHouse = ((orig - htr + 12) % 12) + 1;
            }
        } catch (e) { /* ignore */ }

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        const siderealPositions = planetaryPositions.sidereal;
        const sunMoonTimes = calculateSunMoonTimes(natalUtcDate, latNum, lonNum); // Use natalUtcDate

        const detailedPanchang = await calculatePanchang(natalUtcDate, latNum, lonNum, planetaryPositions); // Use natalUtcDate

        const houses = [];
        for (let i = 0; i < 12; i++) {
            const houseNumber = i + 1;
            const startDeg = effectiveCuspStartDegrees[i];
            const endDeg = effectiveCuspStartDegrees[(i + 1) % 12];
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

        const { directAspects, reverseAspects } = calculateAspects(siderealPositions, effectiveCuspStartDegrees);
        const planetStateData = calculatePlanetStates(siderealPositions);

        const temporalFriendshipData = {};
        const resultingFriendshipData = {};
        const naturalFriendshipMatrix = PLANETARY_RELATIONS;
        const friendshipOrder = FRIENDSHIP_PLANETS_ORDER;
        for (const planet of friendshipOrder) {
            temporalFriendshipData[planet] = calculateTemporalFriendshipForPlanet(planet, siderealPositions);
            resultingFriendshipData[planet] = {};
            const naturalRow = naturalFriendshipMatrix[planet];
            const temporalRow = temporalFriendshipData[planet];
            for (const otherPlanet of friendshipOrder) {
                if (planet === otherPlanet) {
                    resultingFriendshipData[planet][otherPlanet] = '-';
                    continue;
                }
                let naturalStatus;
                if (naturalRow.friends.includes(otherPlanet)) {
                    naturalStatus = 'F';
                } else if (naturalRow.enemies.includes(otherPlanet)) {
                    naturalStatus = 'E';
                } else if (naturalRow.neutrals.includes(otherPlanet)) {
                    naturalStatus = 'N';
                } else {
                    naturalStatus = 'N/A';
                }
                const temporalStatus = temporalRow ? temporalRow[otherPlanet] : 'N/A';
                resultingFriendshipData[planet][otherPlanet] = getResultingFriendship(naturalStatus, temporalStatus);
            }
        }

        const kpSignificators = calculateKpSignificators(siderealPositions, effectiveCuspStartDegrees, houses, { directAspects, reverseAspects });
        // --- Start of Divisional Chart Calculations ---
        const { divisional_planets: d9_planets } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateNavamsaLongitude);
        const { divisional_planets: d2_planets } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateHoraLongitude);
        const { divisional_planets: d3_planets } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateDrekkanaLongitude);
        const { divisional_planets: d7_planets } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateSaptamsaLongitude);
        const { divisional_planets: d12_planets } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateDwadasamsaLongitude);
        const { divisional_planets: d30_planets } = calculateDivisionalChartData(siderealPositions, ascForDivisional, calculateTrimsamsaLongitude);

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
        ASHTAKAVARGA_PLANETS.forEach(planetName => { bhinnaAshtakavargaData[planetName] = calculateBhinnaAshtakavarga(planetName, siderealPositions, ascendantDegUsed); });
        const sarvaAshtakavargaData = calculateSarvaAshtakavarga(bhinnaAshtakavargaData);
        const ashtakavargaResult = { bhinna: bhinnaAshtakavargaData, sarva: sarvaAshtakavargaData };
        
        const allBirthChartYogas = calculateAllBirthChartYogas(siderealPositions, houses, lang);

        // --- Prepare and Calculate UPBS ---
        const unifiedChartDataForUPBS = {
            planetaryPositions: planetaryPositions,
            planetHousePlacements: Object.fromEntries(PLANET_ORDER.map(p => [p, getHouseOfPlanet(siderealPositions[p]?.longitude, effectiveCuspStartDegrees)])),
            planetDetails: {
                aspects: { directAspects, reverseAspects },
                states: planetStateData
            },
            shadbala: shadbalaData,
            d9_planets: d9_planets,
            ascendant: {
                sidereal_dms: convertToDMS(ascendantDegUsed),
                siderealAscendantDeg: ascendantDegUsed
            },
            houses: houses
        };

        const upbsScores = {};
        for (const planet of FRIENDSHIP_PLANETS_ORDER) {
            upbsScores[planet] = calculateUPBS(planet, unifiedChartDataForUPBS);
        }
        // --- End UPBS Calculation ---

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
                sidereal_dms: convertToDMS(ascendantDegUsed),
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
                states: planetStateData, // from calculatePlanetStates
                aspects: directAspects,
                reverseAspects: reverseAspects,
                naturalFriendship: { matrix: naturalFriendshipMatrix, order: friendshipOrder }, // Add this
                temporalFriendship: temporalFriendshipData, // Add this
                resultingFriendship: resultingFriendshipData, // Add this
                shadbala: shadbalaData,
                upbsScores: upbsScores,
                kpSignificators: kpSignificators,
            },
            yogas: allBirthChartYogas,
            ashtakavarga: ashtakavargaResult,
        };

        logger.info(`HolisticPrediction: ascendant rashi = ${chartDataForPrediction.ascendant.rashi}, sidereal = ${chartDataForPrediction.ascendant.sidereal_dms}`);
        const holisticPrediction = await predictionEngine.generateHolisticPrediction(chartDataForPrediction, lang);

        // Add the date used for the prediction to the response payload
        holisticPrediction.predictionDate = dateForCalculations;
        // Debug: include the ascendant that was passed to the engine
        holisticPrediction._debug_chart_ascendant = chartDataForPrediction.ascendant;

        res.json(holisticPrediction);

    } catch (error) {
        handleRouteError(res, error, '/predictions/holistic', req.body);
    }
});

export default router;
