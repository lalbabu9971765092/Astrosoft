import { getJulianDateUT, convertDMSToDegrees, normalizeAngle } from './coreUtils.js';
import { calculatePlanetaryPositions, getHouseOfPlanet } from './planetaryUtils.js';
import { getCombinations } from './arrayUtils.js';
import logger from './logger.js';

// --- Helper Astrological Functions ---

// Helper to get Rashi index from longitude
function getRashiIndex(longitude) {
    return Math.floor(normalizeAngle(longitude) / 30);
}

// Helper to get relative Rashi (sign)
function getRelativeRashi(startRashiIndex, relativeDistance) {
    return (startRashiIndex + relativeDistance - 1) % 12;
}

/**
 * Calculates sign-based Vedic aspects (Graha Drishti).
 * @param {string} planetName The name of the aspecting planet.
 * @param {number} planetLongitude The longitude of the aspecting planet.
 * @param {number} targetLongitude The longitude of the body being aspected.
 * @returns {Array} An array with aspect details if one exists, otherwise empty.
 */
function getVedicSignAspects(planetName, planetLongitude, targetLongitude) {
    const aspects = [];
    // Rahu and Ketu do not cast aspects in this system.
    if (planetName === 'Rahu' || planetName === 'Ketu') {
        return aspects;
    }

    const planetRashi = getRashiIndex(planetLongitude);
    const targetRashi = getRashiIndex(targetLongitude);

    // A planet doesn't aspect its own sign. Conjunction is handled separately.
    if (planetRashi === targetRashi) {
        return [];
    }

    const specialAspects = {
        'Mars': [4, 8],
        'Jupiter': [5, 9],
        'Saturn': [3, 10]
    };

    const aspectedRashis = new Set();
    aspectedRashis.add(getRelativeRashi(planetRashi, 7)); // 7th Rashi aspect for all

    if (specialAspects[planetName]) {
        specialAspects[planetName].forEach(distance => {
            aspectedRashis.add(getRelativeRashi(planetRashi, distance));
        });
    }

    if (aspectedRashis.has(targetRashi)) {
        aspects.push({ type: 'Graha Drishti' });
    }

    return aspects;
}

/**
 * Checks for a degree-based conjunction between two longitudes within a given orb.
 * @param {number} lon1 - The first longitude.
 * @param {number} lon2 - The second longitude.
 * @param {number} orb - The allowable orb in degrees.
 * @returns {boolean} True if the planets are conjunct.
 */
function isDegreeBasedConjunction(lon1, lon2, orb) {
    if (typeof lon1 !== 'number' || typeof lon2 !== 'number' || typeof orb !== 'number') {
        return false;
    }
    const diff = Math.abs(lon1 - lon2);
    const angle = diff > 180 ? 360 - diff : diff;
    return angle <= orb;
}

// --- Main search function ---

const ORBS = {
    conjunction: 8,
    natalReturn: 1,
};

export async function findTransitEvents({ planets, houses, startDate, endDate, options, natalChart }) {
    const results = [];
    const natalPositions = natalChart.planetaryPositions.sidereal;
    const natalHouseCusps = natalChart.houses.map(h => convertDMSToDegrees(h.start_dms));

    const selectedPlanets = planets;
    const selectedHouses = houses;
    const selectedNatalHouseCusps = selectedHouses.map(h_num => natalHouseCusps[h_num - 1]);

    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    const eventCooldowns = {};

    while (currentDate <= finalDate) {
        const transitTime = currentDate.toISOString();
        const { julianDayUT } = getJulianDateUT(transitTime, natalChart.inputParameters.latitude, natalChart.inputParameters.longitude);
        if (julianDayUT === null) {
            currentDate.setHours(currentDate.getHours() + 1);
            continue;
        }
        const transitingPositions = calculatePlanetaryPositions(julianDayUT).sidereal;

        const checkAndAddEvent = (type, combo, eventText) => {
            const key = `${type}|${combo.sort().join(',')}`;
            const lastTime = eventCooldowns[key];
            // Cooldown of 24 hours to avoid repeated events for slow-moving configurations
            if (!lastTime || (currentDate.getTime() - lastTime.getTime()) > 24 * 60 * 60 * 1000) {
                results.push({ date: transitTime, event: eventText });
                eventCooldowns[key] = new Date(currentDate);
            }
        };

        const planetCombinations = getCombinations(selectedPlanets, 3);

        for (const combo of planetCombinations) {
            const [p1, p2, p3] = combo;
            const tp1 = transitingPositions[p1];
            const tp2 = transitingPositions[p2];
            const tp3 = transitingPositions[p3];

            if (!tp1 || !tp2 || !tp3) continue;

            if (options.threePlanetConjunction) {
                const longitudes = [tp1.longitude, tp2.longitude, tp3.longitude].sort((a, b) => a - b);
                const span = longitudes[2] - longitudes[0];
                const wrapAroundSpan = (longitudes[0] + 360) - longitudes[2];
                if (span < ORBS.conjunction || wrapAroundSpan < ORBS.conjunction) {
                    checkAndAddEvent('conjunction', combo, `Conjunction of ${p1}, ${p2}, and ${p3}.`);
                }
            }

            if (options.threePlanetAspect) {
                // Since Vedic aspects are not always mutual, we check both ways.
                const isConnected = (pName1, pLong1, pName2, pLong2) => {
                    const p1AspectsP2 = getVedicSignAspects(pName1, pLong1, pLong2).length > 0;
                    const p2AspectsP1 = getVedicSignAspects(pName2, pLong2, pLong1).length > 0;
                    return p1AspectsP2 || p2AspectsP1;
                };

                const connected12 = isConnected(p1, tp1.longitude, p2, tp2.longitude);
                const connected13 = isConnected(p1, tp1.longitude, p3, tp3.longitude);
                const connected23 = isConnected(p2, tp2.longitude, p3, tp3.longitude);

                if (connected12 && connected13 && connected23) {
                    checkAndAddEvent('aspect', combo, `${p1}, ${p2}, and ${p3} form a planetary configuration (Graha Drishti).`);
                }
            }

            if (options.threePlanetNatalReturn) {
                const np1 = natalPositions[p1];
                const np2 = natalPositions[p2];
                const np3 = natalPositions[p3];
                if (np1 && np2 && np3) {
                    const isReturn1 = isDegreeBasedConjunction(tp1.longitude, np1.longitude, ORBS.natalReturn);
                    const isReturn2 = isDegreeBasedConjunction(tp2.longitude, np2.longitude, ORBS.natalReturn);
                    const isReturn3 = isDegreeBasedConjunction(tp3.longitude, np3.longitude, ORBS.natalReturn);
                    if (isReturn1 && isReturn2 && isReturn3) {
                        checkAndAddEvent('natalReturn', combo, `Simultaneous natal return for ${p1}, ${p2}, and ${p3}.`);
                    }
                }
            }
        }

        if (options.threePlanetInHouses) {
            const planetsInHouses = selectedPlanets.filter(p => {
                const tp = transitingPositions[p];
                if (!tp) return false;
                const houseOfPlanet = getHouseOfPlanet(tp.longitude, natalHouseCusps);
                return selectedHouses.includes(houseOfPlanet);
            });

            if (planetsInHouses.length >= 3) {
                const combos = getCombinations(planetsInHouses, 3);
                combos.forEach(combo => {
                    const housePlacements = combo.map(p => ` ${p} in house ${getHouseOfPlanet(transitingPositions[p].longitude, natalHouseCusps)}`).join(',');
                    checkAndAddEvent('inHouses', combo, `Planets in selected houses:${housePlacements}.`);
                });
            }
        }

        if (options.threePlanetAspectingHouses) {
            const planetsAspectingHouses = [];
            for (const planet of selectedPlanets) {
                const tp = transitingPositions[planet];
                if (!tp) continue;
                for (const cuspDegrees of selectedNatalHouseCusps) {
                    if (getVedicSignAspects(planet, tp.longitude, cuspDegrees).length > 0) {
                        planetsAspectingHouses.push(planet);
                        break;
                    }
                }
            }

            if (planetsAspectingHouses.length >= 3) {
                const combos = getCombinations(planetsAspectingHouses, 3);
                combos.forEach(combo => {
                    const aspectsDetails = combo.map(p => {
                        const aspectedHouses = selectedHouses.filter(h_num => 
                            getVedicSignAspects(p, transitingPositions[p].longitude, natalHouseCusps[h_num - 1]).length > 0
                        );
                        if (aspectedHouses.length > 0) {
                            return `Planet ${p} aspects house(s) ${aspectedHouses.join(', ')}`;
                        }
                        return null;
                    }).filter(Boolean).join('; ');
                    checkAndAddEvent('aspectHouses', combo, `Aspects between planets and selected houses: ${aspectsDetails}.`);
                });
            }
        }

        currentDate.setHours(currentDate.getHours() + 1);
    }

    return results;
}
