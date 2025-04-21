// utils/kpUtils.js
import logger from './logger.js';
import { RASHI_SPAN } from './constants.js';
import { normalizeAngle } from './coreUtils.js';

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

// Add other KP-specific helper functions here if needed,
// potentially moving them from kpSignificatorRoutes.js if they are purely computational.
// For example, functions related to Cusp Sublords if calculated purely mathematically.
