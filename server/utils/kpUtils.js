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
            const signLordHousesOwned = getHousesRuledByPlanet(signLord, siderealCuspStartDegrees);
            const signLordOccupiedHouse = getHouseOfPlanet(allPlanetData[signLord].longitude, siderealCuspStartDegrees);
            result.signLordOwnedHouses = [...new Set([...signLordHousesOwned, signLordOccupiedHouse].filter(h => h !== null))]; // Return as array
        }
    }

    // 4. Houses from Associated Planets (for nodes only)
    if (isNode && associatedPlanets.length > 0) {
        const associatedOwned = new Set();
        associatedPlanets.forEach(associatedPlanetName => {
            if (associatedPlanetName !== 'Rahu' && associatedPlanetName !== 'Ketu') {
                 const housesOwned = getHousesRuledByPlanet(associatedPlanetName, siderealCuspStartDegrees);
                 const occupiedHouse = getHouseOfPlanet(allPlanetData[associatedPlanetName].longitude, siderealCuspStartDegrees);
                 housesOwned.forEach(h => associatedOwned.add(h));
                 if (occupiedHouse !== null) associatedOwned.add(occupiedHouse);
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
export function calculateKpSignificators(siderealPositions, siderealCuspStartDegrees, { directAspects, reverseAspects, conjunctions }) {
    if (!siderealPositions) {
        logger.error("siderealPositions is undefined in calculateKpSignificators. Cannot proceed.");
        return [];
    }

    const validatedSiderealPositions = { ...siderealPositions };
    PLANET_ORDER.forEach(pName => {
        if (!validatedSiderealPositions[pName]) {
            logger.warn(`Missing ${pName} in siderealPositions. Initializing with default values.`);
            validatedSiderealPositions[pName] = { longitude: NaN, nakLord: "N/A", subLord: "N/A" };
        }
    });

    const kpSignificatorsDetailed = PLANET_ORDER.map(planetName => {
        const planetSignificatorData = {
            name: planetName,
            occupiedHouses: [],
            ownedHouses: [],
            signLordOwnedHouses: [],
            aspectingOwnedHouses: [],
            allHouses: [],
            nakshatraLordName: null,
            nakLordAllHouses: [],
            subLordName: null,
            subLordAllHouses: [],
        };

        const planetInfo = validatedSiderealPositions[planetName];
        if (!planetInfo || typeof planetInfo.longitude !== 'number' || isNaN(planetInfo.longitude)) {
            logger.warn(`Skipping detailed significators for ${planetName}: Missing base data.`);
            planetSignificatorData.nakshatraLordName = planetInfo?.nakLord || "N/A";
            planetSignificatorData.subLordName = planetInfo?.subLord || "N/A";
            return planetSignificatorData;
        }

        const planetAspects = reverseAspects[planetName] || [];
        const planetConjunctions = conjunctions[planetName] || [];
        const associatedPlanets = [...new Set([...planetAspects, ...planetConjunctions])];

        const planetData = getEntitySignifications(planetName, validatedSiderealPositions, siderealCuspStartDegrees, associatedPlanets);
        planetSignificatorData.occupiedHouses = planetData.occupiedHouses;
        planetSignificatorData.ownedHouses = planetData.ownedHouses;
        planetSignificatorData.signLordOwnedHouses = planetData.signLordOwnedHouses;
        planetSignificatorData.aspectingOwnedHouses = planetData.aspectingOwnedHouses;
        planetSignificatorData.allHouses = [...new Set([
            ...planetData.occupiedHouses,
            ...planetData.ownedHouses,
            ...planetData.signLordOwnedHouses,
            ...planetData.aspectingOwnedHouses
        ])].sort((a, b) => a - b);

        const nakLordName = planetInfo.nakLord;
        planetSignificatorData.nakshatraLordName = nakLordName;
        if (nakLordName && nakLordName !== "N/A" && nakLordName !== "Error" && !nakLordName.includes("Data Missing")) {
            const nlAspects = reverseAspects[nakLordName] || [];
            const nlConjunctions = conjunctions[nakLordName] || [];
            const nlAssociatedPlanets = [...new Set([...nlAspects, ...nlConjunctions])];
            const nakLordData = getEntitySignifications(nakLordName, validatedSiderealPositions, siderealCuspStartDegrees, nlAssociatedPlanets);
            planetSignificatorData.nakLordAllHouses = [...new Set([
                ...nakLordData.occupiedHouses,
                ...nakLordData.ownedHouses,
                ...nakLordData.signLordOwnedHouses,
                ...nakLordData.aspectingOwnedHouses
            ])].sort((a, b) => a - b);
        }

        const subLordName = planetInfo.subLord;
        planetSignificatorData.subLordName = subLordName;
        if (subLordName && subLordName !== "N/A" && subLordName !== "Error" && !subLordName.includes("Data Missing")) {
            const slAspects = reverseAspects[subLordName] || [];
            const slConjunctions = conjunctions[subLordName] || [];
            const slAssociatedPlanets = [...new Set([...slAspects, ...slConjunctions])];
            const subLordData = getEntitySignifications(subLordName, validatedSiderealPositions, siderealCuspStartDegrees, slAssociatedPlanets);
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
