// utils/doshaUtils.js
import logger from './logger.js';
import { normalizeAngle, getJulianDateUT } from './coreUtils.js';
import { getHouseOfPlanet, getNakshatraDetails, getMoonNakshatraEntryExitTimes, calculatePlanetaryPositions } from './planetaryUtils.js'; // Import necessary functions

/**
 * Calculates Mangal Dosha (Kuja Dosha).
 * Checks Mars' position in specific houses from Ascendant, Moon, and Venus.
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, ... }, ... }.
 * @param {number[]} siderealCuspStartDegrees - Array of 12 sidereal cusp start degrees.
 * @param {number} siderealAscendantDeg - Sidereal longitude of the Ascendant.
 * @returns {{ present: boolean, reason: string, cancellation: string[] }} Mangal Dosha details.
 */
export function calculateMangalDosha(siderealPositions, siderealCuspStartDegrees, siderealAscendantDeg) {
    const result = { present: false, reason: "", cancellation: [] };
    const doshaHouses = [1, 4, 7, 8, 12]; // Houses where Mars causes Dosha

    const marsData = siderealPositions?.Mars;
    const moonData = siderealPositions?.Moon;
    const venusData = siderealPositions?.Venus;

    if (!marsData || isNaN(marsData.longitude)) {
        logger.warn("Cannot calculate Mangal Dosha: Mars position unavailable.");
        result.reason = "Mars position unavailable.";
        return result;
    }
    if (isNaN(siderealAscendantDeg)) {
         logger.warn("Cannot calculate Mangal Dosha: Ascendant position unavailable.");
         result.reason = "Ascendant position unavailable.";
         return result;
    }
     if (!Array.isArray(siderealCuspStartDegrees) || siderealCuspStartDegrees.length !== 12 || siderealCuspStartDegrees.some(isNaN)) {
         logger.warn("Cannot calculate Mangal Dosha: Invalid house cusp data.");
         result.reason = "Invalid house cusp data.";
         return result;
     }


    // --- Check from Ascendant ---
    const houseFromAsc = getHouseOfPlanet(marsData.longitude, siderealCuspStartDegrees);
    if (houseFromAsc !== null && doshaHouses.includes(houseFromAsc)) {
        result.present = true;
        result.reason += `Mars in house ${houseFromAsc} from Ascendant. `;
    }

    // --- Check from Moon ---
    if (moonData && !isNaN(moonData.longitude)) {
        // Calculate houses relative to Moon's position (requires cusp rotation - complex)
        // Simplification: Check Rashi distance instead of Bhava Chalit houses from Moon
        const moonRashiIndex = Math.floor(normalizeAngle(moonData.longitude) / 30);
        const marsRashiIndex = Math.floor(normalizeAngle(marsData.longitude) / 30);
        let rashiDiffFromMoon = (marsRashiIndex - moonRashiIndex + 12) % 12;
        let houseNumFromMoon = rashiDiffFromMoon + 1; // Rashi count = House number (approx)

        if (doshaHouses.includes(houseNumFromMoon)) {
            result.present = true; // Mark present even if already found from Asc
            result.reason += `Mars in house ${houseNumFromMoon} (by Rashi count) from Moon. `;
        }
    } else {
        logger.warn("Mangal Dosha check from Moon skipped: Moon position unavailable.");
    }

    // --- Check from Venus ---
    if (venusData && !isNaN(venusData.longitude)) {
        // Simplification: Check Rashi distance instead of Bhava Chalit houses from Venus
        const venusRashiIndex = Math.floor(normalizeAngle(venusData.longitude) / 30);
        const marsRashiIndex = Math.floor(normalizeAngle(marsData.longitude) / 30);
        let rashiDiffFromVenus = (marsRashiIndex - venusRashiIndex + 12) % 12;
        let houseNumFromVenus = rashiDiffFromVenus + 1; // Rashi count = House number (approx)

        if (doshaHouses.includes(houseNumFromVenus)) {
            result.present = true; // Mark present even if already found
            result.reason += `Mars in house ${houseNumFromVenus} (by Rashi count) from Venus. `;
        }
    } else {
        logger.warn("Mangal Dosha check from Venus skipped: Venus position unavailable.");
    }

    // --- Check for Cancellations (Simplified examples) ---
    if (result.present && houseFromAsc !== null) {
        const marsRashi = marsData.rashi;
        const marsRashiLord = marsData.rashiLord;

        // 1. Mars in own sign (Aries, Scorpio)
        if (marsRashi === "Aries" || marsRashi === "Scorpio") {
            result.cancellation.push("Mars is in its own sign (" + marsRashi + ").");
        }
        // 2. Mars in exaltation sign (Capricorn)
        else if (marsRashi === "Capricorn") {
            result.cancellation.push("Mars is exalted in Capricorn.");
        }
        // 3. Mars in Leo or Cancer? (Some schools)
        else if (marsRashi === "Leo" || marsRashi === "Cancer") {
             // result.cancellation.push(`Mars is in ${marsRashi}.`); // Less common cancellation
        }
        // 4. Mars aspected by Jupiter or Saturn? (Requires aspect calculation)
        // Needs access to full aspect data here.

        // 5. Mars in specific houses for certain Ascendants (e.g., Mars in Aries for Aries Ascendant is house 1 - dosha, but cancelled as own sign)
        // This is covered by rule 1 generally.

        // 6. If Mars is in 7th house in Cancer or Capricorn (Debilitated/Exalted)
        if (houseFromAsc === 7 && (marsRashi === "Cancer" || marsRashi === "Capricorn")) {
             result.cancellation.push(`Mars is in 7th house in ${marsRashi}.`);
        }
         // 7. If Mars is in 8th house in Sagittarius or Pisces (Jupiter's signs)
         if (houseFromAsc === 8 && (marsRashi === "Sagittarius" || marsRashi === "Pisces")) {
             result.cancellation.push("Mars is in 8th house in a sign of Jupiter.");
         }
         // 8. If Mars is in 12th house in Taurus or Libra (Venus' signs)
         if (houseFromAsc === 12 && (marsRashi === "Taurus" || marsRashi === "Libra")) {
             result.cancellation.push("Mars is in 12th house in a sign of Venus.");
         }
         // 9. If Mars is in 4th house in Aries or Scorpio (Own signs)
         if (houseFromAsc === 4 && (marsRashi === "Aries" || marsRashi === "Scorpio")) {
             // Covered by rule 1
         }
         // 10. If Mars is in 1st house in Aries (Own sign)
         if (houseFromAsc === 1 && marsRashi === "Aries") {
              // Covered by rule 1
         }


        // If any cancellation applies, potentially negate the 'present' status based on rules
        if (result.cancellation.length > 0) {
            // Decide if cancellation fully negates the dosha. Often it just reduces intensity.
            // For simplicity here, we'll keep 'present' as true but list cancellations.
            // result.present = false; // Uncomment if cancellation means dosha is fully nullified
        }
    }

    if (!result.present) {
        result.reason = "Mars not found in dosha-causing houses (1, 4, 7, 8, 12) from Ascendant, Moon, or Venus.";
    }

    result.reason = result.reason.trim(); // Clean up trailing space
    return result;
}

/**
 * Calculates Kaalsarpa Dosha/Yoga.
 * Checks if all planets are hemmed between Rahu and Ketu axis.
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, ... }, ... }.
 * @returns {{ present: boolean, type: string, reason: string }} Kaalsarpa details. Type can be 'Anant', 'Kulik', etc. or 'Partial'/'None'.
 */
export function calculateKaalsarpaDosha(siderealPositions) {
    const result = { present: false, type: "None", reason: "" };
    const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // Core planets

    const rahuData = siderealPositions?.Rahu;
    const ketuData = siderealPositions?.Ketu;

    if (!rahuData || isNaN(rahuData.longitude) || !ketuData || isNaN(ketuData.longitude)) {
        logger.warn("Cannot calculate Kaalsarpa Dosha: Rahu/Ketu position unavailable.");
        result.reason = "Rahu/Ketu position unavailable.";
        return result;
    }

    const rahuLon = normalizeAngle(rahuData.longitude);
    const ketuLon = normalizeAngle(ketuData.longitude);

    let allPlanetsInHemisphere = true;
    let hemisphereStart = rahuLon; // Check Rahu -> Ketu direction first
    let hemisphereEnd = ketuLon;
    let direction = 'Rahu->Ketu';

    for (const planetName of planets) {
        const planetData = siderealPositions[planetName];
        if (!planetData || isNaN(planetData.longitude)) {
            logger.warn(`Kaalsarpa check skipped planet ${planetName}: Position unavailable.`);
            continue; // Skip if planet data is missing
        }
        const planetLon = normalizeAngle(planetData.longitude);

        // Check if planet is within the Rahu -> Ketu arc
        let isInArc;
        if (hemisphereStart < hemisphereEnd) { // Normal case e.g. Rahu 30, Ketu 210
            isInArc = planetLon >= hemisphereStart && planetLon <= hemisphereEnd;
        } else { // Wrap around case e.g. Rahu 330, Ketu 150
            isInArc = planetLon >= hemisphereStart || planetLon <= hemisphereEnd;
        }

        if (!isInArc) {
            allPlanetsInHemisphere = false;
            break; // Found a planet outside this arc
        }
    }

    // If not all planets were in Rahu->Ketu, check Ketu->Rahu direction
    if (!allPlanetsInHemisphere) {
        allPlanetsInHemisphere = true; // Reset flag
        hemisphereStart = ketuLon;
        hemisphereEnd = rahuLon;
        direction = 'Ketu->Rahu';

        for (const planetName of planets) {
            const planetData = siderealPositions[planetName];
             if (!planetData || isNaN(planetData.longitude)) continue; // Skip missing planets
            const planetLon = normalizeAngle(planetData.longitude);

            let isInArc;
            if (hemisphereStart < hemisphereEnd) {
                isInArc = planetLon >= hemisphereStart && planetLon <= hemisphereEnd;
            } else {
                isInArc = planetLon >= hemisphereStart || planetLon <= hemisphereEnd;
            }

            if (!isInArc) {
                allPlanetsInHemisphere = false;
                break; // Found a planet outside this arc too
            }
        }
    }

    // Determine result
    if (allPlanetsInHemisphere) {
        result.present = true;
        result.reason = `All planets (Sun to Saturn) are located between ${direction}.`;

        // Determine specific type based on Rahu's house (requires house calculation)
        // This needs siderealCuspStartDegrees passed in or calculated here.
        // Example: If Rahu is in House 1 -> Anant, House 2 -> Kulik, etc.
        // const rahuHouse = getHouseOfPlanet(rahuLon, siderealCuspStartDegrees);
        // Add logic here to set result.type based on rahuHouse if cusps are available.
        result.type = "Complete (Type Undetermined - Needs House Info)"; // Placeholder type

    } else {
        result.present = false;
        result.reason = "Planets are found on both sides of the Rahu-Ketu axis.";
        result.type = "None";
    }

    // Add check for partial Kaalsarpa (e.g., only one planet outside) - Optional

    return result;
}

/**
 * Checks for Gand Mool Dosha based on Moon's Nakshatra.
 * @param {object} siderealPositions - Object containing sidereal positions { Sun: { longitude, ... }, ... }.
 * @returns {{ present: boolean, nakshatra: string, reason: string }} Mool Dosha details.
 */
export async function calculateMoolDosha(dateString, latitude, longitude, siderealPositions, sunrise, nextSunrise) {
    const result = { present: false, nakshatra: "", reason: "Calculation could not be completed.", start: null, end: null };
    const moolNakshatras = ["Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Mula", "Revati"];

    const moonData = siderealPositions?.Moon;

    if (!moonData) {
        logger.warn("Cannot calculate Mool Dosha: Moon data object is null or undefined.");
        result.reason = "Moon data object unavailable.";
        return result;
    }

    if (moonData.longitude === undefined || isNaN(moonData.longitude)) {
        logger.warn(`Cannot calculate Mool Dosha: Moon longitude is invalid. MoonData: ${JSON.stringify(moonData)}`);
        result.reason = "Moon position unavailable (invalid longitude).";
        return result;
    }

    const moonNakDetails = getNakshatraDetails(moonData.longitude);

    if (!moonNakDetails || moonNakDetails.index === -1) {
        result.reason = "Could not determine Moon's Nakshatra.";
        return result;
    }

    result.nakshatra = moonNakDetails.name;

    // If sunrise/nextSunrise are not available, we can still determine if the dosha is present,
    // but not its start/end time. This makes the function more robust.
    if (!sunrise || !nextSunrise || !sunrise.isValid() || !nextSunrise.isValid()) {
        logger.warn(`Sunrise/NextSunrise not available for Mool Dosha start/end calculation on ${dateString}`);
        if (moolNakshatras.includes(moonNakDetails.name)) {
            result.present = true;
            result.reason = `Moon is in ${moonNakDetails.name}, which is a Gand Mool Nakshatra. Start/end times unavailable.`;
        } else {
            result.present = false;
            result.reason = `Moon is in ${moonNakDetails.name}, which is not a Gand Mool Nakshatra.`;
        }
        return result;
    }

    // Get Moon's Nakshatra at sunrise and next sunrise
    const { julianDayUT: sunriseJD, momentLocal } = getJulianDateUT(sunrise.toISOString(), latitude, longitude);
    const sunriseMoonLng = (await calculatePlanetaryPositions(sunriseJD))?.sidereal?.Moon?.longitude;
    const sunriseNakshatraName = sunriseMoonLng !== undefined && !isNaN(sunriseMoonLng) ? getNakshatraDetails(sunriseMoonLng).name : null;

    const { julianDayUT: nextSunriseJD, momentLocal } = getJulianDateUT(nextSunrise.toISOString(), latitude, longitude);
    const nextSunriseMoonLng = (await calculatePlanetaryPositions(nextSunriseJD))?.sidereal?.Moon?.longitude;
    const nextSunriseNakshatraName = nextSunriseMoonLng !== undefined && !isNaN(nextSunriseMoonLng) ? getNakshatraDetails(nextSunriseMoonLng).name : null;

    const isMoolAtSunrise = moolNakshatras.includes(sunriseNakshatraName);
    const isMoolAtNextSunrise = moolNakshatras.includes(nextSunriseNakshatraName);

    if (moolNakshatras.includes(moonNakDetails.name) || isMoolAtSunrise || isMoolAtNextSunrise) {
        result.present = true;
        result.reason = `Moon is in ${moonNakDetails.name}, which is a Gand Mool Nakshatra.`;

        let finalEntryTime = null;
        let finalExitTime = null;

        if (isMoolAtSunrise) {
            finalEntryTime = sunrise.toISOString();
        } else {
            const { entryTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, moonNakDetails.index, sunrise, nextSunrise);
            finalEntryTime = entryTime;
        }

        if (isMoolAtNextSunrise) {
            finalExitTime = nextSunrise.toISOString();
        } else {
            const { exitTime } = await getMoonNakshatraEntryExitTimes(dateString, latitude, longitude, moonNakDetails.index, sunrise, nextSunrise);
            finalExitTime = exitTime;
        }

        result.start = finalEntryTime;
        result.end = finalExitTime;

        // Further refinement: Check Pada for intensity (e.g., last pada of water signs, first pada of fire signs)
        // const pada = calculateNakshatraPada(moonData.longitude);
        // Add logic here based on Nakshatra and Pada if needed.
    } else {
        result.present = false;
        result.reason = `Moon is in ${moonNakDetails.name}, which is not a Gand Mool Nakshatra.`;
    }

    return result;
}
