// routes/kpSignificatorRoutes.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import {
    normalizeAngle,
    getJulianDateUT,
    calculateAyanamsa,
    calculateHousesAndAscendant,
    calculateWholeSignHouses,
    calculatePlanetaryPositions,
    calculateAspects,
    getHouseOfPlanet,
    convertToDMS,
    calculateMidpoint,
    getNakshatraDetails,
    getRashiDetails,
    calculateNakshatraPada,
    PLANET_ORDER
} from '../utils/index.js';
import { calculateKpSignificators } from '../utils/kpUtils.js';
import { rotateHouses } from '../utils/rotationUtils.js';

const router = express.Router();

// --- Helper Function for Error Handling ---
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

// --- Validation Rules ---
const kpValidation = [
    body('date').isISO8601().withMessage('Invalid date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.')
];

const rotatedKpValidation = [
    ...kpValidation,
    body('house_to_rotate').isInt({ min: 1, max: 12 }).toInt().withMessage('House to rotate must be an integer between 1 and 12.')
];

// --- Route Definition ---
router.post('/', kpValidation, async (req, res) => {
   
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
            throw new Error('Failed to calculate Julian Day UT for KP Significators. Check input date/coordinates or timezone lookup.');
        }

        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
             throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalCusps, tropicalAscendant } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);

        // Ensure tropicalCusps is an array before mapping, even if null from calculateHousesAndAscendant
        const validTropicalCusps = tropicalCusps || [];

        if (validTropicalCusps.length === 0) {
            throw new Error("Failed to calculate house cusps, cannot proceed with KP significator calculation.");
        }

        const siderealCuspStartDegrees = validTropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        
        // Calculate Whole Sign cusps for aspects
        const siderealAscendant = normalizeAngle(tropicalAscendant - ayanamsa);
        const wholeSignCusps = calculateWholeSignHouses(siderealAscendant);

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        const siderealPositions = planetaryPositions.sidereal;
        
        // Calculate aspects using Whole Sign cusps
        const aspects = calculateAspects(siderealPositions);

        // Calculate KP significators using Placidus cusps but with aspects from Whole Sign chart
        const kpSignificatorsDetailed = calculateKpSignificators(siderealPositions, siderealCuspStartDegrees, aspects);

        const responsePayload = {
            kpSignificatorsData: kpSignificatorsDetailed,
        };
       
        res.json(responsePayload);
    } catch (error) {
        handleRouteError(res, error, '/kp-significators', req.body);
    }
});

router.post('/rotated', rotatedKpValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { date, latitude, longitude, house_to_rotate } = req.body;
        const latNum = latitude;
        const lonNum = longitude;

        const { julianDayUT, utcDate } = getJulianDateUT(date, latNum, lonNum);

        if (julianDayUT === null) {
            throw new Error('Failed to calculate Julian Day UT for KP Significators. Check input date/coordinates or timezone lookup.');
        }

        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
            throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalCusps, tropicalAscendant } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);

        // Ensure tropicalCusps is an array before mapping, even if null from calculateHousesAndAscendant
        const validTropicalCusps = tropicalCusps || [];

        if (validTropicalCusps.length === 0) {
            throw new Error("Failed to calculate house cusps, cannot proceed with KP significator calculation.");
        }

        const siderealCuspStartDegrees = validTropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        
        const rotatedSiderealCuspStartDegrees = rotateHouses(siderealCuspStartDegrees, house_to_rotate);

        const planetaryPositions = calculatePlanetaryPositions(julianDayUT);
        const siderealPositions = planetaryPositions.sidereal;
        
        const aspects = calculateAspects(siderealPositions);

        const kpSignificatorsDetailed = calculateKpSignificators(siderealPositions, rotatedSiderealCuspStartDegrees, aspects);

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

        const planetHousePlacements = {};
        PLANET_ORDER.forEach(planetName => {
            const planetData = siderealPositions[planetName];
            if (planetData && typeof planetData.longitude === 'number' && !isNaN(planetData.longitude)) {
                planetHousePlacements[planetName] = getHouseOfPlanet(planetData.longitude, rotatedSiderealCuspStartDegrees);
            }
        });

        const responsePayload = {
            kpSignificatorsData: kpSignificatorsDetailed,
            houses: housesData,
            planetHousePlacements: planetHousePlacements,
        };
       
        res.json(responsePayload);
    } catch (error) {
        handleRouteError(res, error, '/kp-significators/rotated', req.body);
    }
});


export default router;