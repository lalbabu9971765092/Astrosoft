// utils/varshphalUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
import { normalizeAngle, getJulianDateUT, calculateHousesAndAscendant } from './coreUtils.js';
import { calculatePlanetaryPositions } from './planetaryUtils.js';
import { RASHIS, WEEKDAY_LORDS } from './constants.js';

/**
 * Calculates the Julian Day (UT) of the Solar Return moment for a given year.
 * Finds the time when the tropical Sun returns to its exact natal tropical longitude.
 * @param {number} natalJD_UT - Julian Day (UT) of birth.
 * @param {number} natalSunTropicalLongitude - Tropical longitude of the Sun at birth.
 * @param {number} targetYear - The year for which to calculate the Solar Return.
 * @returns {Promise<number>} A promise resolving to the Julian Day (UT) of the Solar Return, or NaN on error.
 */
export async function calculateSolarReturnJulianDay(natalJD_UT, natalSunTropicalLongitude, targetYear) {
    if (isNaN(natalJD_UT) || isNaN(natalSunTropicalLongitude) || isNaN(targetYear)) {
        throw new Error(`Invalid input for calculateSolarReturnJulianDay: natalJD=${natalJD_UT}, natalSunLon=${natalSunTropicalLongitude}, year=${targetYear}`);
    }

    // Estimate the SR date: roughly the same day/month as birth in the target year
    const natalDate = new Date((natalJD_UT - 2440587.5) * 86400000);
    const estimatedSRDate = new Date(Date.UTC(targetYear, natalDate.getUTCMonth(), natalDate.getUTCDate(), natalDate.getUTCHours(), natalDate.getUTCMinutes(), natalDate.getUTCSeconds()));
    let jdGuess = (estimatedSRDate.getTime() / 86400000) + 2440587.5;

    const siderealFlags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL; // Use sidereal flags
    const targetLon = normalizeAngle(natalSunTropicalLongitude);
    const maxIterations = 10; // Limit iterations to prevent infinite loops
    const tolerance = 1e-7; // Tolerance in degrees (approx 0.3 arcseconds)

    logger.debug(`Starting Solar Return calculation for target ${targetLon.toFixed(6)}°, year ${targetYear}. Initial JD guess: ${jdGuess.toFixed(6)}`);

    try {
        for (let i = 0; i < maxIterations; i++) {
            // Calculate Sun's position at the current guess time
            const sunCalc = swisseph.swe_calc_ut(jdGuess, swisseph.SE_SUN, siderealFlags);
            if (!sunCalc || typeof sunCalc.longitude !== 'number' || typeof sunCalc.longitudeSpeed !== 'number') {
                throw new Error(`Failed to calculate Sun position during SR iteration ${i + 1} at JD ${jdGuess}`);
            }

            const currentLon = normalizeAngle(sunCalc.longitude);
            const currentSpeed = sunCalc.longitudeSpeed; // Degrees per day

            // Calculate the difference from the target longitude, handling wrap-around
            let diff = targetLon - currentLon;
            if (diff > 180) diff -= 360;
            if (diff <= -180) diff += 360;

            logger.debug(`SR Iteration ${i + 1}: JD=${jdGuess.toFixed(6)}, SunLon=${currentLon.toFixed(6)}°, Diff=${diff.toFixed(7)}°, Speed=${currentSpeed.toFixed(6)}°/day`);

            // Check if we are within tolerance
            if (Math.abs(diff) <= tolerance) {
               
                return jdGuess; // Found the moment
            }

            // Estimate time correction needed: diff / speed (in days)
            if (Math.abs(currentSpeed) < 1e-6) { // Avoid division by zero or near-zero speed
                 throw new Error(`Sun speed is too low (${currentSpeed}) during SR iteration ${i + 1}, cannot converge.`);
            }
            const correctionDays = diff / currentSpeed;

            // Apply correction (Newton-Raphson step)
            jdGuess += correctionDays;

            // Add a small check to prevent oscillation or huge jumps
            if (Math.abs(correctionDays) > 2) { // If correction is more than 2 days, something might be wrong
                 logger.warn(`Large correction (${correctionDays.toFixed(2)} days) in SR iteration ${i + 1}. Check initial guess or logic.`);
            }
        }

        // If loop finishes without converging
        throw new Error(`Solar Return calculation did not converge within ${maxIterations} iterations.`);

    } catch (error) {
        logger.error(`Error calculating Solar Return JD: ${error.message}`, { stack: error.stack });
        throw error; // Re-throw the error
    }
}


/**
 * Calculates the Muntha sign for a given Varshphal year.
 * Muntha progresses one sign per year from the Ascendant sign at birth.
 * @param {number} natalAscendantSignIndex - Index (0-11) of the Rashi of the natal Ascendant.
 * @param {number} ageAtVarshphalStart - Age in completed years at the start of the Varshphal year.
 * @returns {{ signIndex: number }} Object containing the index (0-11) of the Muntha sign.
 */
export function calculateMuntha(natalAscendantSignIndex, ageAtVarshphalStart) {
    if (isNaN(natalAscendantSignIndex) || natalAscendantSignIndex < 0 || natalAscendantSignIndex > 11 || isNaN(ageAtVarshphalStart) || ageAtVarshphalStart < 0) {
        throw new Error(`Invalid input for calculateMuntha: AscIndex=${natalAscendantSignIndex}, Age=${ageAtVarshphalStart}`);
    }
    // Muntha sign index = (Natal Ascendant Index + Age) % 12
    const munthaSignIndex = (natalAscendantSignIndex + ageAtVarshphalStart) % 12;
    return { signIndex: munthaSignIndex };
}

/**
 * Determines the Year Lord (Varsheshwara) for the Varshphal year.
 * Based on Tajika rules (simplified version).
 * @param {number} solarReturnWeekDay - Weekday index (0=Sun, 6=Sat) of the Solar Return moment (UTC).
 * @param {string} natalAscendantLord - Lord of the natal Ascendant sign.
 * @param {string} srAscendantLord - Lord of the Solar Return Ascendant sign.
 * @returns {string} The name of the Year Lord planet.
 */
export function calculateYearLord(solarReturnWeekDay, natalAscendantLord, srAscendantLord) {
    // Simplified Rule: Check Muntha lord? Check SR Asc lord? Check Panchadhikari?
    // Using a common simple rule: Lord of the SR Ascendant sign is often considered.
    // Another rule: Lord of the weekday of SR start.
    // Let's prioritize SR Ascendant Lord, then Weekday Lord as fallback.

    if (srAscendantLord && srAscendantLord !== "N/A" && srAscendantLord !== "Error") {
       
        return srAscendantLord;
    } else if (!isNaN(solarReturnWeekDay) && solarReturnWeekDay >= 0 && solarReturnWeekDay <= 6) {
        const weekdayLord = WEEKDAY_LORDS[solarReturnWeekDay];
       
        return weekdayLord;
    } else {
        logger.warn("Could not determine Year Lord using simple rules (SR Asc Lord or Weekday Lord).");
        // Fallback further? Maybe Natal Asc Lord?
        if (natalAscendantLord && natalAscendantLord !== "N/A" && natalAscendantLord !== "Error") {
             logger.warn(`Using Natal Ascendant Lord as final fallback Year Lord: ${natalAscendantLord}`);
             return natalAscendantLord;
        }
        throw new Error("Failed to determine Year Lord.");
    }
    // TODO: Implement more complex Panchadhikari calculation if needed.
}
