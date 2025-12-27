// utils/rotationUtils.js
import logger from './logger.js';

/**
 * Rotates the house cusps array to make the selected house the first house.
 * @param {number[]} siderealCuspStartDegrees - Array of 12 sidereal cusp start degrees.
 * @param {number} houseToRotate - The house number to become the new first house (1-12).
 * @returns {number[]} The rotated array of sidereal cusp start degrees.
 */
export function rotateHouses(siderealCuspStartDegrees, houseToRotate) {
    if (!Array.isArray(siderealCuspStartDegrees) || siderealCuspStartDegrees.length !== 12) {
        logger.error(`Invalid input for siderealCuspStartDegrees in rotateHouses. Expected an array of 12 numbers.`);
        throw new Error('Invalid house cusp data.');
    }

    if (typeof houseToRotate !== 'number' || isNaN(houseToRotate) || houseToRotate < 1 || houseToRotate > 12) {
        logger.error(`Invalid houseToRotate value: ${houseToRotate}. Must be an integer between 1 and 12.`);
        // Default to 1 if the input is invalid to prevent crashes
        houseToRotate = 1;
    }

    // No rotation needed if we are rotating from house 1
    if (houseToRotate === 1) {
        return siderealCuspStartDegrees;
    }

    const indexToStart = houseToRotate - 1;
    const rotatedCusps = [
        ...siderealCuspStartDegrees.slice(indexToStart),
        ...siderealCuspStartDegrees.slice(0, indexToStart)
    ];

    
    return rotatedCusps;
}

/**
 * Apply rotation to tropical cusps/ascendant and compute sidereal and rotated values.
 * @param {Object} params
 * @param {number[]} params.tropicalCusps - array of 12 tropical cusps
 * @param {number} params.tropicalAscendant - tropical ascendant degree
 * @param {number} params.ayanamsa - ayanamsa to convert tropical->sidereal
 * @param {number} params.houseToRotate - house number to rotate to (1-12)
 * @returns {{ siderealCuspStartDegrees: number[], siderealAscendantDeg: number, rotatedCusps: number[], rotatedAscendantDeg: number }}
 */
export function applyHouseRotation({ tropicalCusps, tropicalAscendant, ayanamsa, houseToRotate = 1 }) {
    if (!Array.isArray(tropicalCusps) || tropicalCusps.length !== 12) {
        logger.error('applyHouseRotation: invalid tropicalCusps');
        throw new Error('Invalid tropical cusps array');
    }
    const siderealCuspStartDegrees = tropicalCusps.map(cusp => ((cusp - ayanamsa) % 360 + 360) % 360);
    const siderealAscendantDeg = ((tropicalAscendant - ayanamsa) % 360 + 360) % 360;

    const validHouse = (typeof houseToRotate === 'number' && !isNaN(houseToRotate) && houseToRotate >= 1 && houseToRotate <= 12) ? houseToRotate : 1;
    const rotatedCusps = rotateHouses(siderealCuspStartDegrees, validHouse);
    // rotated ascendant is the first cusp in rotated array
    const rotatedAscendantDeg = rotatedCusps[0];

    return { siderealCuspStartDegrees, siderealAscendantDeg, rotatedCusps, rotatedAscendantDeg };
}
