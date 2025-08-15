// utils/kpUtils.js
import logger from './logger.js';
import { RASHI_SPAN, PLANET_ORDER } from './constants.js';
import { normalizeAngle } from './coreUtils.js';
import { getHouseOfPlanet, getHousesRuledByPlanet } from './planetaryUtils.js';

// KP Number to Ascendant Degree Mapping (1-249)
// Each number corresponds to a specific degree within the zodiac.
// The sequence repeats every 249 numbers.
// Total span = 360 degrees. Span per number = 360 / 249 degrees.
const KP_SPAN_PER_NUMBER = 360 / 249;

/**
 * Calculates the sidereal Ascendant degree based on a KP Prashna number (1-249).
 * @param {number} prashnaNumber - The number given by the querent (1-249).
 * @returns {number} The corresponding sidereal Ascendant longitude in degrees [0, 360), or NaN if invalid input.
 */
export function getNumberBasedAscendantDegree(prashnaNumber) {
    if (typeof prashnaNumber !== 'number' || isNaN(prashnaNumber) || prashnaNumber < 1 || prashnaNumber > 249) {
        logger.error(`Invalid Prashna Number for Ascendant calculation: ${prashnaNumber}. Must be between 1 and 249.`);
        // Throw error as this is critical input
        throw new Error(`Invalid Prashna Number: ${prashnaNumber}. Must be between 1 and 249.`);
    }

    // Calculate the degree based on the number.
    // Number 1 starts at 0 degrees Aries (or the beginning of the chosen zodiac).
    // The degree represents the *start* or *midpoint* of the span for that number?
    // Assuming it represents the start:
    const degree = (prashnaNumber - 1) * KP_SPAN_PER_NUMBER;

    // Normalize the angle just in case, though it should be within [0, 360)
    const normalizedDegree = normalizeAngle(degree);

   
    return normalizedDegree;
}



/**
 * Gets the significations of a celestial entity (planet or node) based on KP rules.
 * @param {string} entityName - The name of the entity (e.g., "Sun", "Rahu").
 * @param {object} allPlanetData - An object containing sidereal data for all planets.
 * @param {number[]} siderealCuspStartDegrees - An array of 12 sidereal cusp start degrees.
 * @param {string[]} associatedPlanets - An array of planet names associated with the entity (through conjunction or aspect).
 * @returns {object} An object containing the entity's significations.
 */
function getEntitySignifications(entityName, allPlanetData, siderealCuspStartDegrees, associatedPlanets = []) {
    const entityData = allPlanetData[entityName];
    const result = {
        name: entityName,
        occupiedHouses: "",
        ownedHouses: "",
        signLordOwnedHouses: "",
        aspectingOwnedHouses: "",
    };

    // Ensure entityData is valid before proceeding
    if (!entityData || typeof entityData.longitude !== 'number' || isNaN(entityData.longitude)) {
        logger.warn(`No valid position data found for entity: ${entityName}. Returning default significations.`);
        return result; // Return the default result object
    }

    const isNode = entityName === 'Rahu' || entityName === 'Ketu';

    // 1. House Occupied
    const houseOccupied = getHouseOfPlanet(entityData.longitude, siderealCuspStartDegrees);
    result.occupiedHouses = houseOccupied !== null ? [houseOccupied] : []; // Return as array

    // 2. Houses Owned (for planets only)
    if (!isNode) {
        const housesOwned = getHousesRuledByPlanet(entityName, siderealCuspStartDegrees);
        result.ownedHouses = housesOwned; // Return as array
    }

    // 3. Houses from Sign Lord (for nodes only)
    if (isNode) {
        const signLord = entityData.rashiLord;
        if (signLord && signLord !== "N/A" && signLord !== "Error") {
            const signLordHouses = getHousesRuledByPlanet(signLord, siderealCuspStartDegrees);
            result.signLordOwnedHouses = signLordHouses; // Return as array
        }
    }

    // 4. Houses from Associated Planets (for nodes only)
    if (isNode && associatedPlanets.length > 0) {
        const associatedOwned = new Set();
        associatedPlanets.forEach(associatedPlanetName => {
            if (associatedPlanetName !== 'Rahu' && associatedPlanetName !== 'Ketu') {
                 const houses = getHousesRuledByPlanet(associatedPlanetName, siderealCuspStartDegrees);
                 houses.forEach(h => associatedOwned.add(h));
            }
        });
       result.aspectingOwnedHouses = Array.from(associatedOwned); // Return as array
    }

    return result;
}


/**
 * Calculates the detailed KP significators for all planets.
 * @param {object} siderealPositions - Object containing sidereal positions for all planets.
 * @param {number[]} siderealCuspStartDegrees - Array of 12 sidereal cusp start degrees.
 * @param {object} aspects - Object mapping each planet to an array of aspecting planets.
 * @returns {object[]} An array of objects, where each object represents a planet and its significations.
 */
export function calculateKpSignificators(siderealPositions, siderealCuspStartDegrees, aspects) {
    if (!siderealPositions) {
        logger.error("siderealPositions is undefined in calculateKpSignificators. Cannot proceed.");
        return [];
    }

    // Ensure aspects is an object, default to empty if not provided or invalid
    const validatedAspects = aspects && typeof aspects === 'object' ? aspects : {};

    // Ensure all planets in PLANET_ORDER are present in siderealPositions with default values if missing
    const validatedSiderealPositions = { ...siderealPositions };
    PLANET_ORDER.forEach(pName => {
        if (!validatedSiderealPositions[pName]) {
            logger.warn(`Missing ${pName} in siderealPositions. Initializing with default values.`);
            validatedSiderealPositions[pName] = { longitude: NaN, nakLord: "N/A", subLord: "N/A" };
        }
    });

    const planetHousePlacements = {};
    PLANET_ORDER.forEach(pName => {
        const pData = validatedSiderealPositions[pName];
        if (pData && typeof pData.longitude === 'number' && !isNaN(pData.longitude)) {
            planetHousePlacements[pName] = getHouseOfPlanet(pData.longitude, siderealCuspStartDegrees);
        }
    });

    const kpSignificatorsDetailed = PLANET_ORDER.map(planetName => {
        const planetSignificatorData = {
            name: planetName,
            occupiedHouses: [],
            ownedHouses: [],
            signLordOwnedHouses: [],
            aspectingOwnedHouses: [],
            allHouses: [], // New: Aggregated houses for the planet itself
            nakshatraLordName: null,
            nakLordAllHouses: [], // New: Aggregated houses for the nakshatra lord
            subLordName: null,
            subLordAllHouses: [], // New: Aggregated houses for the sub lord
        };

        const planetInfo = validatedSiderealPositions[planetName];
        if (!planetInfo || typeof planetInfo.longitude !== 'number' || isNaN(planetInfo.longitude)) {
            logger.warn(`Skipping detailed significators for ${planetName}: Missing base data.`);
            planetSignificatorData.nakshatraLordName = planetInfo?.nakLord || "N/A";
            planetSignificatorData.subLordName = planetInfo?.subLord || "N/A";
            return planetSignificatorData;
        }

        // Find planets conjunct with (in the same house as) Rahu/Ketu
        let conjunctPlanets = [];
        if (planetName === 'Rahu' || planetName === 'Ketu') {
            const nodeHouse = planetHousePlacements[planetName];
            if (nodeHouse !== null) {
                PLANET_ORDER.forEach(otherPlanetName => {
                    if (otherPlanetName !== planetName && otherPlanetName !== 'Rahu' && otherPlanetName !== 'Ketu' && planetHousePlacements[otherPlanetName] === nodeHouse) {
                        conjunctPlanets.push(otherPlanetName);
                    }
                });
            }
        }

        const planetAspects = validatedAspects[planetName] || [];
        const associatedPlanets = [...new Set([...planetAspects, ...conjunctPlanets])];

        // Calculate significations for the planet itself
        const planetData = getEntitySignifications(planetName, validatedSiderealPositions, siderealCuspStartDegrees, associatedPlanets);
        planetSignificatorData.occupiedHouses = planetData.occupiedHouses;
        planetSignificatorData.ownedHouses = planetData.ownedHouses;
        planetSignificatorData.signLordOwnedHouses = planetData.signLordOwnedHouses;
        planetSignificatorData.aspectingOwnedHouses = planetData.aspectingOwnedHouses;
        // Aggregate all houses for the planet itself
        planetSignificatorData.allHouses = [...new Set([
            ...planetSignificatorData.occupiedHouses,
            ...planetSignificatorData.ownedHouses,
            ...planetSignificatorData.signLordOwnedHouses,
            ...planetSignificatorData.aspectingOwnedHouses
        ])].sort((a, b) => a - b);

        // Calculate significations for the Nakshatra Lord
        const nakLordName = planetInfo.nakLord;
        planetSignificatorData.nakshatraLordName = nakLordName;
        if (nakLordName && nakLordName !== "N/A" && nakLordName !== "Error" && nakLordName !== "Unknown Nakshatra" && !nakLordName.includes("Data Missing")) {
            const nlAspects = validatedAspects[nakLordName] || [];
            const nakLordData = getEntitySignifications(nakLordName, validatedSiderealPositions, siderealCuspStartDegrees, nlAspects);
            // Aggregate all houses for the nakshatra lord
            planetSignificatorData.nakLordAllHouses = [...new Set([
                ...nakLordData.occupiedHouses,
                ...nakLordData.ownedHouses,
                ...nakLordData.signLordOwnedHouses,
                ...nakLordData.aspectingOwnedHouses
            ])].sort((a, b) => a - b);
        }

        // Calculate significations for the Sub Lord
        const subLordName = planetInfo.subLord;
        planetSignificatorData.subLordName = subLordName;
        if (subLordName && subLordName !== "N/A" && subLordName !== "Error" && subLordName !== "Unknown Nakshatra" && !subLordName.includes("Data Missing")) {
            const slAspects = validatedAspects[subLordName] || [];
            const subLordData = getEntitySignifications(subLordName, validatedSiderealPositions, siderealCuspStartDegrees, slAspects);
            // Aggregate all houses for the sub lord
            planetSignificatorData.subLordAllHouses = [...new Set([
                ...subLordData.occupiedHouses,
                ...subLordData.ownedHouses,
                ...subLordData.signLordOwnedHouses,
                ...subLordData.aspectingOwnedHouses
            ])].sort((a, b) => a - b);
        }

        return planetSignificatorData;
    });

    return kpSignificatorsDetailed;
}