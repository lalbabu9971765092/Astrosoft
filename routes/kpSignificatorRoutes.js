// routes/kpSignificatorRoutes.js
import express from 'express'; // Changed
import { body, validationResult } from 'express-validator'; // Changed

// --- Import Logger ---
import logger from '../utils/logger.js'; // Added logger import

// --- Import Shared Utilities ---
import { // Changed
    RASHI_LORDS,
    PLANET_ORDER,
    normalizeAngle,
    getJulianDateUT, // <-- Make sure this is imported
    calculateAyanamsa,
    calculateHousesAndAscendant,
    calculatePlanetaryPositions,
    getRashiDetails,
    calculateAspects,
    getHouseOfPlanet, // Ensure this is exported from planetaryUtils or kpUtils
    getHousesRuledByPlanet
} from '../utils/index.js'; // Assuming utils/index.js exports everything

const router = express.Router();

// --- Helper Function for Error Handling ---
function handleRouteError(res, error, routeName, inputData = {}) {
    // Use logger instead of console.error
    logger.error(`Error in ${routeName} route: ${error.message}`, {
        routeName,
        // input: inputData, // Be cautious logging full input in production
        error: error.stack || error // Log stack trace
    });

    const statusCode = error.status || 500;
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


// --- KP Significator Specific Helper Functions ---
// Moved getHouseOfPlanet to planetaryUtils.js



function formatHouseNumbers(houses) {
    if (!houses) return "";
    const houseArray = Array.isArray(houses) ? houses : Array.from(houses);  
    if (houseArray.length === 0) return "";
    const numericHouses = houseArray.map(Number).filter(n => !isNaN(n));
    return numericHouses.sort((a, b) => a - b).join(', ');
}

function getEntitySignifications(entityName, allPlanetData, siderealCuspStartDegrees, associatedPlanets = []) {
    const entityData = allPlanetData[entityName];
    const result = {
        name: entityName, occupiedHouses: "", ownedHouses: "",
        signLordOwnedHouses: "", aspectingOwnedHouses: "",
    };
    if (!entityData || typeof entityData.longitude !== 'number' || isNaN(entityData.longitude)) {
        logger.warn(`No valid position data found for entity: ${entityName}`); // Use logger
        return result;
    }
    const isNode = entityName === 'Rahu' || entityName === 'Ketu';
    const houseOccupied = getHouseOfPlanet(entityData.longitude, siderealCuspStartDegrees);
    result.occupiedHouses = houseOccupied !== null ? String(houseOccupied) : "";
    if (isNode) {
        const signLord = entityData.rashiLord;
        if (signLord && signLord !== "N/A" && signLord !== "Error") {
            const signLordHouses = getHousesRuledByPlanet(signLord, siderealCuspStartDegrees);
            result.signLordOwnedHouses = formatHouseNumbers(signLordHouses);
        }
    } else {
        const housesOwned = getHousesRuledByPlanet(entityName, siderealCuspStartDegrees);
        result.ownedHouses = formatHouseNumbers(housesOwned);
    }
   if (isNode && associatedPlanets.length > 0) {
        const associatedOwned = new Set();
        associatedPlanets.forEach(associatedPlanetName => {
            if (associatedPlanetName !== 'Rahu' && associatedPlanetName !== 'Ketu') {
                 const houses = getHousesRuledByPlanet(associatedPlanetName, siderealCuspStartDegrees);
                 houses.forEach(h => associatedOwned.add(h));
            }
        });
       result.aspectingOwnedHouses = formatHouseNumbers(associatedOwned);
    }
    return result;
}

// --- Validation Rules ---
const kpValidation = [
    body('date').isISO8601().withMessage('Invalid date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SS).'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat().withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat().withMessage('Longitude must be a number between -180 and 180.')
];

// --- Route Definition ---
router.post('/', kpValidation, async (req, res) => { // Changed to '/' assuming base path is set in server.js
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { date, latitude, longitude } = req.body; // Destructure validated data
        const latNum = latitude; // Already parsed
        const lonNum = longitude; // Already parsed

        logger.info(`Starting KP Significator calculation for date=${date}, lat=${latNum}, lon=${lonNum}`); // Use logger

        // *** CORRECTED CALL: Pass latNum and lonNum ***
        const { julianDayUT, utcDate } = getJulianDateUT(date, latNum, lonNum);

        // Check if getJulianDateUT failed
        if (julianDayUT === null) {
            throw new Error('Failed to calculate Julian Day UT for KP Significators. Check input date/coordinates or timezone lookup.');
        }

        const ayanamsa = calculateAyanamsa(julianDayUT);
        if (isNaN(ayanamsa)) {
             throw new Error(`Failed to calculate Ayanamsa for JD ${julianDayUT}`);
        }

        const { tropicalCusps, tropicalAscendant } = calculateHousesAndAscendant(julianDayUT, latNum, lonNum);

        // --- ADD NULL CHECK HERE ---
        if (tropicalCusps === null) {
            // Throw an error if cusps couldn't be calculated (even after fallback)
            throw new Error("Failed to calculate house cusps, cannot proceed with KP significator calculation.");
        }
        // --- END NULL CHECK ---

        const siderealCuspStartDegrees = tropicalCusps.map(cusp => normalizeAngle(cusp - ayanamsa));
        const planetaryPositions = calculatePlanetaryPositions(julianDayUT); // Throws on error
        const siderealPositions = planetaryPositions.sidereal;
        const aspects = calculateAspects(siderealPositions);
// Pre-calculate house placements for all planets to find conjunctions
        const planetHousePlacements = {};
        PLANET_ORDER.forEach(pName => {
            const pData = siderealPositions[pName];
            if (pData && typeof pData.longitude === 'number' && !isNaN(pData.longitude)) {
                planetHousePlacements[pName] = getHouseOfPlanet(pData.longitude, siderealCuspStartDegrees);
            }
        });
        const kpSignificatorsDetailed = [];
        PLANET_ORDER.forEach(planetName => {
            const planetSignificatorData = {
                name: planetName, occupiedHouses: "", ownedHouses: "",
                signLordOwnedHouses: "", aspectingOwnedHouses: "",
                nakshatraLord: null, subLord: null,
            };
            const planetInfo = siderealPositions[planetName];
            if (!planetInfo || typeof planetInfo.longitude !== 'number' || isNaN(planetInfo.longitude)) {
                logger.warn(`Skipping detailed significators for ${planetName}: Missing base data.`); // Use logger
                planetSignificatorData.nakshatraLord = { name: planetInfo?.nakLord || "N/A" };
                planetSignificatorData.subLord = { name: planetInfo?.subLord || "N/A" };
                kpSignificatorsDetailed.push(planetSignificatorData);
                return;
            }
            const nakLordName = planetInfo.nakLord;
            const subLordName = planetInfo.subLord;
             // Find planets conjunct with (in the same house as) Rahu/Ketu
            let conjunctPlanets = [];
            if (planetName === 'Rahu' || planetName === 'Ketu') {
                const nodeHouse = planetHousePlacements[planetName];
                if (nodeHouse !== null) {
                    PLANET_ORDER.forEach(otherPlanetName => {
                        // A planet is conjunct if it's in the same house, and it's not the node itself or the other node.
                        if (otherPlanetName !== planetName && otherPlanetName !== 'Rahu' && otherPlanetName !== 'Ketu' && planetHousePlacements[otherPlanetName] === nodeHouse) {
                            conjunctPlanets.push(otherPlanetName);
                        }
                    });
                }
            }
            const planetAspects = aspects[planetName] || [];
            const associatedPlanets = [...new Set([...planetAspects, ...conjunctPlanets])];
            const planetData = getEntitySignifications(planetName, siderealPositions, siderealCuspStartDegrees, associatedPlanets);
           planetSignificatorData.occupiedHouses = planetData.occupiedHouses;
            planetSignificatorData.ownedHouses = planetData.ownedHouses;
            planetSignificatorData.signLordOwnedHouses = planetData.signLordOwnedHouses;
            planetSignificatorData.aspectingOwnedHouses = planetData.aspectingOwnedHouses;
            if (nakLordName && nakLordName !== "N/A" && nakLordName !== "Error") {
                 const nlAspects = aspects[nakLordName] || [];
                 planetSignificatorData.nakshatraLord = getEntitySignifications(nakLordName, siderealPositions, siderealCuspStartDegrees, nlAspects); // Conjunctions not needed for sub-levels
            } else {
                 planetSignificatorData.nakshatraLord = { name: nakLordName || "N/A" };
            }
            if (subLordName && subLordName !== "N/A" && subLordName !== "Error") {
                 const slAspects = aspects[subLordName] || [];
                  planetSignificatorData.subLord = getEntitySignifications(subLordName, siderealPositions, siderealCuspStartDegrees, slAspects); // Conjunctions not needed for sub-levels
            } else {
                 planetSignificatorData.subLord = { name: subLordName || "N/A" };
            }
            kpSignificatorsDetailed.push(planetSignificatorData);
        });

        const responsePayload = {
            // inputParameters: { date, latitude: latNum, longitude: lonNum, utcDate: utcDate.toISOString(), julianDayUT, ayanamsa }, // Keep input params minimal if not needed by frontend
            kpSignificatorsData: kpSignificatorsDetailed,
        };
        logger.info(`KP Significator calculation successful for date=${date}`); // Use logger
        res.json(responsePayload);
    } catch (error) {
        handleRouteError(res, error, '/kp-significators', req.body);
    }
});

export default router; // Changed
