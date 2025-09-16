// utils/monthlyYogaUtils.js
import moment from 'moment-timezone';
import { getJulianDateUT } from './coreUtils.js';
import { calculatePlanetaryPositions, getNakshatraDetails, getMoonNakshatraEntryExitTimes } from './planetaryUtils.js';
import { calculateSarvarthSiddhaYoga, calculateAmritSiddhiYoga, calculateVishaYoga } from './yogaUtils.js';
import logger from './logger.js';
import { calculateSunMoonTimes } from './panchangUtils.js';

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

        let tempMoment = astrologicalDayStart.clone();
        while (tempMoment.isBefore(astrologicalDayEnd)) {
            const { julianDayUT } = getJulianDateUT(tempMoment.toISOString(), latitude, longitude);
            if (!julianDayUT) {
                tempMoment.add(1, 'hour');
                continue;
            }

            const planetaryPositions = await calculatePlanetaryPositions(julianDayUT);
            const moonLongitude = planetaryPositions.sidereal.Moon.longitude;
            const nakshatraDetails = getNakshatraDetails(moonLongitude);

            const { entryTime, exitTime } = await getMoonNakshatraEntryExitTimes(tempMoment.toISOString(), latitude, longitude, nakshatraDetails.index, sunTimes.sunrise, nextDaySunTimes.sunrise);

            if (entryTime) {
                const yogaStartTime = moment.max(astrologicalDayStart, moment(entryTime));
                const yogaEndTime = exitTime ? moment.min(astrologicalDayEnd, moment(exitTime)) : astrologicalDayEnd;

                const sarvarthSiddhaYoga = calculateSarvarthSiddhaYoga(dayOfWeek, nakshatraDetails.name, yogaStartTime.toISOString(), yogaEndTime.toISOString());
                if (sarvarthSiddhaYoga) {
                    yogas.push({
                        date: astrologicalDayStart.format('YYYY-MM-DD'),
                        day: dayOfWeek,
                        nakshatra: nakshatraDetails.name,
                        ...sarvarthSiddhaYoga
                    });
                }

                const amritSiddhiYoga = calculateAmritSiddhiYoga(dayOfWeek, nakshatraDetails.name, yogaStartTime.toISOString(), yogaEndTime.toISOString());
                if (amritSiddhiYoga) {
                    yogas.push({
                        date: astrologicalDayStart.format('YYYY-MM-DD'),
                        day: dayOfWeek,
                        nakshatra: nakshatraDetails.name,
                        ...amritSiddhiYoga
                    });
                }

                const vishaYoga = calculateVishaYoga(dayOfWeek, nakshatraDetails.name, yogaStartTime.toISOString(), yogaEndTime.toISOString());
                if (vishaYoga) {
                    yogas.push({
                        date: astrologicalDayStart.format('YYYY-MM-DD'),
                        day: dayOfWeek,
                        nakshatra: nakshatraDetails.name,
                        ...vishaYoga
                    });
                }

                if (exitTime && moment(exitTime).isAfter(tempMoment)) {
                    tempMoment = moment(exitTime);
                } else {
                    tempMoment.add(1, 'hour');
                }
            } else {
                tempMoment.add(1, 'hour');
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