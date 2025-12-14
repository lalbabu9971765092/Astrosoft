import { getVarshphalPrediction } from '../utils/predictionTextGenerator.js';

const samplePayload = {
    varshphalChart: {
        ascendant: { rashi: 'Aquarius', rashiLord: 'Saturn' },
        houses: [
            { house_number:1, mean_rashi: 'Pisces' }, { house_number:2, mean_rashi: 'Aries' }, { house_number:3, mean_rashi: 'Taurus' },
            { house_number:4, mean_rashi: 'Gemini' }, { house_number:5, mean_rashi: 'Cancer' }, { house_number:6, mean_rashi: 'Leo' },
            { house_number:7, mean_rashi: 'Virgo' }, { house_number:8, mean_rashi: 'Libra' }, { house_number:9, mean_rashi: 'Scorpio' },
            { house_number:10, mean_rashi: 'Sagittarius' }, { house_number:11, mean_rashi: 'Capricorn' }, { house_number:12, mean_rashi: 'Aquarius' }
        ],
        planetHousePlacements: {
            Sun: 10, Moon: 7, Mars: 10, Saturn: 1, Rahu: 1, Ketu: 7, Neptune: 1
        }
    },
    muntha: { sign: 'Aquarius', house: 1 },
    yearLord: 'Saturn',
    muddaDasha: [
        { planet: 'Mars', start: '2025-12-14T06:29:00.000Z', end: '2026-01-04T13:49:22.200Z' },
        { planet: 'Rahu', start: '2026-01-04T13:49:22.200Z', end: '2026-02-28T08:41:45.000Z' },
        { planet: 'Jupiter', start: '2026-02-28T08:41:45.000Z', end: '2026-04-18T01:28:18.600Z' }
    ],
    kpSignificators: { count: 12 }
};

// Request simple/plain paragraph for testing
samplePayload.style = 'simple';

const out = getVarshphalPrediction(samplePayload, 'hi');
console.log('--- Varshaphal Prediction (HI) ---\n');
console.log(out);

const outEn = getVarshphalPrediction(samplePayload, 'en');
console.log('\n--- Varshaphal Prediction (EN) ---\n');
console.log(outEn);

// Test different year to ensure variation
const samplePayload2026 = { ...samplePayload, varshphalYear: 2026 };
console.log('\n--- Varshaphal Prediction (HI) for 2026 ---\n');
console.log(getVarshphalPrediction(samplePayload2026, 'hi'));
