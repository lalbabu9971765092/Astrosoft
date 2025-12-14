export const YOGA_DEFINITIONS_EN = {
    GajaKesari: {
        name: 'Gaja Kesari Yoga',
        description: 'Jupiter is in a Kendra (1st, 4th, 7th, or 10th house) from the Moon. This yoga blesses the native with intelligence, wealth, and fame.'
    },
    RajaYoga: {
        name: 'Raja Yoga',
        description: (kendraLord, trikonaLord) => `Lord of Kendra house, ${kendraLord}, is in conjunction with lord of Trikona house, ${trikonaLord}. This combination indicates success, status, and authority.`
    },
    DhanaYoga: {
        name: 'Dhana Yoga',
        description: (dhanaLord, trikonaLord) => `Lord of Dhana house, ${dhanaLord}, is in conjunction with lord of Trikona house, ${trikonaLord}. This combination indicates wealth and prosperity.`
    },
    RuchakaYoga: {
        name: 'Ruchaka Yoga',
        description: 'Formed by Mars, this yoga bestows courage, strength, and victory over enemies.'
    },
    BhadraYoga: {
        name: 'Bhadra Yoga',
        description: 'Formed by Mercury, this yoga grants intelligence, sharp intellect, and skill in communication.'
    },
    HamsaYoga: {
        name: 'Hamsa Yoga',
        description: 'Formed by Jupiter, this yoga indicates a person who is respected, learned, and righteous.'
    },
    MalavyaYoga: {
        name: 'Malavya Yoga',
        description: 'Formed by Venus, this yoga blesses with luxury, artistic talents, and a happy married life.'
    },
    SasaYoga: {
        name: 'Sasa Yoga',
        description: 'Formed by Saturn, this yoga gives authority, leadership, and a long life.'
    },
    HarshaYoga: {
        name: 'Harsha Yoga',
        description: 'The 6th lord is in the 8th or 12th house, giving happiness, health and victory over enemies.'
    },
    SaralaYoga: {
        name: 'Sarala Yoga',
        description: 'The 8th lord is in the 6th or 12th house, giving wisdom, wealth, and long life.'
    },
    VimalaYoga: {
        name: 'Vimala Yoga',
        description: 'The 12th lord is in the 6th or 8th house, giving independence, noble character, and wealth.'
    },
    NeechaBhangaRajaYoga: {
        name: 'Neecha Bhanga Raja Yoga',
        description: (planet, planetRashi, dispositorPlanet) => `The planet ${planet} is in its debilitation sign (${planetRashi}), but its dispositor ${dispositorPlanet} is in a Kendra from the Lagna or the Moon, cancelling the debilitation and giving rise to a Raja Yoga.`
    },
    KendrumaYoga: {
        name: 'Kendruma Yoga',
        description: 'No planets (except Sun, Rahu, and Ketu) in the 2nd or 12th house from the Moon. This yoga can indicate poverty, struggle, and lack of support from others.'
    },
    ChandraMangalaYoga: {
        name: 'Chandra Mangala Yoga',
        description: 'Moon and Mars are in the same house. This yoga blesses the native with wealth, courage, and determination.'
    },
    BudhadityaYoga: {
        name: 'Budhaditya Yoga',
        description: 'Sun and Mercury are in the same house. This yoga blesses the native with intelligence, sharp intellect, and good reputation.'
    },
    LakshmiYoga: {
        name: 'Lakshmi Yoga',
        description: 'The lord of the 9th house and Venus are strong and well-placed, blessing the native with immense wealth, prosperity, and good fortune.'
    },
    DharmaKarmaAdhipatiYoga: {
        name: 'Dharma Karma Adhipati Yoga',
        description: 'The lords of the 9th and 10th houses are in conjunction, indicating a rise in life due to righteous deeds and professional success.'
    },
    AmalaYogaFromAscendant: {
        name: 'Amala Yoga',
        description: (planet) => `A benefic planet, ${planet}, is in the 10th house from the Ascendant, bringing prosperity and a good reputation.`
    },
    AmalaYogaFromMoon: {
        name: 'Amala Yoga',
        description: (planet) => `A benefic planet, ${planet}, is in the 10th house from the Moon, bringing prosperity and a good reputation.`
    },
    SaraswatiYoga: {
        name: 'Saraswati Yoga',
        description: 'Jupiter, Venus, and Mercury are in Kendra or Trikona houses, blessing the native with intelligence, creativity, and knowledge.'
    },
    ParvataYoga: {
        name: 'Parvata Yoga',
        description: 'The lord of the Ascendant is in a Kendra or Trikona house and is in its own or exaltation sign, making the native fortunate, wealthy, and charitable.'
    },
    KahalaYoga: {
        name: 'Kahala Yoga',
        description: 'The lords of the 4th and 9th houses are in mutual Kendras, making the native bold, stubborn, and a leader.'
    }
};

export const YOGA_DEFINITIONS_HI = {
    GajaKesari: {
        name: 'गज केसरी योग',
        description: 'चंद्रमा से गुरु केंद्र (पहले, चौथे, सातवें या दसवें घर) में है। यह योग जातक को बुद्धि, धन और प्रसिद्धि प्रदान करता है।'
    },
    RajaYoga: {
        name: 'राज योग',
        description: (kendraLord, trikonaLord) => `केंद्र भाव के स्वामी, ${kendraLord}, त्रिकोण भाव के स्वामी, ${trikonaLord} के साथ युति में हैं। यह संयोजन सफलता, पद और अधिकार को इंगित करता है।`
    },
    DhanaYoga: {
        name: 'धन योग',
        description: (dhanaLord, trikonaLord) => `धन भाव के स्वामी, ${dhanaLord}, त्रिकोण भाव के स्वामी, ${trikonaLord} के साथ युति में हैं। यह संयोजन धन और समृद्धि को इंगित करता है।`
    },
    RuchakaYoga: {
        name: 'रुचक योग',
        description: 'मंगल द्वारा निर्मित, यह योग साहस, शक्ति और शत्रुओं पर विजय प्रदान करता है।'
    },
    BhadraYoga: {
        name: 'भद्र योग',
        description: 'बुध द्वारा निर्मित, यह योग बुद्धि, तीक्ष्ण बुद्धि और संचार कौशल प्रदान करता है।'
    },
    HamsaYoga: {
        name: 'हंस योग',
        description: 'गुरु द्वारा निर्मित, यह योग ऐसे व्यक्ति को इंगित करता है जो सम्मानित, विद्वान और धर्मी है।'
    },
    MalavyaYoga: {
        name: 'मालव्य योग',
        description: 'शुक्र द्वारा निर्मित, यह योग विलासिता, कलात्मक प्रतिभा और सुखी वैवाहिक जीवन का आशीर्वाद देता है।'
    },
    SasaYoga: {
        name: 'शश योग',
        description: 'शनि द्वारा निर्मित, यह योग अधिकार, नेतृत्व और लंबी आयु प्रदान करता है।'
    },
    HarshaYoga: {
        name: 'हर्ष योग',
        description: 'छठे भाव का स्वामी आठवें या बारहवें भाव में है, जो खुशी, स्वास्थ्य और शत्रुओं पर विजय देता है।'
    },
    SaralaYoga: {
        name: 'सरल योग',
        description: 'आठवें भाव का स्वामी छठे या बारहवें भाव में है, जो ज्ञान, धन और लंबी आयु देता है।'
    },
    VimalaYoga: {
        name: 'विमल योग',
        description: 'बारहवें भाव का स्वामी छठे या आठवें भाव में है, जो स्वतंत्रता, नेक चरित्र और धन देता है।'
    },
    NeechaBhangaRajaYoga: {
        name: 'नीच भंग राज योग',
        description: (planet, planetRashi, dispositorPlanet) => `ग्रह ${planet} अपनी नीच राशि (${planetRashi}) में है, लेकिन इसका अधिपति ${dispositorPlanet} लग्न या चंद्रमा से केंद्र में है, जो नीचता को रद्द करता है और राज योग को जन्म देता है।`
    },
    KendrumaYoga: {
        name: 'केंद्रुम योग',
        description: 'चंद्रमा से दूसरे या बारहवें भाव में कोई ग्रह (सूर्य, राहु और केतु को छोड़कर) नहीं है। यह योग गरीबी, संघर्ष और दूसरों से समर्थन की कमी को इंगित करता है।'
    },
    ChandraMangalaYoga: {
        name: 'चंद्र मंगल योग',
        description: 'चंद्रमा और मंगल एक ही भाव में हैं। यह योग जातक को धन, साहस और दृढ़ संकल्प का आशीर्वाद देता है।'
    },
    BudhadityaYoga: {
        name: 'बुधादित्य योग',
        description: 'सूर्य और बुध एक ही भाव में हैं। यह योग जातक को बुद्धि, तीक्ष्ण बुद्धि और अच्छी प्रतिष्ठा का आशीर्वाद देता है।'
    },
    LakshmiYoga: {
        name: 'लक्ष्मी योग',
        description: 'नवम भाव का स्वामी और शुक्र मजबूत और अच्छी तरह से स्थित हैं, जो जातक को अपार धन, समृद्धि और सौभाग्य का आशीर्वाद देते हैं।'
    },
    DharmaKarmaAdhipatiYoga: {
        name: 'धर्म कर्म अधिपति योग',
        description: 'नवम और दशम भाव के स्वामी युति में हैं, जो धार्मिक कार्यों और व्यावसायिक सफलता के कारण जीवन में वृद्धि को इंगित करता है।'
    },
    AmalaYogaFromAscendant: {
        name: 'अमला योग',
        description: (planet) => `एक शुभ ग्रह, ${planet}, लग्न से दसवें भाव में है, जो समृद्धि और अच्छी प्रतिष्ठा लाता है।`
    },
    AmalaYogaFromMoon: {
        name: 'अमला योग',
        description: (planet) => `एक शुभ ग्रह, ${planet}, चंद्रमा से दसवें भाव में है, जो समृद्धि और अच्छी प्रतिष्ठा लाता है।`
    },
    SaraswatiYoga: {
        name: 'सरस्वती योग',
        description: 'गुरु, शुक्र और बुध केंद्र या त्रिकोण भाव में हैं, जो जातक को बुद्धि, रचनात्मकता और ज्ञान का आशीर्वाद देते हैं।'
    },
    ParvataYoga: {
        name: 'पर्वत योग',
        description: 'लग्न का स्वामी केंद्र या त्रिकोण भाव में है और अपनी स्वराशि या उच्च राशि में है, जो जातक को भाग्यशाली, धनी और परोपकारी बनाता है।'
    },
    KahalaYoga: {
        name: 'कहला योग',
        description: 'चौथे और नौवें भाव के स्वामी एक-दूसरे के केंद्र में हैं, जो जातक को साहसी, जिद्दी और नेता बनाता है।'
    }
};