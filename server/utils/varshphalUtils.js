// utils/varshphalUtils.js
import swisseph from 'swisseph-v2';
import logger from './logger.js';
import { normalizeAngle, getJulianDateUT, calculateHousesAndAscendant } from './coreUtils.js';
import { calculatePlanetaryPositions } from './planetaryUtils.js';
import { RASHIS, WEEKDAY_LORDS, PLANETARY_FRIENDSHIPS, ASPECTS, TAJIKA_ASPECT_SCORES, RASHI_LORDS } from './constants.js';

/**
 * Calculates the Julian Day (UT) of the Solar Return moment for a given year.
 * Finds the time when the sidereal Sun returns to its exact natal sidereal longitude.
 * @param {number} natalJD_UT - Julian Day (UT) of birth.
 * @param {number} natalSunSiderealLongitude - Sidereal longitude of the Sun at birth.
 * @param {number} targetYear - The year for which to calculate the Solar Return.
 * @returns {Promise<number>} A promise resolving to the Julian Day (UT) of the Solar Return, or NaN on error.
 */
export async function calculateSolarReturnJulianDay(natalJD_UT, natalSunSiderealLongitude, targetYear) {
    // Note: The original function used a variable `natalSunTropicalLongitude` but performed a sidereal calculation.
    // This has been corrected to `natalSunSiderealLongitude` for clarity.
    // TODO: Offer an option for a true Tropical Solar Return as some users may prefer it.
    if (isNaN(natalJD_UT) || isNaN(natalSunSiderealLongitude) || isNaN(targetYear)) {
        throw new Error(`Invalid input for calculateSolarReturnJulianDay: natalJD=${natalJD_UT}, natalSunLon=${natalSunSiderealLongitude}, year=${targetYear}`);
    }

    // Estimate the SR date: roughly the same day/month as birth in the target year
    const natalDate = new Date((natalJD_UT - 2440587.5) * 86400000);
    const estimatedSRDate = new Date(Date.UTC(targetYear, natalDate.getUTCMonth(), natalDate.getUTCDate(), natalDate.getUTCHours(), natalDate.getUTCMinutes(), natalDate.getUTCSeconds()));
    let jdGuess = (estimatedSRDate.getTime() / 86400000) + 2440587.5;

    const siderealFlags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
    const targetLon = normalizeAngle(natalSunSiderealLongitude);
    const maxIterations = 10;
    const tolerance = 1e-7;

    try {
        for (let i = 0; i < maxIterations; i++) {
            const sunCalc = swisseph.swe_calc_ut(jdGuess, swisseph.SE_SUN, siderealFlags);
            if (!sunCalc || typeof sunCalc.longitude !== 'number' || typeof sunCalc.longitudeSpeed !== 'number') {
                throw new Error(`Failed to calculate Sun position during SR iteration ${i + 1} at JD ${jdGuess}`);
            }

            const currentLon = normalizeAngle(sunCalc.longitude);
            const currentSpeed = sunCalc.longitudeSpeed;

            let diff = targetLon - currentLon;
            if (diff > 180) diff -= 360;
            if (diff <= -180) diff += 360;

            if (Math.abs(diff) <= tolerance) {
                return jdGuess;
            }

            if (Math.abs(currentSpeed) < 1e-6) {
                throw new Error(`Sun speed is too low (${currentSpeed}) during SR iteration ${i + 1}, cannot converge.`);
            }
            const correctionDays = diff / currentSpeed;
            jdGuess += correctionDays;

            if (Math.abs(correctionDays) > 2) {
                logger.warn(`Large correction (${correctionDays.toFixed(2)} days) in SR iteration ${i + 1}.`);
            }
        }
        throw new Error(`Solar Return calculation did not converge within ${maxIterations} iterations.`);
    } catch (error) {
        logger.error(`Error calculating Solar Return JD: ${error.message}`, { stack: error.stack });
        throw error;
    }
}


/**
 * Calculates the Muntha sign for a given Varshphal year.
 * @param {number} natalAscendantSignIndex - Index (0-11) of the Rashi of the natal Ascendant.
 * @param {number} ageAtVarshphalStart - Age in completed years.
 * @returns {{ signIndex: number }} Object containing the index (0-11) of the Muntha sign.
 */
export function calculateMuntha(natalAscendantSignIndex, ageAtVarshphalStart) {
    if (isNaN(natalAscendantSignIndex) || natalAscendantSignIndex < 0 || natalAscendantSignIndex > 11 || isNaN(ageAtVarshphalStart) || ageAtVarshphalStart < 0) {
        throw new Error(`Invalid input for calculateMuntha: AscIndex=${natalAscendantSignIndex}, Age=${ageAtVarshphalStart}`);
    }
    const munthaSignIndex = (natalAscendantSignIndex + ageAtVarshphalStart) % 12;
    return { signIndex: munthaSignIndex };
}

/**
 * Gets the lord of the Tri-Rashi.
 * @param {number} srAscendantSignIndex - The sign index of the Solar Return ascendant.
 * @returns {string} The lord of the Tri-Rashi.
 */
function getTriRashiLord(srAscendantSignIndex) {
    const srAscSign = RASHIS[srAscendantSignIndex];
    if (['Aries', 'Leo', 'Sagittarius'].includes(srAscSign)) return 'Sun'; // For diurnal signs
    if (['Taurus', 'Virgo', 'Capricorn'].includes(srAscSign)) return 'Moon'; // For nocturnal signs
    // For other signs, it depends on the time of birth (day/night)
    // This is a simplification; a more accurate method would check the birth time.
    // Let's assume a default for now.
    return 'Mars'; // Default for other cases
}

/**
 * Calculates the Tajika aspects between planets in a chart.
 * @param {Array<Object>} planets - The array of planet objects from the chart.
 * @returns {Object} An object where keys are planet names and values are arrays of aspects they receive.
 */
function calculateTajikaAspects(planets) {
    const aspectsReceived = {};
    planets.forEach(p => { aspectsReceived[p.name] = []; });

    for (let i = 0; i < planets.length; i++) {
        for (let j = 0; j < planets.length; j++) {
            if (i === j) continue;

            const p1 = planets[i];
            const p2 = planets[j];
            const angle = normalizeAngle(p1.longitude - p2.longitude);

            for (const aspect of ASPECTS) {
                if (Math.abs(angle - aspect.angle) < aspect.orb || Math.abs(angle - (360 - aspect.angle)) < aspect.orb) {
                    aspectsReceived[p2.name].push({
                        from: p1.name,
                        type: aspect.type,
                        nature: PLANETARY_FRIENDSHIPS[p2.rashiLord][p1.rashiLord] || 'Neutral'
                    });
                }
            }
        }
    }
    return aspectsReceived;
}

/**
 * Calculates the strength of a planet for Panchadhikari selection.
 * @param {string} planetName - The name of the planet.
 * @param {Object} aspectsReceived - The aspects object from `calculateTajikaAspects`.
 * @returns {number} The strength score of the planet.
 */
function getPlanetStrength(planetName, aspectsReceived) {
    let score = 0;
    if (aspectsReceived[planetName]) {
        aspectsReceived[planetName].forEach(aspect => {
            const aspectScore = TAJIKA_ASPECT_SCORES[aspect.type] || 0;
            const friendship = aspect.nature;
            if (friendship === 'Friend') {
                score += aspectScore;
            } else if (friendship === 'Enemy') {
                score -= aspectScore;
            } else {
                score += aspectScore / 2; // Neutral
            }
        });
    }
    return score;
}


/**
 * Determines the Year Lord (Varsheshwara) using the Panchadhikari method.
 * @param {Object} varshphalChart - The full Varshphal chart object.
 * @param {string} natalAscendantLord - Lord of the natal ascendant.
 * @param {number} solarReturnWeekDay - Weekday index (0=Sun, 6=Sat) of the Solar Return.
 * @returns {string} The name of the Year Lord planet.
 */
export function calculateYearLord(varshphalChart, natalAscendantLord, solarReturnWeekDay) {
    const srAscendantLord = varshphalChart.ascendant.rashiLord;
    const munthaLord = RASHI_LORDS[varshphalChart.muntha.signIndex];
    const srWeekdayLord = WEEKDAY_LORDS[solarReturnWeekDay];
    const triRashiLord = getTriRashiLord(varshphalChart.ascendant.signIndex);

    const contenders = [
        { name: 'Natal Ascendant Lord', planet: natalAscendantLord },
        { name: 'Year Ascendant Lord', planet: srAscendantLord },
        { name: 'Muntha Lord', planet: munthaLord },
        { name: 'Weekday Lord', planet: srWeekdayLord },
        { name: 'Tri-Rashi Lord', planet: triRashiLord }
    ];

    

        const planetsArray = Object.entries(varshphalChart.planetaryPositions.sidereal).map(([name, planetData]) => ({ name, ...planetData }));
    const aspectsReceived = calculateTajikaAspects(planetsArray);
    let bestContender = null;
    let maxStrength = -Infinity;

    const uniqueContenders = [...new Set(contenders.map(c => c.planet))];

    uniqueContenders.forEach(planet => {
        const strength = getPlanetStrength(planet, aspectsReceived);
       
        if (strength > maxStrength) {
            maxStrength = strength;
            bestContender = planet;
        }
    });

    if (!bestContender) {
        logger.warn("Could not determine Year Lord from Panchadhikari, falling back to SR Ascendant Lord.");
        return srAscendantLord || natalAscendantLord; // Fallback
    }

   
    return bestContender;
}
