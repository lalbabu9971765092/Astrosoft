// routes/predictionRoutes.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { addDays } from 'date-fns';
import logger from '../utils/logger.js';

// --- Import all required calculation utilities ---
import {
    getJulianDateUT,
    calculateAyanamsa,
    calculateHousesAndAscendant,
    calculatePlanetaryPositions,
    calculateVimshottariDashas,
    calculateVimshottariBalance,
    normalizeAngle,
    PLANET_ORDER,
    getHouseOfPlanet,
    getHousesRuledByPlanet,
    calculateAspects,
} from '../utils/index.js';

const router = express.Router();

// --- KP Event Rules Database ---
const KP_EVENT_RULES = {
    'marriage': {
        primaryCusp: 7,
        supportingHouses: [2, 7, 11],
        negatingHouses: [1, 6, 10]
    },
    'job_promotion': {
        primaryCusp: 10,
        supportingHouses: [2, 6, 10, 11],
        negatingHouses: [5, 8, 9]
    },
    'foreign_travel': {
        primaryCusp: 12,
        supportingHouses: [3, 9, 12],
        negatingHouses: [2, 4, 11]
    },
    'property_purchase': {
        primaryCusp: 4,
        supportingHouses: [4, 11, 12],
        negatingHouses: [3, 8]
    }
};

// --- Astrological Constants ---
const PLANETARY_ASPECTS = { // 7th aspect is universal
    'Sun': [7], 'Moon': [7], 'Mercury': [7], 'Venus': [7],
    'Mars': [4, 7, 8], 'Jupiter': [5, 7, 9], 'Saturn': [3, 7, 10],
    'Rahu': [5, 7, 9], 'Ketu': [5, 7, 9]
};

// --- Helper Functions ---

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
        logger.warn(`No valid position data found for entity: ${entityName}`);
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

function calculateAllKPSignificators(siderealPositions, siderealCuspStartDegrees) {
    const aspects = calculateAspects(siderealPositions);
    const planetHousePlacements = {};
    PLANET_ORDER.forEach(pName => {
        const pData = siderealPositions[pName];
        if (pData && typeof pData.longitude === 'number' && !isNaN(pData.longitude)) {
            planetHousePlacements[pName] = getHouseOfPlanet(pData.longitude, siderealCuspStartDegrees);
        }
    });

    const kpSignificatorsDetailed = [];
    PLANET_ORDER.forEach(planetName => {
        const planetInfo = siderealPositions[planetName];
        const nakLordName = planetInfo?.nakLord;
        const subLordName = planetInfo?.subLord;

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

        const planetData = getEntitySignifications(planetName, siderealPositions, siderealCuspStartDegrees, associatedPlanets);
        
        let nakshatraLord = { name: nakLordName || "N/A" };
        if (nakLordName && nakLordName !== "N/A" && nakLordName !== "Error") {
             const nlAspects = aspects[nakLordName] || [];
             nakshatraLord = getEntitySignifications(nakLordName, siderealPositions, siderealCuspStartDegrees, nlAspects);
        }

        let subLord = { name: subLordName || "N/A" };
        if (subLordName && subLordName !== "N/A" && subLordName !== "Error") {
             const slAspects = aspects[subLordName] || [];
             subLord = getEntitySignifications(subLordName, siderealPositions, siderealCuspStartDegrees, slAspects);
        }

        kpSignificatorsDetailed.push({ ...planetData, nakshatraLord, subLord });
    });
    return kpSignificatorsDetailed;
}

function getFullSignifications(planetName, kpSignificatorsData) {
    const sigs = new Set();
    const planetSigs = kpSignificatorsData.find(p => p.name === planetName);
    if (!planetSigs) return [];

    // Combine all significations from the planet and its Nakshatra Lord
    [
        planetSigs.occupiedHouses, planetSigs.ownedHouses, planetSigs.signLordOwnedHouses, planetSigs.aspectingOwnedHouses,
        planetSigs.nakshatraLord?.occupiedHouses, planetSigs.nakshatraLord?.ownedHouses,
        planetSigs.nakshatraLord?.signLordOwnedHouses, planetSigs.nakshatraLord?.aspectingOwnedHouses
    ].forEach(s => {
        if (s) s.split(',').forEach(h => h.trim() && sigs.add(parseInt(h, 10)));
    });

    return Array.from(sigs).sort((a, b) => a - b);
}

function planetSignifiesEvent(planetName, eventRules, kpSignificatorsData) {
    if (!planetName || planetName === 'N/A' || planetName === 'Error') return false;
    const significations = getFullSignifications(planetName, kpSignificatorsData);
    return significations.some(sig => eventRules.supportingHouses.includes(sig));
}

function isWithinOrb(pos1, pos2, orb) {
    const diff = Math.abs(pos1 - pos2);
    return Math.min(diff, 360 - diff) <= orb;
}

// --- Route: /time-event (Pinpoint Date) ---
router.post('/time-event', [
    body('eventType').isIn(Object.keys(KP_EVENT_RULES)).withMessage('Invalid event type specified.'),
    body('date').isISO8601().withMessage('Invalid date format.'),
    body('latitude').isFloat({ min: -90, max: 90 }).toFloat(),
    body('longitude').isFloat({ min: -180, max: 180 }).toFloat(),
    body('searchRangeInDays').optional().isInt({ min: 1, max: 3650 }).toInt().withMessage('Search range must be between 1 and 3650 days.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { eventType, date, latitude, longitude, searchRangeInDays = 180 } = req.body;
        const eventRules = KP_EVENT_RULES[eventType];
        logger.info(`Timing event '${eventType}' for date=${date}, range=${searchRangeInDays} days`);

        // --- Step 1: Calculate Natal Chart Data ---
        const { julianDayUT: natalJD, utcDate: natalUTCDate } = getJulianDateUT(date, latitude, longitude);
        if (!natalJD) throw new Error("Failed to calculate natal Julian Day.");

        const natalAyanamsa = calculateAyanamsa(natalJD);
        const { tropicalCusps: natalTropicalCusps } = calculateHousesAndAscendant(natalJD, latitude, longitude);
        if (!natalTropicalCusps) throw new Error("Failed to calculate natal house cusps.");

        const natalSiderealCusps = natalTropicalCusps.map(c => normalizeAngle(c - natalAyanamsa));
        const natalPositions = calculatePlanetaryPositions(natalJD).sidereal;

        // --- Step 2: Calculate Natal KP Significators ---
        const kpSignificatorsData = calculateAllKPSignificators(natalPositions, natalSiderealCusps);

        // --- Step 3: Find Favorable Dasha Periods ---
        const dashaBalance = calculateVimshottariBalance(natalPositions['Moon']?.longitude);
        const allDashaPeriods = calculateVimshottariDashas(new Date(), dashaBalance, searchRangeInDays);

        const favorablePeriods = [];
        // Filter for only Pratyantar Dashas (level 3) as they contain all parent info
        const pratyantarDashas = allDashaPeriods.filter(p => p.level === 3);

        pratyantarDashas.forEach(ad => {
            const dashaLord = ad.mahaLord;
            const bhuktiLord = ad.antarLord;
            const antaraLord = ad.lord;

            // RULE: Event should be allowed by Dasha, Bhukti, and Antar lord.
            if (dashaLord && bhuktiLord && antaraLord &&
                planetSignifiesEvent(dashaLord, eventRules, kpSignificatorsData) &&
                planetSignifiesEvent(bhuktiLord, eventRules, kpSignificatorsData) &&
                planetSignifiesEvent(antaraLord, eventRules, kpSignificatorsData))
            {
                favorablePeriods.push({
                    dashaLord, bhuktiLord, antaraLord,
                    start: ad.start,
                    end: ad.end
                });
            }
        });

        if (favorablePeriods.length === 0) {
            return res.json({ message: "No favorable Dasha periods found in the specified range.", potentialDates: [] });
        }

        // --- Step 4: Scan Favorable Periods for Transit Triggers (OPTIMIZED) ---
        const potentialDates = [];
        const foundDates = new Set(); // Use a Set to track dates that have already been added

        for (const period of favorablePeriods) {
            const { dashaLord, bhuktiLord, antaraLord } = period;
            const dashaLords = [dashaLord, bhuktiLord, antaraLord];

            let currentDate = new Date(period.start);
            const endDate = new Date(period.end);

            // This will store the house placements from the previously checked day for optimization
            let lastDayHousePlacements = {};

            while (currentDate <= endDate) {
                const currentDateString = currentDate.toISOString().split('T')[0];

                // Skip if we already found a trigger for this date to avoid redundant calculations
                if (foundDates.has(currentDateString)) {
                    currentDate = addDays(currentDate, 1);
                    continue;
                }

                const { julianDayUT: transitJD } = getJulianDateUT(currentDate.toISOString(), latitude, longitude);
                if (!transitJD) {
                    currentDate = addDays(currentDate, 1);
                    continue;
                }

                const transitPositions = calculatePlanetaryPositions(transitJD).sidereal;

                // --- OPTIMIZATION: Check for house changes before running expensive checks ---
                const currentDayHousePlacements = {};
                let houseChanged = false;
                dashaLords.forEach(lord => {
                    const lordPos = transitPositions[lord]?.longitude;
                    if (lordPos !== undefined) {
                        const house = getHouseOfPlanet(lordPos, natalSiderealCusps);
                        currentDayHousePlacements[lord] = house;
                        // Check if the house is different from the last checked day
                        if (lastDayHousePlacements[lord] !== house) {
                            houseChanged = true;
                        }
                    }
                });

                let triggerReason = null;

                // --- Run expensive house-based checks ONLY if a house has changed ---
                if (houseChanged) {
                    const transitAspects = calculateAspects(transitPositions); // Only calculate aspects when needed

                    // RULE: Conjunction of Dasha Lords
                    if (currentDayHousePlacements[dashaLord] && currentDayHousePlacements[dashaLord] === currentDayHousePlacements[bhuktiLord] && currentDayHousePlacements[bhuktiLord] === currentDayHousePlacements[antaraLord]) {
                        triggerReason = `Dasha lords (${dashaLord}, ${bhuktiLord}, ${antaraLord}) conjoin in house ${currentDayHousePlacements[dashaLord]}.`;
                    }

                    // RULE: Mutual Aspect between Dasha Lords
                    if (!triggerReason) {
                        const pairs = [[dashaLord, bhuktiLord], [dashaLord, antaraLord], [bhuktiLord, antaraLord]];
                        for (const [p1, p2] of pairs) {
                            const p1House = currentDayHousePlacements[p1];
                            const p2House = currentDayHousePlacements[p2];
                            const p1Aspects = transitAspects[p1] || [];
                            const p2Aspects = transitAspects[p2] || [];
                            if ((p1House && p2Aspects.includes(p1House)) || (p2House && p1Aspects.includes(p2House))) {
                                triggerReason = `Mutual aspect between transiting ${p1} and ${p2}.`;
                                break;
                            }
                        }
                    }

                    // RULE: Transit over significator house or aspect them
                    if (!triggerReason) {
                        for (const lord of dashaLords) {
                            const lordTransitHouse = currentDayHousePlacements[lord];
                            const lordTransitAspects = transitAspects[lord] || [];
                            if (lordTransitHouse && eventRules.supportingHouses.includes(lordTransitHouse)) {
                                triggerReason = `Transiting ${lord} is in significator house ${lordTransitHouse}.`;
                                break;
                            }
                            if (lordTransitAspects.some(h => eventRules.supportingHouses.includes(h))) {
                                const aspectedHouse = lordTransitAspects.find(h => eventRules.supportingHouses.includes(h));
                                triggerReason = `Transiting ${lord} aspects significator house ${aspectedHouse}.`;
                                break;
                            }
                        }
                    }
                }

                // RULE: Transit over their natal position (This is cheap, check every day)
                if (!triggerReason) {
                    for (const lord of dashaLords) {
                        const natalPos = natalPositions[lord]?.longitude;
                        const transitPos = transitPositions[lord]?.longitude;
                        if (natalPos !== undefined && transitPos !== undefined && isWithinOrb(transitPos, natalPos, 2)) {
                             triggerReason = `Transiting ${lord} is on its natal position.`;
                             break;
                        }
                    }
                }

                if (triggerReason) {
                    if (!foundDates.has(currentDateString)) {
                        potentialDates.push({
                            date: currentDateString,
                            reason: triggerReason,
                            dashaPeriod: `${dashaLord} / ${bhuktiLord} / ${antaraLord}`
                        });
                        foundDates.add(currentDateString); // Mark this date as found
                    }
                }

                lastDayHousePlacements = currentDayHousePlacements; // Update for the next day's comparison
                currentDate = addDays(currentDate, 1);
            }
        }

        // Remove duplicate dates, keeping the first reason found
        const uniquePotentialDates = Array.from(new Map(potentialDates.map(item => [item.date, item])).values());

        res.json({
            predictionInput: { eventType, birthDate: date, searchRangeInDays },
            eventRules: eventRules,
            potentialDates: uniquePotentialDates
        });

    } catch (error) {
        logger.error(`Error in /predictions/time-event route: ${error.message}`, { error: error.stack || error });
        res.status(500).json({ error: error.message || "An internal server error occurred." });
    }
});

export default router;
