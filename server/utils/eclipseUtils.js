// utils/eclipseUtils.js
import * as Astronomy from 'astronomy-engine';
import logger from './logger.js';

/**
 * Calculates solar and lunar eclipses for a given year and location.
 * @param {number} year - The year for which to calculate eclipses.
 * @param {number} latitude - The observer's latitude.
 * @param {number} longitude - The observer's longitude.
 * @returns {Array<object>} An array of eclipse event objects.
 */
export function calculateEclipsesForYear(year, latitude, longitude) {
   
    const eclipses = [];
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    let searchTime = new Date(Date.UTC(year, 0, 1));

    // --- Solar Eclipses ---
    let solarEclipse = Astronomy.SearchLocalSolarEclipse(searchTime, observer); // Find the first one
    while (solarEclipse && solarEclipse.peak && solarEclipse.peak.time && solarEclipse.peak.time.date) {
        const peakDate = new Date(solarEclipse.peak.time.date);
        if (peakDate.getUTCFullYear() === year) {
            eclipses.push({
                type: 'Solar',
                nature: solarEclipse.kind,
                date: peakDate.toISOString().split('T')[0],
                peakTime: peakDate.toISOString(),
                startTime: new Date(solarEclipse.partial_begin.time.date).toISOString(),
                endTime: new Date(solarEclipse.partial_end.time.date).toISOString(),
                magnitude: solarEclipse.magnitude ? solarEclipse.magnitude.toFixed(4) : null,
                obscuration: solarEclipse.obscuration ? solarEclipse.obscuration.toFixed(4) : null
            });
            // Find the next eclipse after this one
            solarEclipse = Astronomy.NextLocalSolarEclipse(solarEclipse.peak.time.date, observer); // Use the peak date of the current eclipse
        } else {
                       break; // Eclipse is in a future year, so we can stop
        }
    }

    searchTime = new Date(Date.UTC(year, 0, 1));
    // --- Lunar Eclipses ---
    let lunarEclipse = Astronomy.SearchLunarEclipse(searchTime); // Find the first one
    while (lunarEclipse && lunarEclipse.peak && lunarEclipse.peak.date) {
        const peakDate = new Date(lunarEclipse.peak.date);
        if (peakDate.getUTCFullYear() === year) {
            const moonPos = Astronomy.Equator(Astronomy.Body.Moon, peakDate, observer, true, true);
            const horizontal = Astronomy.Horizon(peakDate, observer, moonPos.ra, moonPos.dec);
            if (horizontal.altitude > 0) {
                // Only provide peak time for lunar eclipses
                eclipses.push({
                    type: 'Lunar',
                    nature: lunarEclipse.kind,
                    date: peakDate.toISOString().split('T')[0],
                    peakTime: peakDate.toISOString(),
                    startTime: peakDate.toISOString(), // Use peak time for start and end
                    endTime: peakDate.toISOString(),   // Use peak time for start and end
                    magnitude: lunarEclipse.sd_penum.toFixed(4)
                });
            }
            // Find the next eclipse after this one
            lunarEclipse = Astronomy.NextLunarEclipse(lunarEclipse.peak.date); // Use the peak date of the current eclipse
        } else {
         
            break; // Eclipse is in a future year, so we can stop
        }
    }

    return eclipses.sort((a, b) => new Date(a.peakTime) - new Date(b.peakTime));
}
