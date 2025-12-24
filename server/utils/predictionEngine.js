import { getHouseOfPlanet, calculatePlanetaryPositions, getRashiDetails, calculateAtmakaraka } from './planetaryUtils.js';
import { convertDMSToDegrees, getJulianDateUT } from './coreUtils.js';
import { getCombinedPredictionLong, getUPBSDescription, getOrdinal } from './predictionTextGenerator.js';
import { calculateAllBirthChartYogas as detectAllYogas } from './birthChartYogaUtils.js';
import { RASHI_LORDS, RASHIS, PLANET_EXALTATION_SIGN, PLANET_DEBILITATION_SIGN } from './constants.js';
import { PLANET_NAMES_HI, getPlanetName } from './birthChartYogaUtils.js';

/* ======================================================
   Constants & Utilities
====================================================== */
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const LIFE_AREAS = [
  { name: 'Career', house: 10, varga: 'D10' },
  { name: 'Profession', house: 10, varga: 'D10' },
  { name: 'Wealth', house: 2, varga: 'D2' },
  { name: 'Education', house: 5, varga: 'D9' }, // Using D9 for higher knowledge
  { name: 'Marriage', house: 7, varga: 'D9' },
  { name: 'Health', house: 6, varga: 'D12' },
  { name: 'Litigation', house: 6, varga: 'D6' }, // D6 is often seen for conflicts
  { name: 'Spirituality', house: 9, varga: 'D9' }
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
function getStrengthDescription(strengthDetails, lang = 'en') {
    const { dignity, digBala, kalaBala } = strengthDetails;

    const descriptions = [];
    
    // Dignity (Sthana Bala)
    if (dignity >= 20) {
        descriptions.push(lang === 'hi' ? 'उच्च गरिमा (उच्चाटन)' : 'high dignity (exaltation)');
    } else if (dignity >= 10) {
        descriptions.push(lang === 'hi' ? 'अच्छी गरिमा (स्वराशि)' : 'good dignity (own sign)');
    } else if (dignity <= -20) {
        descriptions.push(lang === 'hi' ? 'कमजोर गरिमा (नीच)' : 'poor dignity (debilitation)');
    }

    // Directional Strength (Dig Bala)
    if (digBala >= 60) {
        descriptions.push(lang === 'hi' ? 'मजबूत दिशात्मक शक्ति' : 'strong directional strength');
    }

    // Temporal Strength (Kala Bala)
    if (kalaBala >= 60) {
        descriptions.push(lang === 'hi' ? 'मजबूत कालिक शक्ति' : 'strong temporal strength');
    }

    if (descriptions.length === 0) {
        return ''; // No notable strength to describe
    }

    let narrative = lang === 'hi' ? 'यह ग्रह ' : 'This planet possesses ';
    narrative += descriptions.join(lang === 'hi' ? ', और ' : ', and ');
    narrative += '.';

    return " " + narrative;
}

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

  for (const [transitingPlanet, transitData] of Object.entries(transits.sidereal)) {
    if (!transitData?.longitude || !PLANETS.includes(transitingPlanet)) continue;

    const transitedHouse = getHouseOfPlanet(transitData.longitude, cuspDegrees);
    const translatedTransitingPlanet = getPlanetName(transitingPlanet, lang);

    let narration = lang === 'hi'
      ? `${translatedTransitingPlanet} का ${transitedHouse}वें घर में गोचर इस घर से संबंधित मामलों पर ध्यान केंद्रित करेगा। `
      : `The transit of ${transitingPlanet} through your ${getOrdinal(transitedHouse)} house will focus your energy on matters related to this house. `;

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
      
      let narrative = '';
      if (lang === 'hi') {
        narrative = `**${level.name_hi} स्वामी ${translatedPlanet}:** यह ग्रह आपके ${natalHouse}वें घर में ${dignityDesc} में स्थित है। यह ${strengthDescription}। `;
        if (ruledHouses.length > 0) {
          narrative += `${level.name_hi} के दौरान, ${ruledHouses.join(' और ')} भावों से संबंधित मामले प्रमुख होंगे। `;
        }
        if (level.parentLord) {
            const parentLord = level.parentLord;
            const relationship = PLANETARY_RELATIONSHIPS[parentLord]?.friends.includes(planet) ? 'मित्रतापूर्ण' :
                                 PLANETARY_RELATIONSHIPS[parentLord]?.enemies.includes(planet) ? 'शत्रुतापूर्ण' : 'तटस्थ';
            narrative += `${getPlanetName(parentLord, lang)} के साथ इसका ${relationship} संबंध बताता है कि इस अवधि के परिणाम ऊपरी अवधि के विषयों के साथ कैसे संरेखित होंगे।`;
        }
      } else {
        narrative = `**${level.name} Lord ${planet}:** This planet is located in your ${getOrdinal(natalHouse)} house in a state of ${dignityDesc}. It ${strengthDescription}. `;
        if (ruledHouses.length > 0) {
          narrative += `During its period, matters related to house(s) ${ruledHouses.join(' and ')} will be prominent. `;
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

      const positiveFactors = [];
      const challengingFactors = [];

      const sarvaPoints = ashtakavarga?.sarva?.scores?.[houseNum - 1] || 0;
      if (sarvaPoints >= 28) {
          positiveFactors.push(lang === 'hi' ? `अनुकूल सर्वाष्टकवर्ग स्कोर (${sarvaPoints})` : `a favorable Sarva Ashtakavarga score of ${sarvaPoints}`);
      } else {
          challengingFactors.push(lang === 'hi' ? `कम सर्वाष्टकवर्ग स्कोर (${sarvaPoints})` : `a low Sarva Ashtakavarga score of ${sarvaPoints}`);
      }

      const relevantYogas = yogas.filter(yoga => {
          const areaSpecificYogaNames = { 'Wealth': ['Dhana', 'Lakshmi'], 'Career': ['Raja', 'Adhipati', 'Amala', 'Pancha Mahapurusha'], 'Health': ['Harsha', 'Vipareeta'], 'Spirituality': ['Saraswati', 'Gaja Kesari', 'Adhipati'], 'Marriage': ['Raja'] };
          return yoga.planetsInvolved.includes(houseLord) || areaSpecificYogaNames[area.name]?.some(name => yoga.name.includes(name));
      });
      if (relevantYogas.length > 0) {
          positiveFactors.push(lang === 'hi' ? `शक्तिशाली योगों की उपस्थिति (जैसे '${relevantYogas[0].name}')` : `the presence of powerful yogas like '${relevantYogas[0].name}'`);
      }

      const aspectsOnHouse = aspects.filter(aspect => aspect.house === houseNum);
      const beneficPlanets = ['Jupiter', 'Venus', 'Moon', 'Mercury'];
      const maleficPlanets = ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'];
      const beneficAspects = aspectsOnHouse.filter(a => beneficPlanets.includes(a.planet));
      const maleficAspects = aspectsOnHouse.filter(a => maleficPlanets.includes(a.planet));

      if (beneficAspects.length > 0) {
          positiveFactors.push(lang === 'hi' ? `${beneficAspects.map(a => getPlanetName(a.planet, lang)).join(', ')} से सहायक पहलू` : `supportive aspects from ${beneficAspects.map(a => a.planet).join(', ')}`);
      }
      if (maleficAspects.length > 0) {
          challengingFactors.push(lang === 'hi' ? `${maleficAspects.map(a => getPlanetName(a.planet, lang)).join(', ')} से चुनौतीपूर्ण पहलू` : `challenging aspects from ${maleficAspects.map(a => a.planet).join(', ')}`);
      }

      let narrative = lang === 'hi'
          ? `${getLifeAreaName(area.name, lang)} का क्षेत्र, जो ${houseNum}वें घर द्वारा शासित है, आपके जीवन भर के लिए एक महत्वपूर्ण विषय है। इसकी नींव इसके स्वामी, ${translatedLord}, द्वारा रखी गई है, जो ${strengthDesc}। यह ${lordPlacementHouse}वें घर में स्थित है, जो आपके ${getLifeAreaName(area.name, lang)} को ${theme} के मामलों से जोड़ता है। `
          : `The domain of your ${area.name}, governed by house ${houseNum}, is a significant theme throughout your life. Its foundation is laid by its lord, ${houseLord}, which ${strengthDesc}. It is placed in the ${lordPlacementHouse}th house, linking your ${area.name.toLowerCase()} to matters of ${theme}. `;
          
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
        timingNarrative += lang === 'hi' ? `${translatedLord} की महादशा आपके जीवन में इस क्षेत्र के लिए एक महत्वपूर्ण और निर्णायक अवधि होगी। ` : `The major period of ${houseLord} itself will be a pivotal and defining time for this area in your life. `;
      }
      if (friendlyDashaLords.length > 0) {
        timingNarrative += lang === 'hi' ? `आपके जीवन के दौरान, ${friendlyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} जैसे मित्र ग्रहों द्वारा शासित प्रमुख अवधियाँ इस क्षेत्र में प्राकृतिक विकास और अवसरों को लाएंगी। ` : `Throughout your life, major periods ruled by friendly planets like ${friendlyDashaLords.join(', ')} will bring natural growth and opportunities to this area. `;
      }
      if (enemyDashaLords.length > 0) {
        timingNarrative += lang === 'hi' ? `इसके विपरीत, ${enemyDashaLords.map(l => getPlanetName(l, lang)).join(', ')} द्वारा शासित अवधियों में इस डोमेन में चुनौतियों का सामना करना पड़ सकता है, जिसके लिए अधिक प्रयास और लचीलेपन की आवश्यकता होगी।` : `Conversely, periods ruled by ${enemyDashaLords.join(', ')} may present challenges in this domain, requiring greater effort and resilience.`;
      }
      
      if (timingNarrative) {
          narrative += timingNarrative;
      }

      reports[area.name.toLowerCase()] = { narrative: narrative.trim() };
  });
  return reports;
}

/* ======================================================
   Human-readable Summary
====================================================== */
function generateSummary(overallReport, lifeAreaReports, eventTimeline, yogas, dashaLordAnalysis, lang = 'en') {
  let summary = overallReport + '\n\n';

  if (dashaLordAnalysis.length > 0) {
    summary += (lang === 'hi' ? '=== चयनित तिथि के लिए दशा विश्लेषण ===\n' : '=== Dasha Analysis for Selected Date ===\n');
    dashaLordAnalysis.forEach(analysis => {
      summary += `* ${analysis}\n`;
    });
    summary += '\n';
  }
  summary += (lang === 'hi' ? '=== जीवन क्षेत्र सारांश ===\n' : '=== Life Areas Summary ===\n');
  Object.values(lifeAreaReports).forEach(area => {
    summary += `${area.narrative}\n\n`;
  });
  summary += (lang === 'hi' ? '=== घटना समयरेखा (गोचर) ===\n' : '=== Event Timeline (Transits) ===\n');
  eventTimeline.forEach(ev => {
    summary += `* ${ev.narration}\n`;
  });
  summary += '\n'; // Add an extra newline for spacing
  summary += (lang === 'hi' ? '=== जन्म कुंडली योग ===\n' : '=== Birth Chart Yogas ===\n');
  if (yogas.length > 0) {
    yogas.forEach(yoga => {
      summary += `* ${yoga.name}: ${yoga.description}\n`;
    });
  } else {
    summary += (lang === 'hi' ? 'वर्तमान में कोई बड़ा योग सक्रिय नहीं है।' : 'No major Yogas active currently.');
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
    planetaryPowers[p] = chartData.planetDetails.upbsScores?.[p]?.total || 0;
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

