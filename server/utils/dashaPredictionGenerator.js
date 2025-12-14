// server/utils/dashaPredictionGenerator.js
// Programmatically generate 729 Dasha-Bhukti-Antar predictions
// Usage: import { dasha } from './dasha_full_729.js';
// dasha["Sun"]["Moon"]["Mars"] -> prediction string

const planets = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'
];

// Short thematic keywords for each planet used to build coherent predictions
const themes_en = {
  Sun: {
    core: 'authority, leadership and identity',
    tone: 'confident, ambitious',
    areas: 'career, reputation, father-figures'
  },
  Moon: {
    core: 'emotions, comfort and inner security',
    tone: 'sensitive, receptive',
    areas: 'home, family, mental wellbeing'
  },
  Mars: {
    core: 'energy, drive and action',
    tone: 'assertive, energetic',
    areas: 'competition, courage, physical activity'
  },
  Mercury: {
    core: 'communication, learning and trade',
    tone: 'curious, adaptable',
    areas: 'education, siblings, short-trips'
  },
  Jupiter: {
    core: 'growth, wisdom and expansion',
    tone: 'optimistic, protective',
    areas: 'education, wealth, spirituality'
  },
  Venus: {
    core: 'relationships, beauty and comforts',
    tone: 'charming, artistic',
    areas: 'love, luxury, partnerships'
  },
  Saturn: {
    core: 'discipline, delay and structure',
    tone: 'steady, responsible',
    areas: 'career, long-term work, limitations'
  },
  Rahu: {
    core: 'ambition, unconventional desire and disruption',
    tone: 'intense, restless',
    areas: 'innovation, foreign contacts, material craving'
  },
  Ketu: {
    core: 'detachment, spiritual insight and past karma',
    tone: 'introverted, cutting',
    areas: 'spirituality, letting-go, isolation'
  }
};

const themes_hi = {
    Sun: {
        core: 'अधिकार, नेतृत्व और पहचान',
        tone: 'आत्मविश्वासी, महत्वाकांक्षी',
        areas: 'करियर, प्रतिष्ठा, पितृ-आकृतियाँ'
    },
    Moon: {
        core: 'भावनाएं, आराम और आंतरिक सुरक्षा',
        tone: 'संवेदनशील, ग्रहणशील',
        areas: 'घर, परिवार, मानसिक स्वास्थ्य'
    },
    Mars: {
        core: 'ऊर्जा, ड्राइव और कार्रवाई',
        tone: 'दृढ़, ऊर्जावान',
        areas: 'प्रतिस्पर्धा, साहस, शारीरिक गतिविधि'
    },
    Mercury: {
        core: 'संचार, सीखना और व्यापार',
        tone: 'जिज्ञासु, अनुकूलनीय',
        areas: 'शिक्षा, भाई-बहन, छोटी यात्राएँ'
    },
    Jupiter: {
        core: 'विकास, ज्ञान और विस्तार',
        tone: 'आशावादी, सुरक्षात्मक',
        areas: 'शिक्षा, धन, आध्यात्मिकता'
    },
    Venus: {
        core: 'रिश्ते, सुंदरता और सुख-सुविधाएँ',
        tone: 'आकर्षक, कलात्मक',
        areas: 'प्रेम, विलासिता, साझेदारी'
    },
    Saturn: {
        core: 'अनुशासन, देरी और संरचना',
        tone: 'स्थिर, जिम्मेदार',
        areas: 'करियर, दीर्घकालिक कार्य, सीमाएँ'
    },
    Rahu: {
        core: 'महत्वाकांक्षा, अपरंपरागत इच्छा और व्यवधान',
        tone: 'तीव्र, बेचैन',
        areas: 'नवाचार, विदेशी संपर्क, भौतिक लालसा'
    },
    Ketu: {
        core: 'विरक्ति, आध्यात्मिक अंतर्दृष्टि और पूर्व कर्म',
        tone: 'अंतर्मुखी, कटु',
        areas: 'आध्यात्मिकता, त्याग, अलगाव'
    }
};

const planetNames_hi = {
    Sun: 'सूर्य',
    Moon: 'चंद्रमा',
    Mars: 'मंगल',
    Mercury: 'बुध',
    Jupiter: 'बृहस्पति',
    Venus: 'शुक्र',
    Saturn: 'शनि',
    Rahu: 'राहु',
    Ketu: 'केतु'
};


// Helper to combine themes into readable sentences
function combineEffects(maha, bhukti, antar, lang = 'en') {
  const currentThemes = lang === 'hi' ? themes_hi : themes_en;
  const M = currentThemes[maha];
  const B = currentThemes[bhukti];
  const A = currentThemes[antar];

  const translatedMaha = lang === 'hi' ? planetNames_hi[maha] : maha;
  const translatedBhukti = lang === 'hi' ? planetNames_hi[bhukti] : bhukti;
  const translatedAntar = lang === 'hi' ? planetNames_hi[antar] : antar;

  const phrases = {
    en: {
        intro: `During the ${maha} mahadasha, in ${bhukti} bhukti and ${antar} antar, expect influences of ${M.core} (${M.areas}).`,
        primary: `The ${maha} layer brings a ${M.tone} energy focused on ${M.areas}, while the ${bhukti} bhukti emphasizes ${B.core} and steers attention toward ${B.areas}. The ${antar} antar further colors events with ${A.core}, often affecting ${A.areas}.`,
        interaction: `Combined, this period commonly highlights ${[M.areas, B.areas, A.areas].filter(Boolean).join(', ')} — expect developments that mix ${M.core}, ${B.core} and ${A.core}.`,
        advice: `Practical advice: prioritize {priority}; communicate clearly; avoid impulsive commitments. Maintain health routines and modest finances through this time.`,
        priorityLabels: {
            structure: 'steady, disciplined work and clear boundaries',
            emotion: 'emotional self-care and family discussions',
            action: 'decisive action but controlled energy',
            growth: 'learning, expansion, and seeking wise counsel',
            relations: 'nurturing relationships and diplomatic conversations',
            default: 'balanced, mindful choices'
        }
    },
    hi: {
        intro: `${translatedMaha} महादशा के दौरान, ${translatedBhukti} भुक्ति और ${translatedAntar} अंतर में, ${M.core} (${M.areas}) के प्रभावों की अपेक्षा करें।`,
        primary: `${translatedMaha} परत ${M.areas} पर केंद्रित ${M.tone} ऊर्जा लाती है, जबकि ${translatedBhukti} भुक्ति ${B.core} पर जोर देती है और ${B.areas} की ओर ध्यान आकर्षित करती है। ${translatedAntar} अंतर घटनाओं को ${A.core} से और अधिक रंगीन करता है, अक्सर ${A.areas} को प्रभावित करता है।`,
        interaction: `संयुक्त रूप से, यह अवधि आमतौर पर ${[M.areas, B.areas, A.areas].filter(Boolean).join(', ')} को उजागर करती है - ${M.core}, ${B.core} और ${A.core} के मिश्रण वाले विकास की अपेक्षा करें।`,
        advice: `व्यावहारिक सलाह: {priority} को प्राथमिकता दें; स्पष्ट रूप से संवाद करें; आवेगी प्रतिबद्धताओं से बचें। इस दौरान स्वास्थ्य दिनचर्या और मामूली वित्त बनाए रखें।`,
        priorityLabels: {
            structure: 'स्थिर, अनुशासित कार्य और स्पष्ट सीमाएँ',
            emotion: 'भावनात्मक आत्म-देखभाल और पारिवारिक चर्चाएँ',
            action: 'निर्णायक कार्रवाई लेकिन नियंत्रित ऊर्जा',
            growth: 'सीखना, विस्तार और बुद्धिमान सलाह लेना',
            relations: 'रिश्तों का पोषण और कूटनीतिक बातचीत',
            default: 'संतुलित, सचेत विकल्प'
        }
    }
  };

  const p = phrases[lang];
  const priority = choosePriority(maha, bhukti, antar, lang);

  const intro = p.intro;
  const primary = p.primary;
  const interaction = p.interaction;
  const advice = p.advice.replace('{priority}', priority);

  return `${intro} ${primary} ${interaction} ${advice}`;
}

// Choose a prioritized action recommendation based on planetary mix
function choosePriority(maha, bhukti, antar, lang = 'en') {
  const phrases = {
    en: {
        structure: 'steady, disciplined work and clear boundaries',
        emotion: 'emotional self-care and family discussions',
        action: 'decisive action but controlled energy',
        growth: 'learning, expansion, and seeking wise counsel',
        relations: 'nurturing relationships and diplomatic conversations',
        default: 'balanced, mindful choices'
    },
    hi: {
        structure: 'स्थिर, अनुशासित कार्य और स्पष्ट सीमाएँ',
        emotion: 'भावनात्मक आत्म-देखभाल और पारिवारिक चर्चाएँ',
        action: 'निर्णायक कार्रवाई लेकिन नियंत्रित ऊर्जा',
        growth: 'सीखना, विस्तार और बुद्धिमान सलाह लेना',
        relations: 'रिश्तों का पोषण और कूटनीतिक बातचीत',
        default: 'संतुलित, सचेत विकल्प'
    }
  };
  const priorityLabels = phrases[lang];

  const score = { structure: 0, emotion: 0, action: 0, growth: 0, relations: 0 };

  [maha, bhukti, antar].forEach(pl => { // Use 'pl' to avoid conflict with 'planets' array
    switch (pl) {
      case 'Sun': score.action += 1; score.structure += 1; break;
      case 'Moon': score.emotion += 2; break;
      case 'Mars': score.action += 2; break;
      case 'Mercury': score.growth += 1; score.action += 1; break;
      case 'Jupiter': score.growth += 2; break;
      case 'Venus': score.relations += 2; break;
      case 'Saturn': score.structure += 2; break;
      case 'Rahu': score.action += 1; score.growth += 1; break;
      case 'Ketu': score.emotion += 1; score.structure += 1; break;
      default: break;
    }
  });

  // pick highest
  const maxKey = Object.keys(score).reduce((a, b) => (score[a] >= score[b] ? a : b));

  return priorityLabels[maxKey] || priorityLabels.default;
}

// Build nested object of 9x9x9 predictions (this object is not needed if we generate on the fly)
// const dasha = {};
// planets.forEach(maha => {
//   dasha[maha] = {};
//   planets.forEach(bhukti => {
//     dasha[maha][bhukti] = {};
//     planets.forEach(antar => {
//       dasha[maha][bhukti][antar] = combineEffects(maha, bhukti, antar);
//     });
//   });
// });

// Optional: function to retrieve a specific prediction
export function getDashaPrediction(mahadasha, bhukti, antar, lang = 'en') {
    return combineEffects(mahadasha, bhukti, antar, lang);
}

// export { dasha }; // No need to export the full dasha object
// export default dasha; // No need to export the full dasha object