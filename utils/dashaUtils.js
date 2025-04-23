// utils/dashaUtils.js
import logger from './logger.js';
import {
    NAKSHATRAS, NAKSHATRA_SPAN, VIMS_DASHA_YEARS, VIMS_DASHA_SEQUENCE,
    MUDDA_DASHA_SEQUENCE, MUDDA_DASHA_YEARS, MUDDA_TOTAL_YEARS,
    DEFAULT_DASHA_BALANCE
} from './constants.js';
import { normalizeAngle, getJulianDateUT } from './coreUtils.js';
import { getNakshatraDetails, calculatePlanetaryPositions } from './planetaryUtils.js'; // Import necessary functions

// Constants for time calculations
const DAYS_PER_YEAR = 365.2425; // More precise average year length
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLIS_PER_YEAR = DAYS_PER_YEAR * MILLIS_PER_DAY;
const VIMS_TOTAL_YEARS = 120; // Total cycle length for Vimshottari

/**
 * Calculates the Vimshottari Dasha balance at birth based on Moon's longitude.
 * @param {number} moonSiderealLongitude - Moon's sidereal longitude in decimal degrees.
 * @returns {object} Dasha balance object { lord, balanceYears, balanceMillis, balanceYMD: { years, months, days } } or throws error.
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
    const balanceMillis = balanceYearsDecimal * MILLIS_PER_YEAR;

    // Convert decimal years to Years, Months, Days (using a simpler approximation for display)
    const totalDays = balanceYearsDecimal * DAYS_PER_YEAR;
    const years = Math.floor(balanceYearsDecimal);
    const remainingDaysAfterYears = totalDays - (years * DAYS_PER_YEAR);
    const months = Math.floor(remainingDaysAfterYears / (DAYS_PER_YEAR / 12));
    const remainingDaysAfterMonths = remainingDaysAfterYears - (months * (DAYS_PER_YEAR / 12));
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
        balanceMillis: balanceMillis, // Store milliseconds for precise calculation
        balanceYMD: {
            years: finalYears,
            months: finalMonths,
            days: finalDays
        }
    };
}

/**
 * Calculates Vimshottari Dasha periods up to Pratyantar Dasha (Level 3).
 * @param {Date} birthDateUTC - The UTC birth date object.
 * @param {object} dashaBalance - The balance object from calculateVimshottariBalance.
 * @param {number} [totalYearsToCalculate=120] - How many years of Dasha periods to calculate.
 * @param {number} [maxLevel=3] - The maximum Dasha level to calculate (1=MD, 2=AD, 3=PD).
 * @returns {object[]} Array of Dasha period objects { level, lord, start, end, mahaLord?, antarLord? }.
 */
export function calculateVimshottariDashas(birthDateUTC, dashaBalance, totalYearsToCalculate = 120, maxLevel = 3) {
    if (!(birthDateUTC instanceof Date) || isNaN(birthDateUTC.getTime())) {
        throw new Error("Invalid birthDateUTC provided for Dasha calculation.");
    }
    if (!dashaBalance || !dashaBalance.lord || isNaN(dashaBalance.balanceMillis) || dashaBalance.lord === "Error") { // Check balanceMillis
        throw new Error("Invalid dashaBalance provided for Dasha calculation.");
    }
    if (maxLevel < 1 || maxLevel > 3) {
        logger.warn(`Invalid maxLevel ${maxLevel}. Setting to 3.`);
        maxLevel = 3;
    }

    const allPeriods = [];
    let currentStartDateMillis = birthDateUTC.getTime();

    // --- 1. Add the remaining balance period ---
    const firstLord = dashaBalance.lord;
    const balanceDurationMillis = dashaBalance.balanceMillis;
    const firstEndDateMillis = currentStartDateMillis + balanceDurationMillis;

    allPeriods.push({
        level: 1, // Maha Dasha
        lord: firstLord,
        start: new Date(currentStartDateMillis).toISOString(),
        end: new Date(firstEndDateMillis).toISOString()
    });

    // --- Calculate Antar Dashas (and Pratyantar Dashas) within the balance period ---
    if (maxLevel >= 2) {
        const firstMahaDashaYears = VIMS_DASHA_YEARS[firstLord];
        let balanceBhuktiStartDateMillis = currentStartDateMillis;
        let balanceBhuktiLordIndex = VIMS_DASHA_SEQUENCE.indexOf(firstLord);

        for (let i = 0; i < VIMS_DASHA_SEQUENCE.length; i++) {
            const bhuktiLord = VIMS_DASHA_SEQUENCE[balanceBhuktiLordIndex];
            const bhuktiTotalYears = VIMS_DASHA_YEARS[bhuktiLord];
            if (!bhuktiTotalYears) continue;

            // Calculate the *full* duration this Bhukti would have in the first MD
            const fullBhuktiDurationYears = (firstMahaDashaYears * bhuktiTotalYears) / VIMS_TOTAL_YEARS;
            const fullBhuktiDurationMillis = fullBhuktiDurationYears * MILLIS_PER_YEAR;

            // Calculate the *remaining* portion of this Bhukti within the balance period
            const remainingBhuktiDurationMillis = fullBhuktiDurationMillis * dashaBalance.balanceYears / firstMahaDashaYears;
            const bhuktiEndDateMillis = balanceBhuktiStartDateMillis + remainingBhuktiDurationMillis;

            // Ensure the Bhukti end does not exceed the Maha Dasha end
            const actualBhuktiEndDateMillis = Math.min(bhuktiEndDateMillis, firstEndDateMillis);
            const actualBhuktiDurationMillis = actualBhuktiEndDateMillis - balanceBhuktiStartDateMillis;

            if (actualBhuktiDurationMillis <= 0) break; // Stop if no time left in MD

            allPeriods.push({
                level: 2,
                mahaLord: firstLord,
                lord: bhuktiLord,
                start: new Date(balanceBhuktiStartDateMillis).toISOString(),
                end: new Date(actualBhuktiEndDateMillis).toISOString()
            });

            // --- Calculate Pratyantar Dashas within this balance Bhukti ---
            if (maxLevel >= 3 && actualBhuktiDurationMillis > 0) {
                let balancePratyantarStartDateMillis = balanceBhuktiStartDateMillis;
                let balancePratyantarLordIndex = balanceBhuktiLordIndex; // PD starts from AD lord

                for (let j = 0; j < VIMS_DASHA_SEQUENCE.length; j++) {
                    const pratyantarLord = VIMS_DASHA_SEQUENCE[balancePratyantarLordIndex];
                    const pratyantarTotalYears = VIMS_DASHA_YEARS[pratyantarLord];
                    if (!pratyantarTotalYears) continue;

                    // Calculate the *full* duration this PD would have in the *full* Bhukti
                    const fullPratyantarDurationYears = (fullBhuktiDurationYears * pratyantarTotalYears) / VIMS_TOTAL_YEARS;
                    const fullPratyantarDurationMillis = fullPratyantarDurationYears * MILLIS_PER_YEAR;

                    // Calculate the *remaining* portion of this PD within the *remaining* Bhukti
                    const remainingPratyantarDurationMillis = fullPratyantarDurationMillis * (actualBhuktiDurationMillis / fullBhuktiDurationMillis);
                    const pratyantarEndDateMillis = balancePratyantarStartDateMillis + remainingPratyantarDurationMillis;

                    // Ensure the PD end does not exceed the Bhukti end
                    const actualPratyantarEndDateMillis = Math.min(pratyantarEndDateMillis, actualBhuktiEndDateMillis);
                    const actualPratyantarDurationMillis = actualPratyantarEndDateMillis - balancePratyantarStartDateMillis;

                    if (actualPratyantarDurationMillis <= 0) break; // Stop if no time left in AD

                    allPeriods.push({
                        level: 3,
                        mahaLord: firstLord,
                        antarLord: bhuktiLord,
                        lord: pratyantarLord,
                        start: new Date(balancePratyantarStartDateMillis).toISOString(),
                        end: new Date(actualPratyantarEndDateMillis).toISOString()
                    });

                    balancePratyantarStartDateMillis = actualPratyantarEndDateMillis;
                    balancePratyantarLordIndex = (balancePratyantarLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
                }
            }
            // --- End Pratyantar Calculation for Balance Bhukti ---

            balanceBhuktiStartDateMillis = actualBhuktiEndDateMillis;
            balanceBhuktiLordIndex = (balanceBhuktiLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
        }
    }
    // --- End Calculation for Balance Period ---


    // --- 2. Calculate subsequent Full Maha Dashas ---
    let currentLordIndex = VIMS_DASHA_SEQUENCE.indexOf(firstLord);
    if (currentLordIndex === -1) {
        throw new Error(`Dasha balance lord "${firstLord}" not found in sequence.`);
    }

    let yearsCalculated = dashaBalance.balanceYears;
    currentStartDateMillis = firstEndDateMillis; // Start next period after the balance ends

    while (yearsCalculated < totalYearsToCalculate) {
        currentLordIndex = (currentLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
        const currentLord = VIMS_DASHA_SEQUENCE[currentLordIndex];
        const currentMahaDashaYears = VIMS_DASHA_YEARS[currentLord];

        if (!currentMahaDashaYears) {
             logger.warn(`Years not defined for Dasha lord: ${currentLord}. Skipping.`);
             continue; // Skip if years are missing
        }

        const mahaDashaDurationMillis = currentMahaDashaYears * MILLIS_PER_YEAR;
        const currentEndDateMillis = currentStartDateMillis + mahaDashaDurationMillis;

        allPeriods.push({
            level: 1,
            lord: currentLord,
            start: new Date(currentStartDateMillis).toISOString(),
            end: new Date(currentEndDateMillis).toISOString()
        });

        // --- 3. Calculate Bhukti (Antar Dasha) periods within this Maha Dasha ---
        if (maxLevel >= 2) {
            let bhuktiStartDateMillis = currentStartDateMillis;
            let bhuktiLordIndex = currentLordIndex; // Bhuktis start from the Maha Dasha lord

            for (let i = 0; i < VIMS_DASHA_SEQUENCE.length; i++) {
                const bhuktiLord = VIMS_DASHA_SEQUENCE[bhuktiLordIndex];
                const bhuktiTotalYears = VIMS_DASHA_YEARS[bhuktiLord];
                if (!bhuktiTotalYears) continue; // Skip if years missing

                // Bhukti duration is proportional: (MD Years * Bhukti Years) / 120
                const bhuktiDurationYears = (currentMahaDashaYears * bhuktiTotalYears) / VIMS_TOTAL_YEARS;
                const bhuktiDurationMillis = bhuktiDurationYears * MILLIS_PER_YEAR;
                const bhuktiEndDateMillis = bhuktiStartDateMillis + bhuktiDurationMillis;

                // Ensure end date doesn't exceed MD end (minor adjustments for precision)
                const actualBhuktiEndDateMillis = Math.min(bhuktiEndDateMillis, currentEndDateMillis);
                const actualBhuktiDurationMillis = actualBhuktiEndDateMillis - bhuktiStartDateMillis;

                if (actualBhuktiDurationMillis <= 1000) continue; // Skip tiny durations

                allPeriods.push({
                    level: 2, // Bhukti (Antar Dasha)
                    mahaLord: currentLord, // Parent lord
                    lord: bhuktiLord,
                    start: new Date(bhuktiStartDateMillis).toISOString(),
                    end: new Date(actualBhuktiEndDateMillis).toISOString()
                });

                // --- 4. Calculate Pratyantar Dasha (Level 3) ---
                if (maxLevel >= 3) {
                    let pratyantarStartDateMillis = bhuktiStartDateMillis;
                    let pratyantarLordIndex = bhuktiLordIndex; // PD starts from AD lord

                    for (let j = 0; j < VIMS_DASHA_SEQUENCE.length; j++) {
                        const pratyantarLord = VIMS_DASHA_SEQUENCE[pratyantarLordIndex];
                        const pratyantarTotalYears = VIMS_DASHA_YEARS[pratyantarLord];
                        if (!pratyantarTotalYears) continue;

                        // Pratyantar duration = (Bhukti Duration Years * Pratyantar Years) / 120
                        const pratyantarDurationYears = (bhuktiDurationYears * pratyantarTotalYears) / VIMS_TOTAL_YEARS;
                        const pratyantarDurationMillis = pratyantarDurationYears * MILLIS_PER_YEAR;
                        const pratyantarEndDateMillis = pratyantarStartDateMillis + pratyantarDurationMillis;

                        // Ensure end date doesn't exceed AD end
                        const actualPratyantarEndDateMillis = Math.min(pratyantarEndDateMillis, actualBhuktiEndDateMillis);
                        const actualPratyantarDurationMillis = actualPratyantarEndDateMillis - pratyantarStartDateMillis;

                        if (actualPratyantarDurationMillis <= 1000) continue; // Skip tiny durations

                        allPeriods.push({
                            level: 3, // Pratyantar Dasha
                            mahaLord: currentLord,
                            antarLord: bhuktiLord, // Add Antar Dasha lord
                            lord: pratyantarLord,
                            start: new Date(pratyantarStartDateMillis).toISOString(),
                            end: new Date(actualPratyantarEndDateMillis).toISOString()
                        });

                        pratyantarStartDateMillis = actualPratyantarEndDateMillis; // Move to next PD start
                        pratyantarLordIndex = (pratyantarLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
                    }
                }
                // --- End Pratyantar Calculation ---

                bhuktiStartDateMillis = actualBhuktiEndDateMillis; // Move to next Bhukti start
                bhuktiLordIndex = (bhuktiLordIndex + 1) % VIMS_DASHA_SEQUENCE.length;
            }
        }
        // --- End Bhukti Calculation ---

        yearsCalculated += currentMahaDashaYears;
        currentStartDateMillis = currentEndDateMillis; // Move to next Maha Dasha start
    }

    // Sort by start date and then level (MD > AD > PD)
    allPeriods.sort((a, b) => {
        const startDiff = new Date(a.start) - new Date(b.start);
        if (startDiff !== 0) return startDiff;
        return a.level - b.level; // Lower level comes first if start times are identical
    });

    // Filter out periods starting after the calculation window (optional, but good practice)
    const calculationEndDate = new Date(birthDateUTC.getTime() + totalYearsToCalculate * MILLIS_PER_YEAR);
    const finalPeriods = allPeriods.filter(p => new Date(p.start) < calculationEndDate);

    return finalPeriods;
}


/**
 * Calculates Mudda Dasha periods for a given Solar Return year.
 * (No changes needed here for Vimshottari Pratyantar Dasha)
 * @param {number} solarReturnJD_UT - Julian Day (UT) of the Solar Return moment.
 * @param {number} latitude - Observer's latitude.
 * @param {number} longitude - Observer's longitude.
 * @returns {object[]} Array of Mudda Dasha period objects { lord, start, end }.
 */
export function calculateMuddaDasha(solarReturnJD_UT, latitude, longitude) {
    // ... (existing Mudda Dasha logic remains unchanged) ...
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
        const solarReturnStartDateMillis = (solarReturnJD_UT - 2440587.5) * MILLIS_PER_DAY;
        let currentStartDateMillis = solarReturnStartDateMillis;
        const totalSolarYearDays = DAYS_PER_YEAR; // Use consistent constant

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
            const durationDays = (dashaYearsProportion / VIMS_TOTAL_YEARS) * totalSolarYearDays; // Use VIMS_TOTAL_YEARS for proportion
            const durationMillis = durationDays * MILLIS_PER_DAY;
            const currentEndDateMillis = currentStartDateMillis + durationMillis;

            muddaPeriods.push({
                lord: currentLord,
                start: new Date(currentStartDateMillis).toISOString(),
                end: new Date(currentEndDateMillis).toISOString(),
                durationDays: durationDays.toFixed(2)
            });

            currentStartDateMillis = currentEndDateMillis; // Move to next period start
        }

        // Sort just in case calculation order wasn't sequential
        muddaPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));

        return muddaPeriods;

    } catch (error) {
        logger.error(`Error calculating Mudda Dasha for SR JD ${solarReturnJD_UT}: ${error.message}`, { stack: error.stack });
        throw new Error(`Failed to calculate Mudda Dasha: ${error.message}`); // Re-throw
    }
}
