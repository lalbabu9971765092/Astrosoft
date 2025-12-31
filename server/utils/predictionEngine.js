import { getHouseOfPlanet, calculatePlanetaryPositions, getRashiDetails, calculateAtmakaraka } from './planetaryUtils.js';
import { convertDMSToDegrees, getJulianDateUT } from './coreUtils.js';
import { getCombinedPredictionLong, getUPBSDescription, getOrdinal } from './predictionTextGenerator.js';
import { calculateAllBirthChartYogas as detectAllYogas } from './birthChartYogaUtils.js';
import { RASHI_LORDS, RASHIS, PLANET_EXALTATION_SIGN, PLANET_DEBILITATION_SIGN } from './constants.js';
import { PLANET_NAMES_HI, getPlanetName } from './birthChartYogaUtils.js';
import { calculateUPBS } from './beneficenceUtils.js'; // Import calculateUPBS

/* ======================================================
   Constants & Utilities
====================================================== */
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const LIFE_AREAS = [
  { name: 'Career', house: 10, varga: 'D10' },
  { name: 'Profession', house: 10, varga: 'D10' },
  { name: 'Wealth', house: 2, varga: 'D2' },
  { name: 'Education', house: 5, varga: 'D9' }, // Using D9 for higher knowledge
  { name: 'Children', house: 5, varga: 'D7' }, // Using D7 for progeny and creativity
  { name: 'Siblings, Courage, Communication', house: 3, varga: 'D3' }, // Using D3 for siblings, courage, communication
  { name: 'Marriage', house: 7, varga: 'D9' },
  { name: 'Health', house: 6, varga: 'D12' },
  { name: 'Litigation', house: 6, varga: 'D6' }, // Using D6 for misfortunes and challenges
  { name: 'Spirituality', house: 9, varga: 'D9' },
  { name: 'Past Karma', house: 1, varga: 'D60' } // Using D60 for overall past karma and destiny
];
const DURATION = { short: 0.5, medium: 1, long: 3 }; // years

const clamp = (n, min=-100, max=100) => Math.max(min, Math.min(max, n));
const toDegrees = dms => convertDMSToDegrees(dms);

// Helper to determine if a planet is naturally benefic
function isBenefic(planet) {
  return ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(planet); // Mercury and Moon are conditional
}

/* ======================================================
   Planetary Strength
====================================================== */


function isFunctionalBenefic(planet, houseNum) {
  const dusthanas = [6,8,12];
  if (planet === 'Jupiter' || planet === 'Venus') return true;
  if (planet === 'Saturn' && [3,10].includes(houseNum)) return true;
  return !dusthanas.includes(houseNum);
}

/* ======================================================
   Aspects
====================================================== */
function calculateAspects(planetPositions, houses) {
  const aspects = [];
  const cuspDegrees = houses.map(h => toDegrees(h.start_dms));
  const SPECIAL_ASPECTS = { Mars: [4,7,8], Jupiter: [5,7,9], Saturn: [3,7,10], Rahu:[5,9], Ketu:[5,9] };
  for (const [planet, data] of Object.entries(planetPositions.sidereal)) {
    if (!data?.longitude) continue;
    const baseHouse = getHouseOfPlanet(data.longitude, cuspDegrees);
    const offsets = SPECIAL_ASPECTS[planet] || [7];
    offsets.forEach(offset => {
      aspects.push({ planet, house: ((baseHouse + offset - 1) % 12) + 1 });
    });
  }
  return aspects;
}

/* ======================================================
   House Strength
====================================================== */
function calculateHouseStrength(houseNum, chartData, planetaryPowers, aspects) {
  let score = 0;
  const houseLord = chartData.houses[houseNum-1]?.start_rashi_lord;
  const lordPower = planetaryPowers[houseLord] || 0;
  score += lordPower * 0.6;

  Object.entries(chartData.planetaryPositions.sidereal).forEach(([p,d]) => {
    if (!d?.longitude) return;
    const h = getHouseOfPlanet(d.longitude, chartData.houses.map(h=>toDegrees(h.start_dms)));
    if (h === houseNum) score += (planetaryPowers[p]||0)*0.3;
  });

  aspects.forEach(a => {
    if (a.house !== houseNum) return;
    const power = planetaryPowers[a.planet] || 0;
    score += isFunctionalBenefic(a.planet, houseNum) ? power*0.2 : power*-0.25;
  });

  return clamp(score);
}

/* ======================================================
   Dasha / Bhukti
====================================================== */
function getCurrentMahadasha(chartData) {
  const now = new Date(chartData.inputParameters.utcDate);
  return chartData.dashaPeriods?.find(d => d.level===1 && now>=new Date(d.start) && now<=new Date(d.end));
}

function getCurrentBhukti(chartData) {
  const now = new Date(chartData.inputParameters.utcDate);
  return chartData.dashaPeriods?.find(d => d.level===2 && now>=new Date(d.start) && now<=new Date(d.end));
}

function getCurrentAntar(chartData) {
  const now = new Date(chartData.inputParameters.utcDate);
  return chartData.dashaPeriods?.find(d => d.level===3 && now>=new Date(d.start) && now<=new Date(d.end));
}

/* ======================================================
   Transits
====================================================== */
async function analyzeTransits(chartData, lang = 'en') {
  const jd = getJulianDateUT(chartData.inputParameters.utcDate, chartData.inputParameters.latitude, chartData.inputParameters.longitude);
  const transits = await calculatePlanetaryPositions(jd.julianDayUT);
  const natalPositions = chartData.planetaryPositions.sidereal;
  const cuspDegrees = chartData.houses.map(h => toDegrees(h.start_dms));
  
  const transitEvents = [];
  const slowMovingPlanets = ['Saturn', 'Jupiter', 'Rahu', 'Ketu'];

  for (const [transitingPlanet, transitData] of Object.entries(transits.sidereal)) {
    if (!transitData?.longitude || !PLANETS.includes(transitingPlanet)) continue;

    const transitedHouse = getHouseOfPlanet(transitData.longitude, cuspDegrees);
    const translatedTransitingPlanet = getPlanetName(transitingPlanet, lang);

    let narration = lang === 'hi'
      ? `${translatedTransitingPlanet} का ${transitedHouse}वें घर में गोचर इस घर से संबंधित मामलों पर ध्यान केंद्रित करेगा। `
      : `The transit of ${transitingPlanet} through your ${getOrdinal(transitedHouse)} house will focus your energy on matters related to this house. `;
    
    if (slowMovingPlanets.includes(transitingPlanet)) {
        narration += lang === 'hi'
            ? 'यह एक महत्वपूर्ण और दीर्घकालिक प्रभाव है जो इन विषयों पर आपकी एकाग्रता को बढ़ाएगा। '
            : 'This is a significant and long-term influence that will heighten your focus on these themes. ';
    }

    // Find and interpret conjunctions
    const natalPlanetsInHouse = Object.entries(natalPositions)
      .filter(([p, d]) => d?.longitude && getHouseOfPlanet(d.longitude, cuspDegrees) === transitedHouse && p !== transitingPlanet)
      .map(([p]) => p);
      
    if (natalPlanetsInHouse.length > 0) {
      const translatedNatalPlanets = natalPlanetsInHouse.map(p => getPlanetName(p, lang)).join(', ');
      narration += lang === 'hi'
        ? `यहां यह आपके जन्मकालीन ${translatedNatalPlanets} से युति करेगा, जिससे इन ग्रहों की ऊर्जाएं विलीन हो जाएंगी। `
        : `Here, it will conjoin your natal ${translatedNatalPlanets}, merging their energies. `;
    }

    // Find and interpret other major aspects
    const aspects = { trine: [], square: [], opposition: [] };
    for (const [natalPlanet, natalData] of Object.entries(natalPositions)) {
      if (!natalData?.longitude || natalPlanet === transitingPlanet || natalPlanetsInHouse.includes(natalPlanet)) continue;
      
      const angle = Math.abs(transitData.longitude - natalData.longitude);
      const normalizedAngle = Math.min(angle, 360 - angle);

      if (normalizedAngle > 175 && normalizedAngle < 185) {
        aspects.opposition.push(getPlanetName(natalPlanet, lang));
      } else if (normalizedAngle > 115 && normalizedAngle < 125) {
        aspects.trine.push(getPlanetName(natalPlanet, lang));
      } else if (normalizedAngle > 85 && normalizedAngle < 95) {
        aspects.square.push(getPlanetName(natalPlanet, lang));
      }
    }
    
    if (aspects.trine.length > 0) {
      narration += lang === 'hi'
        ? `${aspects.trine.join(', ')} से एक सामंजस्यपूर्ण त्रिकोण पहलू इस अवधि के दौरान सहज प्रवाह और समर्थन का वादा करता है। `
        : `A harmonious trine aspect from ${aspects.trine.join(', ')} promises smooth flow and support during this period. `;
    }
    if (aspects.square.length > 0) {
      narration += lang === 'hi'
        ? `${aspects.square.join(', ')} से एक चुनौतीपूर्ण वर्ग पहलू घर्षण पैदा कर सकता है और कार्रवाई की मांग कर सकता है। `
        : `A challenging square aspect from ${aspects.square.join(', ')} may create friction and demand action. `;
    }
    if (aspects.opposition.length > 0) {
      narration += lang === 'hi'
        ? `${aspects.opposition.join(', ')} से एक विरोधाभासी पहलू संतुलन की आवश्यकता या दूसरों के माध्यम से जागरूकता का संकेत देता है।`
        : `An opposition aspect from ${aspects.opposition.join(', ')} signals a need for balance or awareness through others.`;
    }

    transitEvents.push({ planet: transitingPlanet, house: transitedHouse, narration: narration.trim() });
  }

  return transitEvents;
}

/* ======================================================
   Yogas Detection
====================================================== */
function detectYogas(chartData, lang) {
  // `detectYogas` from yogaUtils.js now wraps calculateAllBirthChartYogas
  return detectAllYogas(chartData.planetaryPositions.sidereal, chartData.houses, lang);
}

/* ======================================================
   Helper for Dasha Lord Analysis
====================================================== */
function getHouseDetails(houseNum, housesData) {
  const house = housesData.find(h => h.house_number === houseNum);
  if (!house) return null;
  return {
    lord: house.start_rashi_lord,
    rashi: getRashiDetails(house.start_deg).rashi,
  };
}

const DASHA_NAMES_HI = {
  Mahadasha: 'महादशा',
  Bhukti: 'भुक्ति',
  Antar: 'अंतर',
};

const RASHIS_HI = {
  Aries: 'मेष',
  Taurus: 'वृषभ',
  Gemini: 'मिथुन',
  Cancer: 'कर्क',
  Leo: 'सिंह',
  Virgo: 'कन्या',
  Libra: 'तुला',
  Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु',
  Capricorn: 'मकर',
  Aquarius: 'कुंभ',
  Pisces: 'मीन',
};

const getRashiName = (rashi, lang) => {
  if (lang === 'hi') {
    return RASHIS_HI[rashi] || rashi;
  }
  return rashi;
};


function getPlanetDignityDescription(planetName, planetPosition, lang = 'en') {
  if (!planetPosition) return lang === 'hi' ? 'अज्ञात गरिमा' : 'Unknown dignity';
  
  const rashi = planetPosition.rashi;
  const dignity = planetPosition.avasthas?.dignity;

  if (!rashi) return lang === 'hi' ? 'अज्ञात राशि में' : 'in an unknown sign';

  const translatedRashi = getRashiName(rashi, lang);

  if (dignity === 'Exalted') return lang === 'hi' ? `उच्च का ${translatedRashi} में` : `exalted in ${rashi}`;
  if (dignity === 'Debilitated') return lang === 'hi' ? `नीच का ${translatedRashi} में` : `debilitated in ${rashi}`;
  if (dignity === 'Moolatrikona') return lang === 'hi' ? `मूलत्रिकोण में (${translatedRashi})` : `in Moolatrikona in ${rashi}`;
  if (dignity === 'Own Sign') return lang === 'hi' ? `अपनी स्वराशि (${translatedRashi}) में` : `in its own sign of ${rashi}`;
  if (dignity === 'Friend') return lang === 'hi' ? `मित्र राशि (${translatedRashi}) में` : `in a friendly sign of ${rashi}`;
  if (dignity === 'Enemy') return lang === 'hi' ? `शत्रु राशि (${translatedRashi}) में` : `in an enemy sign of ${rashi}`;
  if (dignity === 'Neutral') return lang === 'hi' ? `सम राशि (${translatedRashi}) में` : `in a neutral sign of ${rashi}`;

  return lang === 'hi' ? `${translatedRashi} में` : `in ${rashi}`; // Default
}

function analyzeDashaLordsInChart(chartData, planetaryPowers, currentDasha, currentBhukti, currentAntar, lang = 'en') {
  const analysis = [];
  const planetaryPositions = chartData.planetaryPositions.sidereal;
  const houses = chartData.houses;
  const cuspDegrees = houses.map(h => toDegrees(h.start_dms));
  const yogas = detectYogas(chartData, lang);
  
  const PLANETARY_RELATIONSHIPS = {
    'Sun': { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
    'Moon': { friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
    'Mars': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
    'Mercury': { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
    'Jupiter': { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
    'Venus': { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
    'Saturn': { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] }
  };

  const dashaLevels = [
    { name: "Mahadasha", name_hi: "महादशा", lord: currentDasha?.lord, parentLord: null },
    { name: "Bhukti", name_hi: "भुक्ति", lord: currentBhukti?.lord, parentLord: currentDasha?.lord },
    { name: "Antar", name_hi: "अंतर", lord: currentAntar?.lord, parentLord: currentBhukti?.lord },
  ];

  dashaLevels.forEach(level => {
    if (level.lord && planetaryPositions[level.lord]) {
      const planet = level.lord;
      const planetPosition = planetaryPositions[planet];
      const natalHouse = getHouseOfPlanet(planetPosition.longitude, cuspDegrees);
      const dignityDesc = getPlanetDignityDescription(planet, planetPosition, lang);
      const translatedPlanet = getPlanetName(planet, lang);
      
      const lordScore = planetaryPowers[planet] || 0;
      const strengthDescription = getUPBSDescription(lordScore, lang);

      // Find houses ruled by this planet
      const ruledHouses = houses.filter(h => h.start_rashi_lord === planet).map(h => h.house_number);
      
      // Find houses aspected by this planet
      const aspectedHouses = calculateAspects({ sidereal: { [planet]: planetPosition } }, houses).map(a => a.house);

      // Find yogas this planet is involved in
      const involvedYogas = yogas.filter(y => y.planetsInvolved.includes(planet));

      let narrative = '';
      if (lang === 'hi') {
        narrative = `**${level.name_hi} स्वामी ${translatedPlanet}:** यह ग्रह आपके ${natalHouse}वें घर में ${dignityDesc} में स्थित है। यह ${strengthDescription}। `;
        if (ruledHouses.length > 0) {
          narrative += `${level.name_hi} के दौरान, ${ruledHouses.join(' और ')} भावों से संबंधित मामले प्रमुख होंगे। `;
        }
        if (aspectedHouses.length > 0) {
            narrative += `यह ${aspectedHouses.join(', ')} भावों को भी प्रभावित कर रहा है, जो इन क्षेत्रों में घटनाओं को ट्रिगर कर सकता है। `;
        }
        if (involvedYogas.length > 0) {
            narrative += `यह ${involvedYogas.map(y => y.name).join(', ')} जैसे योगों में शामिल है, जो इस अवधि के दौरान इन योगों के परिणामों को सक्रिय करेगा। `;
        }
        if (level.parentLord) {
            const parentLord = level.parentLord;
            const relationship = PLANETARY_RELATIONSHIPS[parentLord]?.friends.includes(planet) ? (lang === 'hi' ? 'मित्रतापूर्ण' : 'a friendly') :
                                 PLANETARY_RELATIONSHIPS[parentLord]?.enemies.includes(planet) ? (lang === 'hi' ? 'शत्रुतापूर्ण' : 'an enemy') : (lang === 'hi' ? 'तटस्थ' : 'a neutral');
            narrative += `${getPlanetName(parentLord, lang)} के साथ इसका ${relationship} संबंध बताता है कि इस अवधि के परिणाम ऊपरी अवधि के विषयों के साथ कैसे संरेखित होंगे।`;
        }
      } else {
        narrative = `**${level.name} Lord ${planet}:** This planet is located in your ${getOrdinal(natalHouse)} house in a state of ${dignityDesc}. It ${strengthDescription}. `;
        if (ruledHouses.length > 0) {
          narrative += `During its period, matters related to house(s) ${ruledHouses.map(getOrdinal).join(' and ')} will be prominent. `;
        }
        if (aspectedHouses.length > 0) {
            narrative += `It is also influencing house(s) ${aspectedHouses.join(', ')}, which may trigger events in these areas. `;
        }
        if (involvedYogas.length > 0) {
            narrative += `It is involved in yogas like ${involvedYogas.map(y => y.name).join(', ')}, which will activate the results of these yogas during this period. `;
        }
        if (level.parentLord) {
            const parentLord = level.parentLord;
            const relationship = PLANETARY_RELATIONSHIPS[parentLord]?.friends.includes(planet) ? 'a friendly' :
                                 PLANETARY_RELATIONSHIPS[parentLord]?.enemies.includes(planet) ? 'an enemy' : 'a neutral';
            narrative += `Its ${relationship} relationship with the overarching period lord, ${parentLord}, will color the results, suggesting cooperation or friction with the broader themes of the time.`;
        }
      }
      analysis.push(narrative);
    }
  });

  return analysis;
}


const LIFE_AREA_NAMES_HI = {
  Career: 'करियर',
  Profession: 'पेशा',
  Wealth: 'धन',
  Education: 'शिक्षा',
  Marriage: 'विवाह',
  Health: 'स्वास्थ्य',
  Litigation: 'मुकदमेबाजी',
  Spirituality: 'अध्यात्म',
};

const getLifeAreaName = (areaName, lang) => {
  if (lang === 'hi') {
    return LIFE_AREA_NAMES_HI[areaName] || areaName;
  }
  return areaName;
};

/* ======================================================
   Life Area Reports
====================================================== */
function generateLifeAreaReports(chartData, planetaryPowers, ashtakavarga, yogas, aspects, lang = 'en') {
  const reports = {};
  const cuspDegrees = chartData.houses.map(h => toDegrees(h.start_dms));

  const HOUSE_THEMES = {
      1: { en: "self, identity, and personality", hi: "स्व, पहचान, और व्यक्तित्व" },
      2: { en: "wealth, family, and speech", hi: "धन, परिवार, और वाणी" },
      3: { en: "siblings, courage, and communication", hi: "भाई-बहन, साहस, और संचार" },
      4: { en: "mother, home, and inner peace", hi: "माता, घर, और आंतरिक शांति" },
      5: { en: "children, creativity, and intellect", hi: "संतान, रचनात्मकता, और बुद्धि" },
      6: { en: "health, debts, and daily work", hi: "स्वास्थ्य, ऋण, और दैनिक कार्य" },
      7: { en: "partnerships, marriage, and contracts", hi: "साझेदारी, विवाह, और अनुबंध" },
      8: { en: "longevity, transformation, and secrets", hi: "दीर्घायु, परिवर्तन, और रहस्य" },
      9: { en: "father, fortune, and higher learning", hi: "पिता, भाग्य, और उच्च शिक्षा" },
      10: { en: "career, reputation, and public life", hi: "करियर, प्रतिष्ठा, और सार्वजनिक जीवन" },
      11: { en: "gains, friendships, and aspirations", hi: "लाभ, मित्रता, और आकांक्षाएं" },
      12: { en: "expenses, spirituality, and liberation", hi: "व्यय, आध्यात्मिकता, और मोक्ष" }
  };
  
  const PLANETARY_RELATIONSHIPS = {
    'Sun': { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutral: ['Mercury'] },
    'Moon': { friends: ['Sun', 'Mercury'], enemies: [], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
    'Mars': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] },
    'Mercury': { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutral: ['Mars', 'Jupiter', 'Saturn'] },
    'Jupiter': { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutral: ['Saturn'] },
    'Venus': { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutral: ['Mars', 'Jupiter'] },
    'Saturn': { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Rahu': { friends: ['Mercury', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon', 'Mars'], neutral: ['Jupiter'] },
    'Ketu': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutral: ['Venus', 'Saturn'] }
  };

  const allMahadashaLords = [...new Set(chartData.dashaPeriods.filter(d => d.level === 1).map(d => d.lord))];

  LIFE_AREAS.forEach(area => {
      const houseNum = area.house;
      const house = chartData.houses[houseNum - 1];
      const houseLord = house?.start_rashi_lord;

      if (!houseLord) {
          reports[area.name.toLowerCase()] = { narrative: "Analysis unavailable." };
          return;
      }

      const lordPosition = chartData.planetaryPositions.sidereal[houseLord];
      const lordPlacementHouse = lordPosition ? getHouseOfPlanet(lordPosition.longitude, cuspDegrees) : null;
      const theme = HOUSE_THEMES[lordPlacementHouse]?.[lang] || (lang === 'hi' ? 'अज्ञात मामलों' : 'unknown matters');
      
      const lordScore = planetaryPowers[houseLord] || 0;
      const strengthDesc = getUPBSDescription(lordScore, lang);
      const translatedLord = getPlanetName(houseLord, lang);

      // --- Dispositor Analysis ---
      let dispositorNarrative = '';
      if (lordPosition && lordPosition.rashi) {
          const dispositor = RASHI_LORDS[lordPosition.rashi];
          if (dispositor) {
              const dispositorPosition = chartData.planetaryPositions.sidereal[dispositor];
              const dispositorPlacementHouse = dispositorPosition ? getHouseOfPlanet(dispositorPosition.longitude, cuspDegrees) : null;
              const dispositorScore = planetaryPowers[dispositor] || 0;
              const dispositorStrengthDesc = getUPBSDescription(dispositorScore, lang);
              const translatedDispositor = getPlanetName(dispositor, lang);
              const dispositorTheme = HOUSE_THEMES[dispositorPlacementHouse]?.[lang] || (lang === 'hi' ? 'अज्ञात मामलों' : 'unknown matters');

              if (lang === 'hi') {
                  dispositorNarrative = `इस घर के स्वामी, ${translatedLord}, का स्थान ${lordPosition.rashi} राशि में है, जिसका स्वामी ${translatedDispositor} है। ${translatedDispositor}, जो आपके ${dispositorPlacementHouse}वें घर में स्थित है, ${dispositorStrengthDesc}। यह इंगित करता है कि इस जीवन क्षेत्र के अंतर्निहित परिणाम ${dispositorTheme} के मामलों से बहुत प्रभावित होते हैं। `;
              } else {
                  dispositorNarrative = `The lord of this house, ${translatedLord}, is placed in the sign of ${lordPosition.rashi}, whose lord is ${translatedDispositor}. ${translatedDispositor}, situated in your ${getOrdinal(dispositorPlacementHouse)} house, ${dispositorStrengthDesc}. This indicates that the underlying outcomes of this life area are heavily influenced by matters of ${dispositorTheme}. `;
              }
          }
      }
      // --- End Dispositor Analysis ---

      const positiveFactors = [];
      const challengingFactors = [];

      const sarvaPoints = ashtakavarga?.sarva?.scores?.[houseNum - 1] || 0;
      if (sarvaPoints >= 28) {
          positiveFactors.push((lang === 'hi' ? `अनुकूल सर्वाष्टकवर्ग स्कोर (${sarvaPoints}) है, जो इस क्षेत्र में सफलता और विस्तार के लिए एक मजबूत क्षमता का संकेत देता है।` : `a favorable Sarva Ashtakavarga score of ${sarvaPoints}, indicating a strong capacity for success and expansion in this area.`));
      } else {
          challengingFactors.push((lang === 'hi' ? `कम सर्वाष्टकवर्ग स्कोर (${sarvaPoints}) है, जो बताता है कि इस क्षेत्र में वांछित परिणाम प्राप्त करने के लिए अधिक प्रयास की आवश्यकता हो सकती है।` : `a low Sarva Ashtakavarga score of ${sarvaPoints}, suggesting that more effort may be required to achieve desired results in this area.`));
      }

      const relevantYogas = yogas.filter(yoga => {
          const areaSpecificYogaNames = { 'Wealth': ['Dhana', 'Lakshmi'], 'Career': ['Raja', 'Adhipati', 'Amala', 'Pancha Mahapurusha'], 'Health': ['Harsha', 'Vipareeta'], 'Spirituality': ['Saraswati', 'Gaja Kesari', 'Adhipati'], 'Marriage': ['Raja'] };
          return yoga.planetsInvolved.includes(houseLord) || areaSpecificYogaNames[area.name]?.some(name => yoga.name.includes(name));
      });
      if (relevantYogas.length > 0) {
          const yogaNames = relevantYogas.map(y => y.name).join(', ');
          positiveFactors.push((lang === 'hi' ? `शक्तिशाली योगों की उपस्थिति (जैसे '${yogaNames}') इस क्षेत्र की क्षमता को और बढ़ाती है।` : `the presence of powerful yogas like '${yogaNames}' further enhances the potential of this area.`));
      }

      const aspectsOnHouse = aspects.filter(aspect => aspect.house === houseNum);
      const beneficPlanets = ['Jupiter', 'Venus', 'Moon', 'Mercury'];
      const maleficPlanets = ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'];
      const beneficAspects = aspectsOnHouse.filter(a => beneficPlanets.includes(a.planet));
      const maleficAspects = aspectsOnHouse.filter(a => maleficPlanets.includes(a.planet));

      if (beneficAspects.length > 0) {
          const aspectingPlanets = beneficAspects.map(a => getPlanetName(a.planet, lang)).join(', ');
          positiveFactors.push((lang === 'hi' ? `${aspectingPlanets} से सहायक पहलू इस क्षेत्र में विकास और अवसरों का संकेत देते हैं।` : `supportive aspects from ${aspectingPlanets} indicate growth and opportunities in this area.`));
      }
      if (maleficAspects.length > 0) {
          const aspectingPlanets = maleficAspects.map(a => getPlanetName(a.planet, lang)).join(', ');
          challengingFactors.push((lang === 'hi' ? `${aspectingPlanets} से चुनौतीपूर्ण पहलू इस क्षेत्र में बाधाओं या संघर्षों का संकेत दे सकते हैं।` : `challenging aspects from ${aspectingPlanets} may indicate obstacles or conflicts in this area.`));
      }

      let narrative = lang === 'hi'
          ? `${getLifeAreaName(area.name, lang)} का क्षेत्र, जो ${houseNum}वें घर द्वारा शासित है, आपके जीवन भर के लिए एक महत्वपूर्ण विषय है। इसकी नींव इसके स्वामी, ${translatedLord}, द्वारा रखी गई है, जो ${strengthDesc}। यह ${lordPlacementHouse}वें घर में स्थित है, जो आपके ${getLifeAreaName(area.name, lang)} को ${theme} के मामलों से जोड़ता है। ${dispositorNarrative}`
          : `The domain of your ${area.name}, governed by your ${getOrdinal(houseNum)} house, is a significant theme throughout your life. Its foundation is laid by its lord, ${translatedLord}, which ${strengthDesc}. It is placed in the ${getOrdinal(lordPlacementHouse)} house, linking your ${area.name.toLowerCase()} to matters of ${theme}. ${dispositorNarrative}`;
          
      if (positiveFactors.length > 0) {
          narrative += lang === 'hi' ? `इस क्षेत्र में क्षमता ${positiveFactors.join(' और ')} से काफी बढ़ जाती है। ` : `The potential in this area is significantly enhanced by ${positiveFactors.join(' and ')}. `;
      }
       if (challengingFactors.length > 0) {
          narrative += lang === 'hi' ? `हालांकि, ${challengingFactors.join(' और ')} के कारण बाधाएं आ सकती हैं। ` : `However, obstacles may arise due to ${challengingFactors.join(' and ')}. `;
      }

      const planetsInHouse = Object.entries(chartData.planetaryPositions.sidereal).filter(([p, d]) => d?.longitude && PLANETS.includes(p) && getHouseOfPlanet(d.longitude, cuspDegrees) === houseNum).map(([p]) => getPlanetName(p, lang));
      if (planetsInHouse.length > 0) {
          narrative += lang === 'hi' ? `इस घर में ${planetsInHouse.join(', ')} स्थित हैं, जो अपनी ऊर्जा सीधे इस क्षेत्र में लाते हैं। ` : `The planets ${planetsInHouse.join(', ')} are situated here, lending their direct energies to this area. `;
      }
      
      // New lifelong Dasha analysis
      const friendlyDashaLords = allMahadashaLords.filter(lord => PLANETARY_RELATIONSHIPS[houseLord]?.friends.includes(lord));
      const enemyDashaLords = allMahadashaLords.filter(lord => PLANETARY_RELATIONSHIPS[houseLord]?.enemies.includes(lord));

      let timingNarrative = '';
      if (allMahadashaLords.includes(houseLord)) {
        timingNarrative += lang === 'hi' ? `${translatedLord} की महादशा आपके जीवन में इस क्षेत्र के लिए एक महत्वपूर्ण और निर्णायक अवधि होगी। ` : `The major period of ${translatedLord} itself will be a pivotal and defining time for this area in your life. `;
      }
      if (friendlyDashaLords.length > 0) {
        timingNarrative += lang === 'hi' ? `आपके जीवन के दौरान, ${friendlyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} जैसे मित्र ग्रहों द्वारा शासित प्रमुख अवधियाँ इस क्षेत्र में प्राकृतिक विकास और अवसरों को लाएंगी। ` : `Throughout your life, major periods ruled by friendly planets like ${friendlyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} will bring natural growth and opportunities to this area. `;
      }
      if (enemyDashaLords.length > 0) {
        timingNarrative += lang === 'hi' ? `इसके विपरीत, ${enemyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} द्वारा शासित अवधियों में इस डोमेन में चुनौतियों का सामना करना पड़ सकता है, जिसके लिए अधिक प्रयास और लचीलेपन की आवश्यकता होगी।` : `Conversely, periods ruled by ${enemyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} may present challenges in this domain, requiring greater effort and resilience.`;
      }
      
      if (timingNarrative) {
          narrative += timingNarrative;
      }

      // --- Varga Analysis ---
      if (area.varga && chartData.divisionalPositions && chartData.divisionalPositions[area.varga]) {
        const vargaChart = chartData.divisionalPositions[area.varga];
        const vargaHouses = chartData[`${area.varga.toLowerCase()}_houses`];
        const vargaHouseCusps = vargaHouses?.map(h => toDegrees(h.start_dms));
        const vargaLagnaLord = vargaHouses?.[0]?.start_rashi_lord;

        if(vargaHouseCusps && vargaLagnaLord) {
            const lordInVargaHouse = getHouseOfPlanet(vargaChart[houseLord]?.longitude, vargaHouseCusps);
            const vargaLagnaLordInVargaHouse = getHouseOfPlanet(vargaChart[vargaLagnaLord]?.longitude, vargaHouseCusps);

            // D10 specific analysis for Career/Profession
            if (area.varga === 'D10') {
                const d10AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d10AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d10LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);

                if (area.name === 'Career') {
                    if (lang === 'hi') {
                        narrative += ` आपके D10 चार्ट में, जो आपके करियर का सूक्ष्म जगत है, 10वें घर का स्वामी (${translatedLord}) ${d10LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है, जो आपके पेशेवर जीवन में इसके महत्व को दर्शाता है।`;
                        narrative += ` D10 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D10 में ${d10AscendantLordDignity} है, जो आपके करियर की समग्र दिशा को प्रभावित करता है।`;
                        if (d10AscendantPlanet) {
                            narrative += ` D10 लग्न में ${getPlanetName(d10AscendantPlanet, lang)} की उपस्थिति आपके करियर पथ पर इसके गुणों का एक मजबूत प्रभाव डालती है।`;
                        }
                    } else {
                        narrative += ` In your D10 chart, the microcosm of your career, the 10th lord (${houseLord}) is ${d10LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house, indicating its significance in your professional life.`;
                        narrative += ` The D10 ascendant lord is ${vargaLagnaLord}, and it is ${d10AscendantLordDignity} in the D10, influencing the overall direction of your career.`;
                        if (d10AscendantPlanet) {
                            narrative += ` The presence of ${d10AscendantPlanet} in the D10 ascendant adds a strong influence of its qualities on your career path.`;
                        }
                    }
                } else if (area.name === 'Profession') {
                    if (lang === 'hi') {
                        narrative += ` आपके पेशे के लिए D10 चार्ट में, 10वें घर का स्वामी (${translatedLord}) का ${lordInVargaHouse}वें घर में होना आपके काम की प्रकृति को दर्शाता है।`;
                        narrative += ` D10 लग्न का स्वामी, ${getPlanetName(vargaLagnaLord, lang)}, जो ${d10AscendantLordDignity} है, यह निर्धारित करता है कि आप अपने पेशे को कैसे अपनाते हैं।`;
                        if (d10AscendantPlanet) {
                            narrative += ` ${getPlanetName(d10AscendantPlanet, lang)} का D10 लग्न में होना आपके काम के माहौल और भूमिका में इसके गुणों को लाता है।`;
                        }
                    } else {
                        narrative += ` In the D10 chart for your profession, the placement of the 10th lord (${houseLord}) in the ${getOrdinal(lordInVargaHouse)} house indicates the nature of your work.`;
                        narrative += ` The D10 ascendant lord, ${vargaLagnaLord}, which is ${d10AscendantLordDignity}, determines how you approach your profession.`;
                        if (d10AscendantPlanet) {
                            narrative += ` The presence of ${d10AscendantPlanet} in the D10 ascendant brings its qualities into your work environment and role.`;
                        }
                    }
                }
            } else if (area.varga === 'D2' && area.name === 'Wealth') {
                const d2AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d2AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d2LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D2 (होरा) चार्ट में, जो आपके धन और वित्त का विश्लेषण करता है, 2वें घर का स्वामी (${translatedLord}) ${d2LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D2 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D2 में ${d2AscendantLordDignity} है, जो आपकी वित्तीय स्थिति को प्रभावित करता है।`;
                    if (d2AscendantPlanet) {
                        narrative += ` D2 लग्न में ${getPlanetName(d2AscendantPlanet, lang)} की उपस्थिति आपके धन संचय के रास्ते पर इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D2 (Hora) chart, which analyzes your wealth and finances, the 2nd lord (${houseLord}) is ${d2LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D2 ascendant lord is ${vargaLagnaLord}, and it is ${d2AscendantLordDignity} in the D2, influencing your financial standing.`;
                    if (d2AscendantPlanet) {
                        narrative += ` The presence of ${d2AscendantPlanet} in the D2 ascendant adds a strong influence of its qualities on your path to wealth accumulation.`;
                    }
                }
            } else if (area.varga === 'D7' && area.name === 'Children') {
                const d7AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d7AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d7LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D7 (सप्तमांश) चार्ट में, जो आपकी संतान और वंश का विश्लेषण करता है, 5वें घर का स्वामी (${translatedLord}) ${d7LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D7 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D7 में ${d7AscendantLordDignity} है, जो संतान संबंधी मामलों को प्रभावित करता है।`;
                    if (d7AscendantPlanet) {
                        narrative += ` D7 लग्न में ${getPlanetName(d7AscendantPlanet, lang)} की उपस्थिति आपकी संतान संबंधी इच्छाओं पर इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D7 (Saptamsa) chart, which analyzes your children and progeny, the 5th lord (${houseLord}) is ${d7LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D7 ascendant lord is ${vargaLagnaLord}, and it is ${d7AscendantLordDignity} in the D7, influencing matters related to children.`;
                    if (d7AscendantPlanet) {
                        narrative += ` The presence of ${d7AscendantPlanet} in the D7 ascendant adds a strong influence of its qualities on your desires concerning children.`;
                    }
                }
            } else if (area.varga === 'D9' && area.name === 'Marriage') {
                const d9AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d9AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d9LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D9 (नवांश) चार्ट में, जो आपके विवाह और साझेदारी का विश्लेषण करता है, 7वें घर का स्वामी (${translatedLord}) ${d9LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D9 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D9 में ${d9AscendantLordDignity} है, जो आपके वैवाहिक जीवन की गुणवत्ता को प्रभावित करता है।`;
                    if (d9AscendantPlanet) {
                        narrative += ` D9 लग्न में ${getPlanetName(d9AscendantPlanet, lang)} की उपस्थिति आपके रिश्तों में इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D9 (Navamsa) chart, which analyzes your marriage and partnerships, the 7th lord (${houseLord}) is ${d9LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D9 ascendant lord is ${vargaLagnaLord}, and it is ${d9AscendantLordDignity} in the D9, influencing the quality of your married life.`;
                    if (d9AscendantPlanet) {
                        narrative += ` The presence of ${d9AscendantPlanet} in the D9 ascendant adds a strong influence of its qualities on your relationships.`;
                    }
                }
            } else if (area.varga === 'D12' && area.name === 'Health') {
                const d12AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d12AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d12LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D12 (द्वादशांश) चार्ट में, जो आपके स्वास्थ्य और माता-पिता के मुद्दों का विश्लेषण करता है, 6वें घर का स्वामी (${translatedLord}) ${d12LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D12 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D12 में ${d12AscendantLordDignity} है, जो आपके स्वास्थ्य और कल्याण को प्रभावित करता है।`;
                    if (d12AscendantPlanet) {
                        narrative += ` D12 लग्न में ${getPlanetName(d12AscendantPlanet, lang)} की उपस्थिति आपके स्वास्थ्य पर इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D12 (Dwadasamsa) chart, which analyzes your health and parental issues, the 6th lord (${houseLord}) is ${d12LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D12 ascendant lord is ${vargaLagnaLord}, and it is ${d12AscendantLordDignity} in the D12, influencing your health and well-being.`;
                    if (d12AscendantPlanet) {
                        narrative += ` The presence of ${d12AscendantPlanet} in the D12 ascendant adds a strong influence of its qualities on your health.`;
                    }
                }
            } else if (area.varga === 'D30' && (area.name === 'Litigation' || area.name === 'Health')) {
                const d30AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d30AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d30LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D30 (त्रिशांश) चार्ट में, जो दुर्भाग्य और बीमारियों का विश्लेषण करता है, इस घर का स्वामी (${translatedLord}) ${d30LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D30 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D30 में ${d30AscendantLordDignity} है, जो आपके जीवन में चुनौतियों और बाधाओं को प्रभावित करता है।`;
                    if (d30AscendantPlanet) {
                        narrative += ` D30 लग्न में ${getPlanetName(d30AscendantPlanet, lang)} की उपस्थिति इन क्षेत्रों में इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D30 (Trimsamsa) chart, which analyzes misfortunes and diseases, the house lord (${houseLord}) is ${d30LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D30 ascendant lord is ${vargaLagnaLord}, and it is ${d30AscendantLordDignity} in the D30, influencing challenges and obstacles in your life.`;
                    if (d30AscendantPlanet) {
                        narrative += ` The presence of ${d30AscendantPlanet} in the D30 ascendant brings its qualities into these areas.`;
                    }
                }
            } else if (area.varga === 'D3' && area.name === 'Siblings, Courage, Communication') {
                const d3AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d3AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d3LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D3 (द्रेष्काण) चार्ट में, जो आपके भाई-बहनों, साहस और संचार का विश्लेषण करता है, 3वें घर का स्वामी (${translatedLord}) ${d3LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D3 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D3 में ${d3AscendantLordDignity} है, जो आपके संबंधों और संचार कौशल को प्रभावित करता है।`;
                    if (d3AscendantPlanet) {
                        narrative += ` D3 लग्न में ${getPlanetName(d3AscendantPlanet, lang)} की उपस्थिति आपके भाई-बहनों और संचार पर इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D3 (Drekkana) chart, which analyzes your siblings, courage, and communication, the 3rd lord (${houseLord}) is ${d3LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D3 ascendant lord is ${vargaLagnaLord}, and it is ${d3AscendantLordDignity} in the D3, influencing your relationships and communication skills.`;
                    if (d3AscendantPlanet) {
                        narrative += ` The presence of ${d3AscendantPlanet} in the D3 ascendant adds a strong influence of its qualities on your siblings and communication.`;
                    }
                }
            } else if (area.varga === 'D6' && area.name === 'Litigation') {
                const d6AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d6AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d6LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D6 (षष्ठांश) चार्ट में, जो मुकदमेबाजी और संघर्षों का विश्लेषण करता है, 6वें घर का स्वामी (${translatedLord}) ${d6LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D6 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D6 में ${d6AscendantLordDignity} है, जो आपके जीवन में कानूनी और शत्रु संबंधी मामलों को प्रभावित करता है।`;
                    if (d6AscendantPlanet) {
                        narrative += ` D6 लग्न में ${getPlanetName(d6AscendantPlanet, lang)} की उपस्थिति इन क्षेत्रों में इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D6 (Shasthamsa) chart, which analyzes litigation and conflicts, the 6th lord (${houseLord}) is ${d6LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D6 ascendant lord is ${vargaLagnaLord}, and it is ${d6AscendantLordDignity} in the D6, influencing legal and enemy-related matters in your life.`;
                    if (d6AscendantPlanet) {
                        narrative += ` The presence of ${d6AscendantPlanet} in the D6 ascendant brings its qualities into these areas.`;
                    }
                }
            } else if (area.varga === 'D60' && area.name === 'Past Karma') {
                const d60AscendantPlanet = Object.entries(vargaChart).find(([, planetData]) => 
                    getHouseOfPlanet(planetData.longitude, vargaHouseCusps) === 1
                )?.[0];
                const d60AscendantLordDignity = getPlanetDignityDescription(vargaLagnaLord, vargaChart[vargaLagnaLord], lang);
                const d60LordDignity = getPlanetDignityDescription(houseLord, vargaChart[houseLord], lang);
      
                if (lang === 'hi') {
                    narrative += ` D60 (षष्ट्यंश) चार्ट में, जो आपके पिछले कर्मों और नियति का विश्लेषण करता है, D1 लग्न का स्वामी (${translatedLord}) ${d60LordDignity} है और ${lordInVargaHouse}वें घर में स्थित है।`;
                    narrative += ` D60 लग्न का स्वामी ${getPlanetName(vargaLagnaLord, lang)} है और यह D60 में ${d60AscendantLordDignity} है, जो आपकी नियति की समग्र दिशा को प्रभावित करता है।`;
                    if (d60AscendantPlanet) {
                        narrative += ` D60 लग्न में ${getPlanetName(d60AscendantPlanet, lang)} की उपस्थिति आपके जीवन पथ पर इसके गुणों का प्रभाव डालती है।`;
                    }
                } else {
                    narrative += ` In your D60 (Shashtiamsa) chart, which analyzes your past karma and destiny, the D1 ascendant lord (${houseLord}) is ${d60LordDignity} and is placed in the ${getOrdinal(lordInVargaHouse)} house.`;
                    narrative += ` The D60 ascendant lord is ${vargaLagnaLord}, and it is ${d60AscendantLordDignity} in the D60, influencing the overall direction of your destiny.`;
                    if (d60AscendantPlanet) {
                        narrative += ` The presence of ${d60AscendantPlanet} in the D60 ascendant adds a strong influence of its qualities on your life path.`;
                    }
                }
            } else {
                let vargaNarrative = '';
                if (lang === 'hi') {
                    vargaNarrative = `आपके ${area.varga} चार्ट में, जो इस जीवन क्षेत्र का सूक्ष्म विश्लेषण प्रदान करता है, इस घर का स्वामी (${translatedLord}) ${lordInVargaHouse}वें घर में स्थित है। ${area.varga} लग्न का स्वामी, ${getPlanetName(vargaLagnaLord, lang)}, ${vargaLagnaLordInVargaHouse}वें घर में है। `;
                } else {
                    vargaNarrative = `In your ${area.varga} chart, which provides a microscopic view of this life area, the lord of this house (${houseLord}) is placed in the ${getOrdinal(lordInVargaHouse)} house. The lord of the ${area.varga} ascendant, ${vargaLagnaLord}, is in the ${getOrdinal(vargaLagnaLordInVargaHouse)} house. `;
                }
                narrative += vargaNarrative;
            }
        }
      }
      reports[area.name.toLowerCase()] = { narrative: narrative.trim() };
  });
  return reports;
}

/* ======================================================
   Human-readable Summary
====================================================== */
function generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaLordAnalysis, lang = 'en') {
    const HEADERS = {
        en: {
            dashaAnalysis: '=== Dasha Analysis for Selected Date ===',
            lifeAreasSummary: '=== Life Areas Summary ===',
            eventTimeline: '=== Event Timeline (Transits) ===',
            birthChartYogas: '=== Key Yogas in Your Chart ===',
            noMajorYogas: 'No major Yogas active currently.'
        },
        hi: {
            dashaAnalysis: '=== चयनित तिथि के लिए दशा विश्लेषण ===',
            lifeAreasSummary: '=== जीवन क्षेत्र सारांश ===',
            eventTimeline: '=== घटना समयरेखा (गोचर) ===',
            birthChartYogas: '=== आपकी कुंडली में मुख्य योग ===',
            noMajorYogas: 'वर्तमान में कोई बड़ा योग सक्रिय नहीं है।'
        }
    };
    const currentHeaders = HEADERS[lang] || HEADERS['en'];

    let summary = overallReport + '\n\n';

    if (dashaLordAnalysis.length > 0) {
        summary += currentHeaders.dashaAnalysis + '\n';
        dashaLordAnalysis.forEach(analysis => {
            summary += `* ${analysis}\n`;
        });
        summary += '\n';
    }
    
    summary += currentHeaders.lifeAreasSummary + '\n';
    Object.values(lifeAreaReports).forEach(area => {
        summary += `${area.narrative}\n\n`;
    });
    
    summary += currentHeaders.eventTimeline + '\n';
    eventTimeline.forEach(ev => {
        summary += `* ${ev.narration}\n`;
    });
    summary += '\n'; 
    
    summary += currentHeaders.birthChartYogas + '\n';
    if (yogas.length > 0) {
        const yogaSynthesis = lang === 'hi'
            ? 'आपकी कुंडली में कई महत्वपूर्ण योग हैं जो आपके जीवन के विभिन्न पहलुओं को प्रभावित करते हैं। यहाँ कुछ प्रमुख हैं:\n'
            : 'Your chart features several important yogas that influence various aspects of your life. Here are some of the key ones:\n';
        summary += yogaSynthesis;
        yogas.forEach(yoga => {
            summary += `* **${yoga.name}:** ${yoga.description}\n`;
        });
    } else {
        summary += currentHeaders.noMajorYogas;
    }
    return summary;
}

/* ======================================================
   Holistic Prediction Engine
====================================================== */
const PredictionEngine = {};

PredictionEngine.generateHolisticPrediction = async (chartData, lang = 'en') => {
  if (!chartData?.ascendant) return { error: 'Invalid chart data' };

  // Planetary Powers now derived from UPBS
  const planetaryPowers = {};
  PLANETS.forEach(p => {
    // Use the UPBS total score as the primary power metric. Default to 0 if not found.
    const upbsResult = calculateUPBS(p, chartData);
    planetaryPowers[p] = {
        total: upbsResult.total || 0,
        breakdown: upbsResult.breakdown || {}
    };
  });

  const currentDasha = getCurrentMahadasha(chartData);
  const currentBhukti = getCurrentBhukti(chartData);
  const currentAntar = getCurrentAntar(chartData);

  const aspects = calculateAspects(chartData.planetaryPositions, chartData.houses);

  const atmakaraka = calculateAtmakaraka(chartData.planetaryPositions.sidereal);

  const lagnaLord = chartData.ascendant?.rashiLord;
  const lagnaLordNatalHouse = getHouseOfPlanet(
    chartData.planetaryPositions.sidereal[lagnaLord]?.longitude,
    chartData.houses.map(h => toDegrees(h.start_dms))
  );

  const moonNakshatraName = chartData.planetaryPositions.sidereal.Moon.nakshatra || (lang === 'hi' ? 'अज्ञात' : 'Unknown');
  const overallReport = getCombinedPredictionLong(
    chartData.ascendant.rashi,
    chartData.planetaryPositions.sidereal.Moon.rashi,
    moonNakshatraName, // Pass the defensively handled name
    {
      lagnaLord: lagnaLord,
      lagnaLordNatalHouse: lagnaLordNatalHouse,
      
      atmakaraka: atmakaraka,
      planetaryPowers: planetaryPowers, // Pass the entire UPBS-based powers object
      planetaryPositions: chartData.planetaryPositions.sidereal,
      houses: chartData.houses
    },
    lang
  );

  const dashaLordAnalysis = analyzeDashaLordsInChart(chartData, planetaryPowers, currentDasha, currentBhukti, currentAntar, lang);

  const yogas = detectYogas(chartData, lang);

  const lifeAreaReports = generateLifeAreaReports(chartData, planetaryPowers, chartData.ashtakavarga, yogas, aspects, lang);

  const eventTimeline = await analyzeTransits(chartData, lang);

  const summary = generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaLordAnalysis, lang);

  return { overallReport, dashaLordAnalysis, lifeAreaReports, eventTimeline, yogas, summary, lang, planetDetails: chartData.planetDetails };
};

export default PredictionEngine;