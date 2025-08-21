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
