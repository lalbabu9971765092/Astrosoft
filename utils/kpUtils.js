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

    logger.info(`Calculated KP Ascendant Degree for number ${prashnaNumber}: ${normalizedDegree.toFixed(4)}`);
    return normalizedDegree;
}

/**
 * Formats an array of house numbers into a sorted, comma-separated string.
 * @param {Set<number>|number[]} houses - A Set or array of house numbers.
 * @returns {string} A formatted string of house numbers, e.g., "1, 5, 9".
 */
function formatHouseNumbers(houses) {
    if (!houses) return "";
    const houseArray = Array.isArray(houses) ? houses : Array.from(houses);
    if (houseArray.length === 0) return "";
    const numericHouses = houseArray.map(Number).filter(n => !isNaN(n));
    return numericHouses.sort((a, b) => a - b).join(', ');
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

    if (!entityData || typeof entityData.longitude !== 'number' || isNaN(entityData.longitude)) {
        logger.warn(`No valid position data found for entity: ${entityName}`);
        return result;
    }

    const isNode = entityName === 'Rahu' || entityName === 'Ketu';

    // 1. House Occupied
    const houseOccupied = getHouseOfPlanet(entityData.longitude, siderealCuspStartDegrees);
    result.occupiedHouses = houseOccupied !== null ? String(houseOccupied) : "";

    // 2. Houses Owned (for planets only)
    if (!isNode) {
        const housesOwned = getHousesRuledByPlanet(entityName, siderealCuspStartDegrees);
        result.ownedHouses = formatHouseNumbers(housesOwned);
    }

    // 3. Houses from Sign Lord (for nodes only)
    if (isNode) {
        const signLord = entityData.rashiLord;
        if (signLord && signLord !== "N/A" && signLord !== "Error") {
            const signLordHouses = getHousesRuledByPlanet(signLord, siderealCuspStartDegrees);
            result.signLordOwnedHouses = formatHouseNumbers(signLordHouses);
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
       result.aspectingOwnedHouses = formatHouseNumbers(associatedOwned);
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
export function calculateKpSignificators(siderealPositions, sidereaCuspStartDegrees, aspects) {
    const planetHousePlacements = {};
    PLANET_ORDER.forEach(pName => {
        const pData = siderealPositions[pName];
        if (pData && typeof pData.longitude === 'number' && !isNaN(pData.longitude)) {
            planetHousePlacements[pName] = getHouseOfPlanet(pData.longitude, sidereaCuspStartDegrees);
        }
    });

    const kpSignificatorsDetailed = PLANET_ORDER.map(planetName => {
        const planetSignificatorData = {
            name: planetName,
            occupiedHouses: "",
            ownedHouses: "",
            signLordOwnedHouses: "",
            aspectingOwnedHouses: "",
            nakshatraLord: null,
            subLord: null,
        };

        const planetInfo = siderealPositions[planetName];
        if (!planetInfo || typeof planetInfo.longitude !== 'number' || isNaN(planetInfo.longitude)) {
            logger.warn(`Skipping detailed significators for ${planetName}: Missing base data.`);
            planetSignificatorData.nakshatraLord = { name: planetInfo?.nakLord || "N/A" };
            planetSignificatorData.subLord = { name: planetInfo?.subLord || "N/A" };
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

        const planetAspects = aspects[planetName] || [];
        const associatedPlanets = [...new Set([...planetAspects, ...conjunctPlanets])];

        const planetData = getEntitySignifications(planetName, siderealPositions, sidereaCuspStartDegrees, associatedPlanets);
        planetSignificatorData.occupiedHouses = planetData.occupiedHouses;
        planetSignificatorData.ownedHouses = planetData.ownedHouses;
        planetSignificatorData.signLordOwnedHouses = planetData.signLordOwnedHouses;
        planetSignificatorData.aspectingOwnedHouses = planetData.aspectingOwnedHouses;

        const nakLordName = planetInfo.nakLord;
        if (nakLordName && nakLordName !== "N/A" && nakLordName !== "Error") {
            const nlAspects = aspects[nakLordName] || [];
            planetSignificatorData.nakshatraLord = getEntitySignifications(nakLordName, siderealPositions, sidereaCuspStartDegrees, nlAspects);
        } else {
            planetSignificatorData.nakshatraLord = { name: nakLordName || "N/A" };
        }

        const subLordName = planetInfo.subLord;
        if (subLordName && subLordName !== "N/A" && subLordName !== "Error") {
            const slAspects = aspects[subLordName] || [];
            planetSignificatorData.subLord = getEntitySignifications(subLordName, siderealPositions, sidereaCuspStartDegrees, slAspects);
        } else {
            planetSignificatorData.subLord = { name: subLordName || "N/A" };
        }

        return planetSignificatorData;
    });

    return kpSignificatorsDetailed;
}