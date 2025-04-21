// utils/dashaUtils.js
import logger from './logger.js';
import {
    NAKSHATRAS, NAKSHATRA_SPAN, VIMS_DASHA_YEARS, VIMS_DASHA_SEQUENCE,
    MUDDA_DASHA_SEQUENCE, MUDDA_DASHA_YEARS, MUDDA_TOTAL_YEARS,
    DEFAULT_DASHA_BALANCE
} from './constants.js';
import { normalizeAngle, getJulianDateUT } from './coreUtils.js';
import { getNakshatraDetails, calculatePlanetaryPositions } from './planetaryUtils.js'; // Import necessary functions

/**
 * Calculates the Vimshottari Dasha balance at birth based on Moon's longitude.
 * @param {number} moonSiderealLongitude - Moon's sidereal longitude in decimal degrees.
 * @returns {object} Dasha balance object { lord, balanceYears, balanceYMD: { years, months, days } } or default error object.
 */
export function calculateVimshottariBalance(moonSiderealLongitude) {
    const normalizedLng = normalizeAngle(moonSiderealLongitude);
    if (isNaN(normalizedLng)) {
        throw new Error(`Cannot calculate Dasha Balance: Invalid Moon longitude (${moonSiderealLongitude}).`);
    }

    const nakDetails = getNakshatraDetails(normalizedLng);
    if (!nakDetails || nakDetails.index === -1 || !nakDetails.lord || nakDetails.lord === "N/A") {
         throw new Error(`Cannot calculate Dasha Balance: Could not determine valid Nakshatra Lord for Moon longitude ${normalizedLng}.`);
    }

    const dashaLord = nakDetails.lord;
    const totalDashaYears = VIMS_DASHA_YEARS[dashaLord];
    if (!totalDashaYears) {
        throw new Error(`Cannot calculate Dasha Balance: Invalid Dasha Lord "${dashaLord}" or missing years definition.`);
    }

    const nakshatraStartIndex = nakDetails.index;
    const nakshatraStartDegree = nakshatraStartIndex * NAKSHATRA_SPAN;
    const moonPositionInNakshatra = normalizeAngle(normalizedLng - nakshatraStartDegree);

    // Calculate proportion of Nakshatra traversed
    const proportionTraversed = moonPositionInNakshatra / NAKSHATRA_SPAN;
    const proportionRemaining = 1 - proportionTraversed;

    const balanceYearsDecimal = proportionRemaining * totalDashaYears;

    // Convert decimal years to Years, Months, Days
    const totalDays = balanceYearsDecimal * 365.25; // Approximate using average year length
    const years = Math.floor(balanceYearsDecimal);
    const remainingDaysAfterYears = totalDays - (years * 365.25);
    const months = Math.floor(remainingDaysAfterYears / (365.25 / 12));
    const remainingDaysAfterMonths = remainingDaysAfterYears - (months * (365.25 / 12));
    const days = Math.round(remainingDaysAfterMonths); // Round the final days

    // Adjust for potential rounding issues (e.g., 12 months -> 1 year)
    let finalYears = years;
    let finalMonths = months;
    let finalDays = days;

    if (finalDays >= 30) { // Approximate month length
        finalMonths += Math.floor(finalDays / 30);
        finalDays %= 30;
    }
    if (finalMonths >= 12) {
        finalYears += Math.floor(finalMonths / 12);
        finalMonths %= 12;
    }

    return {
        lord: dashaLord,
        balanceYears: balanceYearsDecimal,
        balanceYMD: {
            years: finalYears,
            months: finalMonths,
            days: finalDays
        }
    };
}

/**
 * Calculates Vimshottari Dasha periods starting from a given birth date and balance.
 * @param {Date} birthDateUTC - The UTC birth date object.
 * @param {object} dashaBalance - The balance object from calculateVimshottariBalance.
 * @param {number} [totalYearsToCalculate=120] - How many years of Dasha periods to calculate.
 * @returns {object[]} Array of Dasha period objects { level, lord, start, end }.
 */
export function calculateVimshottariDashas(birthDateUTC, dashaBalance, totalYearsToCalculate = 120) {
    if (!(birthDateUTC instanceof Date) || isNaN(birthDateUTC.getTime())) {
        throw new Error("Invalid birthDateUTC provided for Dasha calculation.");
    }
    if (!dashaBalance || !dashaBalance.lord || isNaN(dashaBalance.balanceYears) || dashaBalance.lord === "Error") {
        throw new Error("Invalid dashaBalance provided for Dasha calculation.");
    }

    const allPeriods = [];
    let currentStartDate = new Date(birthDateUTC.getTime());

    // --- 1. Add the remaining balance period ---
    const firstLord = dashaBalance.lord;
    const balanceDurationMillis = dashaBalance.balanceYears * 365.25 * 24 * 60 * 60 * 1000;
    const firstEndDate = new Date(currentStartDate.getTime() + balanceDurationMillis);

    allPeriods.push({
        level: 1, // Maha Dasha
        lord: firstLord,
        start: currentStartDate.toISOString(),
        end: firstEndDate.toISOString()
    });

    // --- 2. Calculate subsequent Maha Dashas ---
    let currentLordIndex = VIMS_DASHA_SEQUENCE.indexOf(firstLord);
    if (currentLordIndex === -1) {
        throw new Error(`Dasha balance lord "${firstLord}" not found in sequence.`);
    }

    let yearsCalculated = dashaBalance.balanceYears;
    currentStartDate = firstEndDate; // Start next period after the balance ends

    while (yearsCalculated < totalYearsToCalculate) {
        currentLordIndex = (currentLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
        const currentLord = VIMS_DASHA_SEQUENCE[currentLordIndex];
        const currentDashaYears = VIMS_DASHA_YEARS[currentLord];

        if (!currentDashaYears) {
             logger.warn(`Years not defined for Dasha lord: ${currentLord}. Skipping.`);
             continue; // Skip if years are missing
        }

        const durationMillis = currentDashaYears * 365.25 * 24 * 60 * 60 * 1000;
        const currentEndDate = new Date(currentStartDate.getTime() + durationMillis);

        allPeriods.push({
            level: 1,
            lord: currentLord,
            start: currentStartDate.toISOString(),
            end: currentEndDate.toISOString()
        });

        // --- 3. Calculate Bhukti (Antar Dasha) periods within this Maha Dasha ---
        let bhuktiStartDate = new Date(currentStartDate.getTime());
        let bhuktiLordIndex = currentLordIndex; // Bhuktis start from the Maha Dasha lord

        for (let i = 0; i < VIMS_DASHA_SEQUENCE.length; i++) {
            const bhuktiLord = VIMS_DASHA_SEQUENCE[bhuktiLordIndex];
            const bhuktiTotalYears = VIMS_DASHA_YEARS[bhuktiLord];
            if (!bhuktiTotalYears) continue; // Skip if years missing

            // Bhukti duration is proportional: (MD Years * Bhukti Years) / 120
            const bhuktiDurationYears = (currentDashaYears * bhuktiTotalYears) / 120;
            const bhuktiDurationMillis = bhuktiDurationYears * 365.25 * 24 * 60 * 60 * 1000;
            const bhuktiEndDate = new Date(bhuktiStartDate.getTime() + bhuktiDurationMillis);

            allPeriods.push({
                level: 2, // Bhukti (Antar Dasha)
                mahaLord: currentLord, // Parent lord
                lord: bhuktiLord,
                start: bhuktiStartDate.toISOString(),
                end: bhuktiEndDate.toISOString()
            });

            // --- 4. Calculate Pratyantar Dasha (Level 3) - Optional ---
            // Add similar logic here if needed, calculating duration proportionally within Bhukti
            // Pratyantar duration = (Bhukti Duration Years * Pratyantar Years) / 120

            bhuktiStartDate = bhuktiEndDate; // Move to next Bhukti start
            bhuktiLordIndex = (bhuktiLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
        }
        // --- End Bhukti Calculation ---

        yearsCalculated += currentDashaYears;
        currentStartDate = currentEndDate; // Move to next Maha Dasha start
    }

    // Sort by start date just in case
    allPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));

    return allPeriods;
}


/**
 * Calculates Mudda Dasha periods for a given Solar Return year.
 * @param {number} solarReturnJD_UT - Julian Day (UT) of the Solar Return moment.
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {object[]} Array of Mudda Dasha period objects { lord, start, end }.
 */
export function calculateMuddaDasha(solarReturnJD_UT, latitude, longitude) {
    if (isNaN(solarReturnJD_UT) || isNaN(latitude) || isNaN(longitude)) {
        throw new Error(`Invalid input for calculateMuddaDasha: JD=${solarReturnJD_UT}, Lat=${latitude}, Lon=${longitude}`);
    }

    try {
        // 1. Determine the starting lord based on the Moon's Nakshatra at SR
        const srPositions = calculatePlanetaryPositions(solarReturnJD_UT);
        const srMoonLon = srPositions?.sidereal?.Moon?.longitude;
        if (srMoonLon === undefined || isNaN(srMoonLon)) {
            throw new Error("Cannot calculate Mudda Dasha: Solar Return Moon longitude is invalid.");
        }

        const srNakDetails = getNakshatraDetails(srMoonLon);
        if (!srNakDetails || srNakDetails.index === -1) {
            throw new Error("Cannot calculate Mudda Dasha: Could not determine Solar Return Moon Nakshatra.");
        }
        const srNakshatraIndex = srNakDetails.index;

        // Calculate the starting index in the Mudda sequence
        // Formula: (Nakshatra Index at SR + Age at SR - 1) % 9 (using 9 lords: 7 planets + Rahu + Ketu?)
        // Let's use the Vimshottari lord sequence index for simplicity, mapping to Mudda sequence
        const vimsLord = srNakDetails.lord;
        const vimsStartIndex = VIMS_DASHA_SEQUENCE.indexOf(vimsLord);
        if (vimsStartIndex === -1) {
             throw new Error(`Cannot determine starting Mudda lord: Invalid Vims lord "${vimsLord}"`);
        }
        // Map Vims index to Mudda index (Note: Mudda sequence might differ, this is an approximation)
        // This mapping needs verification based on specific Mudda rules. Assuming direct mapping for now.
        let muddaStartIndex = vimsStartIndex % MUDDA_DASHA_SEQUENCE.length; // Simple modulo mapping

        // Alternative: Find the weekday lord of SR start? Rules vary.
        // const srUTCDate = new Date((solarReturnJD_UT - 2440587.5) * 86400000);
        // const srWeekday = srUTCDate.getUTCDay(); // 0=Sun, 6=Sat
        // const startingLord = WEEKDAY_LORDS[srWeekday];
        // muddaStartIndex = MUDDA_DASHA_SEQUENCE.indexOf(startingLord);
        // if (muddaStartIndex === -1) throw new Error(`Weekday lord ${startingLord} not in Mudda sequence.`);


        // 2. Calculate Dasha periods
        const muddaPeriods = [];
        const solarReturnStartDate = new Date((solarReturnJD_UT - 2440587.5) * 86400000);
        let currentStartDate = new Date(solarReturnStartDate.getTime());
        const totalSolarYearDays = 365.2425; // More precise average solar year length

        for (let i = 0; i < MUDDA_DASHA_SEQUENCE.length; i++) {
            const lordIndex = (muddaStartIndex + i) % MUDDA_DASHA_SEQUENCE.length;
            const currentLord = MUDDA_DASHA_SEQUENCE[lordIndex];
            const dashaYearsProportion = MUDDA_DASHA_YEARS[currentLord];

            if (!dashaYearsProportion) {
                logger.warn(`Mudda Dasha years not defined for lord: ${currentLord}. Skipping.`);
                continue;
            }

            // Duration in days = (Dasha Years / Total Mudda Years Cycle) * Solar Year Days
            // Note: Mudda cycle length (120 or 113?) and calculation method can vary. Using 120 for Vimshottari proportion.
            const durationDays = (dashaYearsProportion / 120) * totalSolarYearDays;
            const durationMillis = durationDays * 24 * 60 * 60 * 1000;
            const currentEndDate = new Date(currentStartDate.getTime() + durationMillis);

            muddaPeriods.push({
                lord: currentLord,
                start: currentStartDate.toISOString(),
                end: currentEndDate.toISOString(),
                durationDays: durationDays.toFixed(2)
            });

            currentStartDate = currentEndDate; // Move to next period start
        }

        // Sort just in case calculation order wasn't sequential
        muddaPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));

        return muddaPeriods;

    } catch (error) {
        logger.error(`Error calculating Mudda Dasha for SR JD ${solarReturnJD_UT}: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Mudda Dasha: ${error.message}`); // Re-throw
    }
}
