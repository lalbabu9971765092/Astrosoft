// utils/monthlyYogaUtils.js
import moment from 'moment-timezone';
import { getJulianDateUT } from './coreUtils.js';
import { calculatePlanetaryPositions, getNakshatraDetails, findNextNakshatraChange } from './planetaryUtils.js';
import { calculateSarvarthSiddhaYoga, calculateAmritSiddhiYoga, calculateVishaYoga, calculateGuruPushyaYoga, calculateRaviPushyaYoga, calculateTripushkarYoga, calculateDwipushkarYoga, calculateDagdhaYoga, calculateRaviYoga } from './yogaUtils.js';
import logger from './logger.js';
import { calculateSunMoonTimes, calculatePanchang } from './panchangUtils.js';

export async function calculateYogasForMonth(year, month, latitude, longitude) {
    const yogas = [];
    const startDate = moment.utc(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00Z`);
    const daysInMonth = startDate.daysInMonth();

    for (let day = 1; day <= daysInMonth; day++) {
        const monthString = month.toString().padStart(2, '0');
        const dayString = day.toString().padStart(2, '0');
        const currentDate = moment.utc(`${year}-${monthString}-${dayString}T12:00:00Z`);
        const sunTimes = await calculateSunMoonTimes(currentDate.toDate(), latitude, longitude);
        const nextDaySunTimes = await calculateSunMoonTimes(currentDate.clone().add(1, 'day').toDate(), latitude, longitude);

        if (!sunTimes.sunrise || !nextDaySunTimes.sunrise) {
            logger.warn(`Could not calculate sunrise for ${currentDate.format('YYYY-MM-DD')}`);
            continue;
        }

        const astrologicalDayStart = moment(sunTimes.sunrise);
        const astrologicalDayEnd = moment(nextDaySunTimes.sunrise);
        const dayOfWeek = astrologicalDayStart.format('dddd');

        let currentMoment = astrologicalDayStart.clone();

        while (currentMoment.isBefore(astrologicalDayEnd)) {
            const { julianDayUT } = getJulianDateUT(currentMoment.toISOString(), latitude, longitude);
            if (!julianDayUT) {
                currentMoment.add(1, 'hour'); // Failsafe
                continue;
            }

            const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
            const panchang = await calculatePanchang(currentMoment.toDate(), latitude, longitude, planetaryPositions);
            
            const moonLongitude = planetaryPositions.sidereal.Moon.longitude;
            const sunLongitude = planetaryPositions.sidereal.Sun.longitude;
            const currentNakshatra = getNakshatraDetails(moonLongitude);
            const sunNakshatra = getNakshatraDetails(sunLongitude);
            const currentTithi = panchang.Tithi.index;

            const nextChangeTimeStr = await findNextNakshatraChange(currentMoment.toISOString(), latitude, longitude);
            const nextChangeMoment = nextChangeTimeStr ? moment(nextChangeTimeStr) : astrologicalDayEnd;

            const periodStart = currentMoment;
            const periodEnd = moment.min(nextChangeMoment, astrologicalDayEnd);

            if (periodStart.isSameOrAfter(periodEnd)) {
                currentMoment = periodEnd.clone();
                if (currentMoment.isSameOrBefore(periodStart)) {
                    currentMoment.add(1, 'minute'); // Ensure progress
                }
                continue;
            }
            
            // --- Call All Yoga Functions Explicitly ---
            const yogaChecks = [
                calculateSarvarthSiddhaYoga(dayOfWeek, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateAmritSiddhiYoga(dayOfWeek, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateVishaYoga(dayOfWeek, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateGuruPushyaYoga(dayOfWeek, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateRaviPushyaYoga(dayOfWeek, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateDwipushkarYoga(dayOfWeek, currentTithi, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateTripushkarYoga(dayOfWeek, currentTithi, currentNakshatra.name, periodStart.toISOString(), periodEnd.toISOString()),
                calculateDagdhaYoga(dayOfWeek, currentTithi, periodStart.toISOString(), periodEnd.toISOString()),
                calculateRaviYoga(sunNakshatra.index, currentNakshatra.index, periodStart.toISOString(), periodEnd.toISOString())
            ];

            for (const yogaResult of yogaChecks) {
                if (yogaResult) {
                    yogas.push({
                        date: astrologicalDayStart.format('YYYY-MM-DD'),
                        day: dayOfWeek,
                        nakshatra: currentNakshatra.name,
                        ...yogaResult
                    });
                }
            }

            currentMoment = periodEnd.clone();
             if (currentMoment.isSameOrBefore(periodStart)) {
                currentMoment.add(1, 'minute'); // Ensure progress
            }
        }
    }

    // Remove duplicate yogas
    const uniqueYogas = yogas.filter((yoga, index, self) =>
        index === self.findIndex((y) => (
            y.name === yoga.name && y.start === yoga.start && y.end === yoga.end
        ))
    );

    return uniqueYogas;
}