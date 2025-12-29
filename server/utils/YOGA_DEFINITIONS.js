export const YOGA_DEFINITIONS_EN = {
    GajaKesari: {
        name: 'Gaja Kesari Yoga',
        description: 'Jupiter is in a Kendra (1st, 4th, 7th, or 10th house) from the Moon. This is a powerful yoga that blesses the native with sharp intelligence, immense wealth, and lasting fame. You are likely to be respected by learned people and will be victorious over your enemies.'
    },
    RajaYoga: {
        name: 'Raja Yoga',
        description: (kendraLord, trikonaLord) => `A powerful combination for success and status, formed by the lord of a Kendra house, ${kendraLord}, in conjunction with the lord of a Trikona house, ${trikonaLord}. This yoga indicates that your actions (Kendra) and fortune (Trikona) are harmoniously linked, promising significant achievements, authority, and a high position in life.`
    },
    DhanaYoga: {
        name: 'Dhana Yoga',
        description: (dhanaLord, trikonaLord) => `A combination for wealth, formed by the lord of a Dhana house (2nd or 11th), ${dhanaLord}, in conjunction with the lord of a Trikona house (5th or 9th), ${trikonaLord}. This yoga indicates a strong potential for earning and accumulating wealth, especially during the periods of the involved planets.`
    },
    RuchakaYoga: {
        name: 'Ruchaka Yoga',
        description: 'One of the Pancha Mahapurusha Yogas, formed by Mars. It bestows a strong physique, courage, and a dynamic personality. You will be adventurous, victorious over enemies, and may rise to a high position in fields like the military, police, or engineering.'
    },
    BhadraYoga: {
        name: 'Bhadra Yoga',
        description: 'One of the Pancha Mahapurusha Yogas, formed by Mercury. It grants sharp intellect, excellent communication skills, and a youthful appearance. You are likely to be learned, witty, and successful in fields related to commerce, writing, or academia.'
    },
    HamsaYoga: {
        name: 'Hamsa Yoga',
        description: 'One of the Pancha Mahapurusha Yogas, formed by Jupiter. It indicates a person who is righteous, respected, and possesses great wisdom. You are likely to be fortunate, long-lived, and have a spiritual inclination.'
    },
    MalavyaYoga: {
        name: 'Malavya Yoga',
        description: 'One of the Pancha Mahapurusha Yogas, formed by Venus. It blesses with a charming personality, a love for arts and luxury, and a harmonious married life. You are likely to enjoy all comforts of life and be successful in creative fields.'
    },
    SasaYoga: {
        name: 'Sasa Yoga',
        description: 'One of the Pancha Mahapurusha Yogas, formed by Saturn. It gives authority, a position of leadership, and the ability to rule. You may be a bit of a loner but will be respected by the masses and enjoy a long life.'
    },
    HarshaYoga: {
        name: 'Harsha Yoga',
        description: 'A Vipareeta Raja Yoga where the 6th lord is in the 8th or 12th house. This yoga indicates happiness from unexpected sources, good health, and victory over enemies. You will be fortunate and lead a comfortable life.'
    },
    SaralaYoga: {
        name: 'Sarala Yoga',
        description: 'A Vipareeta Raja Yoga where the 8th lord is in the 6th or 12th house. This yoga grants wisdom, the ability to overcome difficulties, and a long life. You will be able to defeat your enemies and accumulate wealth.'
    },
    VimalaYoga: {
        name: 'Vimala Yoga',
        description: 'A Vipareeta Raja Yoga where the 12th lord is in the 6th or 8th house. This yoga makes you independent, virtuous, and happy. You will be good at managing your finances and will spend money on righteous deeds.'
    },
    NeechaBhangaRajaYoga: {
        name: 'Neecha Bhanga Raja Yoga',
        description: (planet, planetRashi, dispositorPlanet) => `The planet ${planet} is in its debilitation sign (${planetRashi}), but its dispositor ${dispositorPlanet} is in a Kendra from the Lagna or the Moon. This cancels the debilitation and gives rise to a powerful Raja Yoga, which can bestow great success and status after initial struggles.`
    },
    KendrumaYoga: {
        name: 'Kendruma Yoga',
        description: 'No planets (except Sun, Rahu, and Ketu) are in the 2nd or 12th house from the Moon. This yoga can indicate a feeling of loneliness and a lack of support from others. However, if other benefic yogas are present, the negative effects of this yoga are reduced.'
    },
    ChandraMangalaYoga: {
        name: 'Chandra Mangala Yoga',
        description: 'Moon and Mars are in the same house. This yoga, also known as Lakshmi Yoga, blesses the native with abundant wealth, courage, and a go-getter attitude. You will be quick to act and have a strong drive to succeed.'
    },
    BudhadityaYoga: {
        name: 'Budhaditya Yoga',
        description: 'Sun and Mercury are in the same house. This yoga blesses the native with sharp intellect, exceptional communication skills, and a good reputation. You are likely to be learned, skillful, and respected in your community.'
    },
    LakshmiYoga: {
        name: 'Lakshmi Yoga',
        description: 'The lord of the 9th house and Venus are strong and well-placed. This is a very auspicious yoga that blesses the native with immense wealth, prosperity, and good fortune throughout life. You will enjoy all luxuries and lead a comfortable life.'
    },
    DharmaKarmaAdhipatiYoga: {
        name: 'Dharma Karma Adhipati Yoga',
        description: 'The lords of the 9th (Dharma) and 10th (Karma) houses are in conjunction. This is a powerful Raja Yoga that indicates a rise in life due to righteous deeds and professional success. You will be fortunate and successful in your career.'
    },
    AmalaYogaFromAscendant: {
        name: 'Amala Yoga',
        description: (planet) => `A benefic planet, ${planet}, is in the 10th house from the Ascendant. This yoga brings lasting fame, wealth, and a spotless reputation. You will lead a prosperous life and be respected for your virtues.`
    },
    AmalaYogaFromMoon: {
        name: 'Amala Yoga',
        description: (planet) => `A benefic planet, ${planet}, is in the 10th house from the Moon. This yoga also brings lasting fame, wealth, and a spotless reputation, similar to its formation from the Ascendant.`
    },
    SaraswatiYoga: {
        name: 'Saraswati Yoga',
        description: 'Jupiter, Venus, and Mercury are in Kendra or Trikona houses. This is a powerful yoga for learning and knowledge, blessing the native with high intelligence, creativity, and a love for arts and sciences.'
    },
    ParvataYoga: {
        name: 'Parvata Yoga',
        description: 'The lord of the Ascendant is in a Kendra or Trikona house and is in its own or exaltation sign. This yoga makes the native illustrious, fortunate, wealthy, and a leader in their community.'
    },
    KahalaYoga: {
        name: 'Kahala Yoga',
        description: 'The lords of the 4th and 9th houses are in mutual Kendras. This yoga makes the native stubborn, but also courageous and a leader. You may lead a small army or a group of people.'
    }
};

export const YOGA_DEFINITIONS_HI = {
    GajaKesari: {
        name: 'गज केसरी योग',
        description: 'बृहस्पति चंद्रमा से केंद्र (1, 4, 7, या 10 वें घर) में है। यह एक शक्तिशाली योग है जो जातक को तेज बुद्धि, अपार धन और स्थायी प्रसिद्धि का आशीर्वाद देता है। आपको विद्वान लोगों द्वारा सम्मानित किए जाने की संभावना है और आप अपने दुश्मनों पर विजय प्राप्त करेंगे।'
    },
    RajaYoga: {
        name: 'राज योग',
        description: (kendraLord, trikonaLord) => `एक केंद्र घर के स्वामी, ${kendraLord} द्वारा त्रिकोण घर के स्वामी, ${trikonaLord} के साथ युति द्वारा गठित सफलता और स्थिति के लिए एक शक्तिशाली संयोजन। यह योग इंगित करता है कि आपके कार्य (केंद्र) और भाग्य (त्रिकोण) सामंजस्यपूर्ण रूप से जुड़े हुए हैं, जो महत्वपूर्ण उपलब्धियों, अधिकार और जीवन में एक उच्च पद का वादा करते हैं।`
    },
    DhanaYoga: {
        name: 'धन योग',
        description: (dhanaLord, trikonaLord) => `धन घर (दूसरे या 11वें) के स्वामी, ${dhanaLord} द्वारा त्रिकोण घर (5वें या 9वें) के स्वामी, ${trikonaLord} के साथ युति द्वारा गठित धन के लिए एक संयोजन। यह योग धन कमाने और जमा करने की एक मजबूत क्षमता को इंगित करता है, खासकर शामिल ग्रहों की अवधि के दौरान।`
    },
    RuchakaYoga: {
        name: 'रुचक योग',
        description: 'पंच महापुरुष योगों में से एक, मंगल द्वारा निर्मित। यह एक मजबूत काया, साहस और एक गतिशील व्यक्तित्व प्रदान करता है। आप साहसी होंगे, दुश्मनों पर विजयी होंगे, और सेना, पुलिस या इंजीनियरिंग जैसे क्षेत्रों में एक उच्च पद पर पहुंच सकते हैं।'
    },
    BhadraYoga: {
        name: 'भद्र योग',
        description: 'पंच महापुरुष योगों में से एक, बुध द्वारा निर्मित। यह तेज बुद्धि, उत्कृष्ट संचार कौशल और एक युवा उपस्थिति प्रदान करता है। आपको वाणिज्य, लेखन या शिक्षा से संबंधित क्षेत्रों में विद्वान, मजाकिया और सफल होने की संभावना है।'
    },
    HamsaYoga: {
        name: 'हंस योग',
        description: 'पंच महापुरुष योगों में से एक, बृहस्पति द्वारा निर्मित। यह एक ऐसे व्यक्ति को इंगित करता है जो धर्मी, सम्मानित और महान ज्ञान रखता है। आपको भाग्यशाली, दीर्घायु और आध्यात्मिक झुकाव होने की संभावना है।'
    },
    MalavyaYoga: {
        name: 'मालव्य योग',
        description: 'पंच महापुरुष योगों में से एक, शुक्र द्वारा निर्मित। यह एक आकर्षक व्यक्तित्व, कला और विलासिता के प्रति प्रेम और एक सामंजस्यपूर्ण विवाहित जीवन का आशीर्वाद देता है। आपको जीवन के सभी सुखों का आनंद लेने और रचनात्मक क्षेत्रों में सफल होने की संभावना है।'
    },
    SasaYoga: {
        name: 'शश योग',
        description: 'पंच महापुरुष योगों में से एक, शनि द्वारा निर्मित। यह अधिकार, नेतृत्व की स्थिति और शासन करने की क्षमता देता है। आप थोड़े अकेले हो सकते हैं लेकिन जनता द्वारा सम्मानित होंगे और एक लंबा जीवन जिएंगे।'
    },
    HarshaYoga: {
        name: 'हर्ष योग',
        description: 'एक विपरीत राज योग जहां 6 वें स्वामी 8 वें या 12 वें घर में है। यह योग अप्रत्याशित स्रोतों से खुशी, अच्छे स्वास्थ्य और दुश्मनों पर जीत का संकेत देता है। आप भाग्यशाली होंगे और एक आरामदायक जीवन व्यतीत करेंगे।'
    },
    SaralaYoga: {
        name: 'सरल योग',
        description: 'एक विपरीत राज योग जहां 8 वें स्वामी 6 वें या 12 वें घर में है। यह योग ज्ञान, कठिनाइयों को दूर करने की क्षमता और एक लंबा जीवन प्रदान करता है। आप अपने दुश्मनों को हराने और धन जमा करने में सक्षम होंगे।'
    },
    VimalaYoga: {
        name: 'विमल योग',
        description: 'एक विपरीत राज योग जहां 12 वें स्वामी 6 वें या 8 वें घर में है। यह योग आपको स्वतंत्र, गुणी और खुश बनाता है। आप अपने वित्त के प्रबंधन में अच्छे होंगे और धर्मी कार्यों पर पैसा खर्च करेंगे।'
    },
    NeechaBhangaRajaYoga: {
        name: 'नीच भंग राज योग',
        description: (planet, planetRashi, dispositorPlanet) => `ग्रह ${planet} अपनी नीच राशि (${planetRashi}) में है, लेकिन इसका स्वामी ${dispositorPlanet} लग्न या चंद्रमा से केंद्र में है। यह नीचता को रद्द करता है और एक शक्तिशाली राज योग को जन्म देता है, जो प्रारंभिक संघर्षों के बाद बड़ी सफलता और स्थिति प्रदान कर सकता है।`
    },
    KendrumaYoga: {
        name: 'केंद्रुम योग',
        description: 'चंद्रमा से दूसरे या बारहवें घर में कोई ग्रह (सूर्य, राहु और केतु को छोड़कर) नहीं है। यह योग अकेलेपन की भावना और दूसरों से समर्थन की कमी का संकेत दे सकता है। हालांकि, यदि अन्य शुभ योग मौजूद हैं, तो इस योग के नकारात्मक प्रभाव कम हो जाते हैं।'
    },
    ChandraMangalaYoga: {
        name: 'चंद्र मंगल योग',
        description: 'चंद्रमा और मंगल एक ही घर में हैं। यह योग, जिसे लक्ष्मी योग के रूप में भी जाना जाता है, जातक को प्रचुर धन, साहस और एक कर्ता-धर्ता रवैये का आशीर्वाद देता है। आप कार्य करने में तेज होंगे और सफल होने के लिए एक मजबूत प्रेरणा रखेंगे।'
    },
    BudhadityaYoga: {
        name: 'बुधादित्य योग',
        description: 'सूर्य और बुध एक ही घर में हैं। यह योग जातक को तेज बुद्धि, असाधारण संचार कौशल और एक अच्छी प्रतिष्ठा का आशीर्वाद देता है। आपको विद्वान, कुशल और अपने समुदाय में सम्मानित होने की संभावना है।'
    },
    LakshmiYoga: {
        name: 'लक्ष्मी योग',
        description: '9वें घर का स्वामी और शुक्र मजबूत और अच्छी तरह से स्थित हैं। यह एक बहुत ही शुभ योग है जो जातक को जीवन भर अपार धन, समृद्धि और सौभाग्य का आशीर्वाद देता है। आप सभी विलासिता का आनंद लेंगे और एक आरामदायक जीवन व्यतीत करेंगे।'
    },
    DharmaKarmaAdhipatiYoga: {
        name: 'धर्म कर्म अधिपति योग',
        description: '9वें (धर्म) और 10वें (कर्म) घरों के स्वामी युति में हैं। यह एक शक्तिशाली राज योग है जो धर्मी कार्यों और व्यावसायिक सफलता के कारण जीवन में वृद्धि का संकेत देता है। आप अपने करियर में भाग्यशाली और सफल होंगे।'
    },
    AmalaYogaFromAscendant: {
        name: 'अमला योग',
        description: (planet) => `एक शुभ ग्रह, ${planet}, लग्न से 10 वें घर में है। यह योग स्थायी प्रसिद्धि, धन और एक बेदाग प्रतिष्ठा लाता है। आप एक समृद्ध जीवन व्यतीत करेंगे और अपने गुणों के लिए सम्मानित होंगे।`
    },
    AmalaYogaFromMoon: {
        name: 'अमला योग',
        description: (planet) => `एक शुभ ग्रह, ${planet}, चंद्रमा से 10 वें घर में है। यह योग लग्न से बनने वाले योग के समान स्थायी प्रसिद्धि, धन और एक बेदाग प्रतिष्ठा भी लाता है।`
    },
    SaraswatiYoga: {
        name: 'सरस्वती योग',
        description: 'बृहस्पति, शुक्र और बुध केंद्र या त्रिकोण घरों में हैं। यह सीखने और ज्ञान के लिए एक शक्तिशाली योग है, जो जातक को उच्च बुद्धि, रचनात्मकता और कला और विज्ञान के प्रति प्रेम का आशीर्वाद देता है।'
    },
    ParvataYoga: {
        name: 'पर्वत योग',
        description: 'लग्न का स्वामी केंद्र या त्रिकोण घर में है और अपनी स्वराशि या उच्च राशि में है। यह योग जातक को शानदार, भाग्यशाली, धनी और अपने समुदाय में एक नेता बनाता है।'
    },
    KahalaYoga: {
        name: 'कहला योग',
        description: 'चौथे और नौवें घर के स्वामी आपसी केंद्र में हैं। यह योग जातक को जिद्दी, लेकिन साहसी और एक नेता भी बनाता है। आप एक छोटी सेना या लोगों के समूह का नेतृत्व कर सकते हैं।'
    }
};
