import { getHouseOfPlanet } from './planetaryUtils.js';
import { convertDMSToDegrees } from './coreUtils.js';
import { getPlanetName } from './birthChartYogaUtils.js';
import { getNakshatraPada } from './nakshatraUtils.js';
import { NAKSHATRA_PADA_MEANINGS_EN, NAKSHATRA_PADA_MEANINGS_HI } from './nakshatraPadaMeanings.js';

const houseThemes_en = {
    1: 'Self, Identity, Health', 2: 'Finance, Possessions, Speech', 3: 'Siblings, Courage, Communication',
    4: 'Home, Family, Roots', 5: 'Creativity, Children, Education', 6: 'Work, Health, Service',
    7: 'Partnerships, Marriage, Contracts', 8: 'Shared Resources, Transformation, Losses', 9: 'Higher Learning, Travel, Faith',
    10: 'Career, Reputation, Public Life', 11: 'Gains, Friends, Networks', 12: 'Secrets, Expenses, Spirituality'
};

const houseThemes_hi = {
    1: 'स्वयं, पहचान, स्वास्थ्य', 2: 'वित्त, संपत्ति, वाणी', 3: 'भाई-बहन, साहस, संचार',
    4: 'घर, परिवार, जड़ें', 5: 'रचनात्मकता, बच्चे, शिक्षा', 6: 'काम, स्वास्थ्य, सेवा',
    7: 'साझेदारी, विवाह, अनुबंध', 8: 'साझा संसाधन, परिवर्तन, हानि', 9: 'उच्च शिक्षा, यात्रा, विश्वास',
    10: 'करियर, प्रतिष्ठा, सार्वजनिक जीवन', 11: 'लाभ, दोस्त, नेटवर्क', 12: 'रहस्य, खर्च, आध्यात्मिकता'
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

const rashiNames_hi = {
    Aries: "मेष", 
    Taurus: "वृषभ", 
    Gemini: "मिथुन", 
    Cancer: "कर्क", 
    Leo: "सिंह", 
    Virgo: "कन्या",
    Libra: "तुला", 
    Scorpio: "वृश्चिक", 
    Sagittarius: "धनु", 
    Capricorn: "मकर", 
    Aquarius: "कुंभ", 
    Pisces: "मीन"
};

const nakshatraNames_hi = {
    Ashwini: "अश्विनी",
    Bharani: "भरणी",
    Krittika: "कृत्तिका",
    Rohini: "रोहिणी",
    Mrigashira: "मृगशिरा",
    Ardra: "आर्द्रा",
    Punarvasu: "पुनर्वसु",
    Pushya: "पुष्य",
    Ashlesha: "आश्लेषा",
    Magha: "मघा",
    "Purva Phalguni": "पूर्वा फाल्गुनी", // Corrected name with space
    "Uttara Phalguni": "उत्तरा फाल्गुनी", // Corrected name with space
    Hasta: "हस्त",
    Chitra: "चित्रा",
    Swati: "स्वाति",
    Vishakha: "विशाखा",
    Anuradha: "अनुराधा",
    Jyeshtha: "ज्येष्ठा",
    Mula: "मूल",
    "Purva Ashadha": "पूर्वाषाढ़ा", // Corrected name with space
    "Uttara Ashadha": "उत्तराषाढ़ा", // Corrected name with space
    Shravana: "श्रवण",
    Dhanishta: "धनिष्ठा",
    Shatabhisha: "शतभिषा",
    "Purva Bhadrapada": "पूर्व भाद्रपद", // Corrected name with space
    "Uttara Bhadrapada": "उत्तर भाद्रपद", // Corrected name with space
    Revati: "रेवती"
};

const eventNames_hi = {
    'Marriage': 'विवाह',
    'Career/Profession': 'करियर/पेशा',
    'Child Birth': 'संतान जन्म',
    'Higher Education': 'उच्च शिक्षा',
    'Property & Vehicle Purchase': 'संपत्ति और वाहन खरीद',
    'Foreign Travel': 'विदेश यात्रा',
    'Health & Sickness': 'स्वास्थ्य और बीमारी',
    'Spiritual Progress': 'आध्यात्मिक उन्नति',
    'Success in Litigation': 'मुकदमे में सफलता'
};

const muddaThemes = {
    en: { Sun: "Authority, Leadership, and Self-expression", Moon: "Emotional Sensitivity, Intuition, and Adaptability", Mars: "Energy, Drive, and Courage", Mercury: "Intellect, Communication, and Logical Analysis", Jupiter: "Wisdom, Expansion, and Opportunities", Venus: "Love, Beauty, and Harmony", Saturn: "Discipline, Responsibility, and Long-term Goals", Rahu: "Ambition, Innovation, and Worldly Desire", Ketu: "Detachment, Spirituality, and Deep Insight" },
    hi: { Sun: "अधिकार, नेतृत्व और आत्म-अभिव्यक्ति", Moon: "भावनात्मक संवेदनशीलता, अंतर्ज्ञान और अनुकूलनशीलता", Mars: "ऊर्जा, कार्रवाई और साहस", Mercury: "बुद्धि, संचार और तार्किक विश्लेषण", Jupiter: "ज्ञान, विस्तार और आशावाद", Venus: "प्रेम, सौंदर्य और सद्भाव", Saturn: "अनुशासन, जिम्मेदारी और दीर्घकालिक लक्ष्य", Rahu: "महत्वाकांक्षा, नवाचार और सांसारिक इच्छाएं", Ketu: "आत्मनिरीक्षण, जाने देना और आध्यात्मिक अंतर्दृष्टि" }
};


const planetInHouse_en = {
    Sun: [
        "Sun in the 1st house amplifies your sense of self, bestowing leadership, vitality, and a strong desire for recognition. You have a commanding presence but should be mindful of ego.",
        "Sun in the 2nd house ties your identity to wealth, family heritage, and values. You may have a powerful voice and focus on accumulating significant assets.",
        "Sun in the 3rd house grants Courage, a powerful will, and authority in Communication. You express yourself with confidence and may excel in marketing, writing, or performance.",
        "Sun in the 4th house places your focus on home, family, and emotional foundations. You may take a leading role in domestic life and seek a prominent home environment.",
        "Sun in the 5th house brings creativity, intelligence, and a dramatic flair. You shine in areas of romance, performance, and leadership, with a strong connection to Children.",
        "Sun in the 6th house indicates a drive to lead in your daily work and service. You take pride in overcoming challenges and can be a powerful figure in healthcare or administration.",
        "Sun in the 7th house places your ego and identity in partnerships. You seek a prominent partner and may define yourself through your relationships, for better or worse.",
        "Sun in the 8th house gives a powerful interest in mysteries, psychology, and joint resources. Your life path involves deep transformations and dealing with hidden power dynamics.",
        "Sun in the 9th house aligns your identity with higher beliefs, wisdom, and dharma. You are a natural teacher or guide, and your father or gurus may be significant figures.",
        "Sun in the 10th house is a powerful placement for career and public recognition. You are a natural leader, destined for a visible role in your profession and society.",
        "Sun in the 11th house indicates that your identity is connected to your social network, goals, and gains. You can become a leader within a large organization or group of friends.",
        "Sun in the 12th house directs your energy towards spirituality, introspection, and foreign lands. Your path may involve service in institutions or finding your identity in solitude."
    ],
    Moon: [
        "Moon in the 1st house makes your personality deeply emotional, intuitive, and receptive. Your identity is fluid, and you are highly sensitive to your environment and others' moods.",
        "Moon in the 2nd house links your emotional security to financial stability and family values. Your income may fluctuate, and you find comfort in nurturing your possessions.",
        "Moon in the 3rd house creates a mind that is curious, communicative, and changeable. Your thoughts are deeply tied to your feelings, making you an imaginative writer or speaker.",
        "Moon in the 4th house (its own house) is extremely strong for emotional happiness. Your well-being is deeply connected to your home, mother, and a sense of belonging.",
        "Moon in the 5th house makes you emotionally creative and romantic. You have a nurturing connection with Children and find emotional fulfillment through creative self-expression.",
        "Moon in the 6th house ties your emotions to your work and daily routines. You may have a nurturing approach to service but can be prone to worry about health and conflicts.",
        "Moon in the 7th house seeks emotional fulfillment through partnerships. Your happiness depends greatly on the harmony and connection you feel with your significant other.",
        "Moon in the 8th house gives a mind that is deep, intuitive, and drawn to mysteries. You experience profound emotional transformations and have a natural psychic ability.",
        "Moon in the 9th house connects your emotions to your beliefs, higher learning, and Travel. You find emotional peace through philosophy, spirituality, and exploring different cultures.",
        "Moon in the 10th house places your emotions in the public eye. Your career may be related to the public, caregiving, or food, and your reputation is subject to ups and downs.",
        "Moon in the 11th house finds emotional satisfaction through friendships, social networks, and achieving goals. You are nurtured by your community and group involvements.",
        "Moon in the 12th house creates a highly imaginative, intuitive, and compassionate mind. You need periods of solitude to recharge and may feel a deep connection to spiritual or otherworldly realms."
    ],
    Mars: [
        "Mars in the 1st house gives an assertive, energetic, and courageous persona. You are a natural go-getter, but must watch for impulsiveness and a tendency to be accident-prone.",
        "Mars in the 2nd house brings drive and conflict to finances and speech. You are aggressive in earning money, but may also have financial disputes or use harsh words.",
        "Mars in the 3rd house grants immense Courage, initiative, and a direct Communication style. You are a powerful advocate for your ideas, though can be argumentative.",
        "Mars in the 4th house can create conflict and arguments within the home and with family. It indicates a need to channel your energy into productive domestic projects.",
        "Mars in the 5th house provides a passionate and competitive drive in creativity, sports, and romance. You pursue your hobbies and love interests with great energy.",
        "Mars in the 6th house is excellent for overcoming enemies and obstacles. You are a formidable competitor and a tireless worker, but must guard against inflammation and injuries.",
        "Mars in the 7th house brings a passionate but potentially argumentative energy to partnerships. You are attracted to assertive partners, but power struggles are common.",
        "Mars in the 8th house indicates a strong drive to investigate secrets and a risk-taking nature with joint finances. This can indicate sudden events and a need for careful energy management.",
        "Mars in the 9th house shows a drive to fight for your beliefs. You may argue with teachers or about philosophy, but you are a passionate advocate for what you hold as truth.",
        "Mars in the 10th house provides immense ambition and drive in your career. You are a natural commander and excel in fields requiring courage and technical skill, like engineering or surgery.",
        "Mars in the 11th house directs your energy toward achieving goals and networking. You are proactive in your social circle and can be a leader among friends, though competition can arise.",
        "Mars in the 12th house can create hidden enemies or direct your energy inwards, leading to frustration. It is best channeled through spiritual discipline, research, or service."
    ],
    Mercury: [
        "Mercury in the 1st house makes you highly intelligent, communicative, and adaptable. Your identity is tied to your intellect, and you present yourself in a youthful, curious manner.",
        "Mercury in the 2nd house grants intelligence in financial matters and a skillful, often humorous or versatile, manner of speech. Your mind is focused on accumulating resources and data.",
        "Mercury in the 3rd house (its own house) is excellent for Communication, writing, and learning. You have a quick, logical mind and excel in media, marketing, or short-distance Travel.",
        "Mercury in the 4th house focuses your intelligence on domestic matters. You may enjoy learning at home, have a family business, or be constantly thinking about real estate and family.",
        "Mercury in the 5th house gives a playful, creative, and intelligent mind. You excel at games of skill, intellectual hobbies, and communicating with Children.",
        "Mercury in the 6th house applies your analytical skills to problems, health, and work. You are a detail-oriented worker and an excellent troubleshooter, but may worry excessively.",
        "Mercury in the 7th house seeks an intelligent and communicative partner. Dialogue and mental connection are crucial for you in all one-on-one relationships.",
        "Mercury in the 8th house creates a mind drawn to research, investigation, and uncovering secrets. You have a natural talent for psychology, astrology, or investigative journalism.",
        "Mercury in the 9th house makes you a student of higher knowledge. You love to learn and communicate about philosophy, law, religion, and long-distance Travel.",
        "Mercury in the 10th house uses communication as a primary tool in your career. You may have multiple jobs or a profession in media, writing, teaching, or consulting.",
        "Mercury in the 11th house grants a wide social network and intelligence in achieving goals. You connect with many different people and excel at group communication.",
        "Mercury in the 12th house gives a mind that is intuitive, imaginative, and focused on behind-the-scenes research or spiritual topics. You think deeply about hidden things."
    ],
    Jupiter: [
        "Jupiter in the 1st house brings optimism, wisdom, and good fortune to your personality. You are seen as a person of high principles, and you naturally attract opportunities.",
        "Jupiter in the 2nd house is excellent for wealth and finance. It indicates a path of abundance, a generous nature, and wisdom in handling resources.",
        "Jupiter in the 3rd house expands your Communication and Courage. You are an optimistic and inspiring speaker or writer, with good relationships with Siblings.",
        "Jupiter in the 4th house (a strong placement) blesses you with a happy home life, a large property, and strong support from your mother. It indicates deep inner peace.",
        "Jupiter in the 5th house is a blessing for Children, creativity, and good fortune through investments or speculation. Your intelligence is broad and your creativity is expansive.",
        "Jupiter in the 6th house helps in overcoming conflicts and health issues with wisdom. You are generous in your service and can be a great teacher or counselor in your work.",
        "Jupiter in the 7th house promises a wise, fortunate, and principled partner. Your relationships are a source of growth and expansion in your life.",
        "Jupiter in the 8th house can bring wealth through inheritance or partners, and gives a deep, philosophical interest in life's mysteries and longevity.",
        "Jupiter in the 9th house (its own house) is extremely powerful for fortune, higher wisdom, and dharma. You are a born teacher, philosopher, or guide, blessed by luck.",
        "Jupiter in the 10th house grants great success, ethics, and wisdom in your career. You can attain a high position as a consultant, teacher, or leader in your field.",
        "Jupiter in the 11th house is one of the best placements for gains and fulfillment of desires. You have a wide network of powerful and helpful friends.",
        "Jupiter in the 12th house provides divine protection and a deep interest in spirituality, meditation, and charity. You find wisdom in solitude and letting go."
    ],
    Venus: [
        "Venus in the 1st house blesses you with charm, grace, and a love for beauty and harmony. You are naturally attractive, diplomatic, and have a pleasant demeanor.",
        "Venus in the 2nd house is excellent for wealth, giving a love for luxury items, fine food, and a beautiful speaking voice. You attract money easily through your charm.",
        "Venus in the 3rd house makes your Communication style artistic and pleasant. You have a talent for creative writing, poetry, or design and enjoy harmonious Sibling relationships.",
        "Venus in the 4th house indicates a beautiful home, a love of comfort, and a happy domestic life. You may own luxury vehicles and have a strong, loving bond with your mother.",
        "Venus in the 5th house grants creativity, romance, and artistic talent. You are highly charismatic and find great joy in love affairs, the arts, and entertainment.",
        "Venus in the 6th house can bring harmony to the workplace, but also indicates that health issues may arise from overindulgence. You may serve others through art or design.",
        "Venus in the 7th house (its own house) is a strong indicator of a beautiful, charming, and devoted partner. Your marriage is central to your happiness and social life.",
        "Venus in the 8th house can bring wealth through marriage or inheritance, but also indicates intense, secret relationships. It gives a strong magnetism and allure.",
        "Venus in the 9th house shows a love for philosophy, art, and the beauty in different cultures. Your beliefs are centered on harmony, and you may find a partner from a foreign land.",
        "Venus in the 10th house grants success in careers related to arts, entertainment, beauty, or diplomacy. You have a charming public image and are well-liked.",
        "Venus in the 11th house brings gains and friendships through your charm and social grace. You have a network of artistic and affluent friends who help you achieve your goals.",
        "Venus in the 12th house finds love and beauty in seclusion, spirituality, and imagination. It can indicate hidden relationships or a love for luxurious comforts in private."
    ],
    Saturn: [
        "Saturn in the 1st house adds seriousness, discipline, and responsibility to your personality. You may feel burdened by responsibilities from a young age but develop great endurance.",
        "Saturn in the 2nd house can restrict finances and family wealth, demanding hard work and savings over time. It gives a serious, practical, and sometimes somber speech.",
        "Saturn in the 3rd house can create challenges with Siblings or Communication. However, it gives immense perseverance and discipline in any skill you set out to master.",
        "Saturn in the 4th house can indicate a restrictive or emotionally cold home environment. It builds security slowly over time through discipline and hard work.",
        "Saturn in the 5th house can bring delays or a serious approach to Children, romance, and creativity. Your creative pursuits are structured and may manifest later in life.",
        "Saturn in the 6th house is a powerful placement for overcoming enemies through perseverance. It shows a diligent worker but can indicate chronic health issues that require discipline.",
        "Saturn in the 7th house can delay marriage or bring a mature, older, or very responsible partner. It demands commitment, structure, and patience in relationships.",
        "Saturn in the 8th house is a strong placement for longevity. It can bring inheritance through long, patient waiting, and gives a deep, serious interest in research and metaphysics.",
        "Saturn in the 9th house creates a structured, traditional, and sometimes rigid belief system. You take philosophy and higher education seriously, but may question your teachers.",
        "Saturn in the 10th house (a strong placement) brings success and high status through slow, steady, and disciplined hard work. You build a lasting career and reputation over time.",
        "Saturn in the 11th house can make the fulfillment of desires a slow process. Friends are few but long-lasting. Gains come through perseverance and established networks.",
        "Saturn in the 12th house indicates a solitary, disciplined spiritual path. It is excellent for meditation and behind-the-scenes work but can indicate feelings of isolation."
    ],
    Rahu: [
        "Rahu in the 1st house creates a powerful, ambitious, and unconventional personality. You have an insatiable desire for recognition and may feel like an outsider trying to prove yourself.",
        "Rahu in the 2nd house gives a great desire to accumulate wealth and property. It can bring wealth from unconventional sources, but also a tendency for untruthful speech.",
        "Rahu in the 3rd house provides immense Courage and a powerful, persuasive Communication style. You may excel in media, technology, or marketing, but can also be manipulative.",
        "Rahu in the 4th house can create restlessness regarding home and emotional peace. There may be foreign elements in your domestic life or a feeling of never being truly settled.",
        "Rahu in the 5th house brings a passionate drive for creativity, romance, and speculation. It can grant fame through entertainment but also an unconventional approach to Children.",
        "Rahu in the 6th house provides an uncanny ability to overcome enemies and solve complex problems through unconventional means. It can give success in technology or healing.",
        "Rahu in the 7th house creates a strong desire for partnership, often with someone from a different background or culture. Relationships are a major focus and can be unconventional.",
        "Rahu in the 8th house gives a powerful and obsessive interest in secrets, metaphysics, and sudden wealth. It can bring unexpected gains and losses and a talent for research.",
        "Rahu in the 9th house creates unconventional beliefs and a questioning attitude towards traditional religion and teachers. It can bring great success in foreign lands.",
        "Rahu in the 10th house is a powerful driver for career ambition and fame. You are not afraid to break rules to achieve high status and can rise quickly in your profession.",
        "Rahu in the 11th house is an excellent placement for huge gains and fulfillment of desires through technology and large networks. You have influential and unconventional friends.",
        "Rahu in the 12th house directs its obsessive energy towards spirituality, foreign lands, or hidden affairs. It can give powerful intuitive insights or lead to secret dealings and expenses."
    ],
    Ketu: [
        "Ketu in the 1st house creates a detached, introspective, and spiritually-inclined personality. You may feel a sense of rootlessness or question your own identity, leading to a spiritual search.",
        "Ketu in the 2nd house can create a detached attitude towards wealth and family. It may lead to financial uncertainty or a lack of focus on material accumulation.",
        "Ketu in the 3rd house brings an intuitive and non-linear Communication style. You may lack interest in conventional media but have powerful psychic or symbolic insights.",
        "Ketu in the 4th house can indicate a detached or unsettled feeling about your home and roots. It promotes a search for a spiritual 'home' rather than a physical one.",
        "Ketu in the 5th house creates a detached and critical view of romance, creativity, and Children. You may have highly intuitive intelligence but struggle with conventional creative expression.",
        "Ketu in the 6th house provides a powerful ability to intuitively diagnose and solve problems or diseases. However, it can also indicate strange, hard-to-diagnose health issues.",
        "Ketu in the 7th house brings a spiritual, detached, or critical approach to partnership. You may feel a karmic connection to your partner but also a sense of dissatisfaction.",
        "Ketu in the 8th house is a powerful placement for deep mystical and occult research. You have a natural ability to see through illusions and understand deep metaphysical truths.",
        "Ketu in the 9th house indicates a questioning of traditional beliefs and a search for a more direct, intuitive spiritual truth. It shows past life mastery of philosophy.",
        "Ketu in the 10th house creates a career path that is unconventional, spiritual, or involves research. You are detached from the ambitions of status and fame.",
        "Ketu in the 11th house gives a detached view of social networks and material gains. Your friendships may be few or unusual, and your goals are often not materialistic.",
        "Ketu in the 12th house directs its obsessive energy towards spirituality, foreign lands, or hidden affairs. It can give powerful intuitive insights or lead to secret dealings and expenses."
    ]
};

const planetInHouse_hi = {
    Sun: [
        "पहले घर में सूर्य आपके आत्म-बोध को बढ़ाता है, नेतृत्व, जीवन शक्ति और मान्यता की प्रबल इच्छा प्रदान करता है। आपकी उपस्थिति प्रभावशाली है लेकिन अहंकार से सावधान रहना चाहिए।",
        "दूसरे घर में सूर्य आपकी पहचान को धन, पारिवारिक विरासत और मूल्यों से जोड़ता है। आपकी आवाज शक्तिशाली हो सकती है और आप महत्वपूर्ण संपत्ति जमा करने पर ध्यान केंद्रित कर सकते हैं।",
        "तीसरे घर में सूर्य साहस, एक शक्तिशाली इच्छाशक्ति और संचार में अधिकार प्रदान करता है। आप आत्मविश्वास के साथ खुद को व्यक्त करते हैं और मार्केटिंग, लेखन या प्रदर्शन में उत्कृष्टता प्राप्त कर सकते हैं।",
        "चौथे घर में सूर्य आपका ध्यान घर, परिवार और भावनात्मक नींव पर केंद्रित करता है। आप घरेलू जीवन में एक प्रमुख भूमिका निभा सकते हैं और एक प्रमुख घरेलू वातावरण की तलाश कर सकते हैं।",
        "पांचवें घर में सूर्य रचनात्मकता, बुद्धि और एक नाटकीय स्वभाव लाता है। आप रोमांस, प्रदर्शन और नेतृत्व के क्षेत्रों में चमकते हैं, और बच्चों के साथ आपका मजबूत संबंध होता है।",
        "छठे घर में सूर्य आपके दैनिक कार्य और सेवा में नेतृत्व करने की प्रेरणा को इंगित करता है। आप चुनौतियों पर काबू पाने में गर्व महसूस करते हैं और स्वास्थ्य सेवा या प्रशासन में एक शक्तिशाली व्यक्ति हो सकते हैं।",
        "सातवें घर में सूर्य आपके अहंकार और पहचान को साझेदारी में रखता है। आप एक प्रमुख साथी की तलाश करते हैं और अपने रिश्तों के माध्यम से खुद को परिभाषित कर सकते हैं, चाहे अच्छा हो या बुरा।",
        "आठवें घर में सूर्य रहस्यों, मनोविज्ञान और संयुक्त संसाधनों में एक शक्तिशाली रुचि देता है। आपके जीवन पथ में गहरे परिवर्तन और छिपी हुई शक्ति की गतिशीलता से निपटना शामिल है।",
        "नौवें घर में सूर्य आपकी पहचान को उच्च विश्वासों, ज्ञान और धर्म के साथ संरेखित करता है। आप एक प्राकृतिक शिक्षक या मार्गदर्शक हैं, और आपके पिता या गुरु महत्वपूर्ण व्यक्ति हो सकते हैं।",
        "दसवें घर में सूर्य करियर और सार्वजनिक मान्यता के लिए एक शक्तिशाली स्थान है। आप एक प्राकृतिक नेता हैं, जो आपके पेशे और समाज में एक दृश्य भूमिका के लिए नियत हैं।",
        "ग्यारहवें घर में सूर्य इंगित करता है कि आपकी पहचान आपके सामाजिक नेटवर्क, लक्ष्यों और लाभों से जुड़ी है। आप एक बड़े संगठन या दोस्तों के समूह के भीतर एक नेता बन सकते हैं।",
        "बारहवें घर में सूर्य आपकी ऊर्जा को आध्यात्मिकता, आत्मनिरीक्षण और विदेशी भूमि की ओर निर्देशित करता है। आपके पथ में संस्थानों में सेवा या एकांत में अपनी पहचान खोजना शामिल हो सकता है।"
    ],
    Moon: [
        "पहले घर में चंद्रमा आपके व्यक्तित्व को गहरा भावनात्मक, सहज और ग्रहणशील बनाता है। आपकी पहचान तरल है, और आप अपने पर्यावरण और दूसरों के मूड के प्रति अत्यधिक संवेदनशील हैं।",
        "दूसरे घर में चंद्रमा आपकी भावनात्मक सुरक्षा को वित्तीय स्थिरता और पारिवारिक मूल्यों से जोड़ता है। आपकी आय में उतार-चढ़ाव हो सकता है, और आप अपनी संपत्ति के पोषण में आराम पाते हैं।",
        "तीसरे घर में चंद्रमा एक जिज्ञासु, मिलनसार और परिवर्तनशील मन बनाता है। आपके विचार आपकी भावनाओं से गहराई से जुड़े हुए हैं, जो आपको एक कल्पनाशील लेखक या वक्ता बनाते हैं।",
        "चौथे घर में चंद्रमा (अपने ही घर में) भावनात्मक खुशी के लिए अत्यंत मजबूत है। आपकी भलाई आपके घर, माँ और अपनेपन की भावना से गहराई से जुड़ी हुई है।",
        "पांचवें घर में चंद्रमा आपको भावनात्मक रूप से रचनात्मक और रोमांटिक बनाता है। आपका बच्चों के साथ एक पोषण करने वाला संबंध है और आप रचनात्मक आत्म-अभिव्यक्ति के माध्यम से भावनात्मक संतुष्टि पाते हैं।",
        "छठे घर में चंद्रमा आपकी भावनाओं को आपके काम और दैनिक दिनचर्या से जोड़ता है। आपकी सेवा के प्रति एक पोषण दृष्टिकोण हो सकता है लेकिन स्वास्थ्य और संघर्षों के बारे में चिंता करने की प्रवृत्ति हो सकती है।",
        "सातवें घर में चंद्रमा साझेदारी के माध्यम से भावनात्मक संतुष्टि चाहता है। आपकी खुशी काफी हद तक आपके महत्वपूर्ण दूसरे के साथ महसूस होने वाले सद्भाव और संबंध पर निर्भर करती है।",
        "आठवें घर में चंद्रमा एक गहरा, सहज और रहस्यों की ओर आकर्षित मन देता है। आप गहन भावनात्मक परिवर्तनों का अनुभव करते हैं और आपके पास एक प्राकृतिक मानसिक क्षमता होती है।",
        "नौवें घर में चंद्रमा आपकी भावनाओं को आपके विश्वासों, उच्च शिक्षा और यात्रा से जोड़ता है। आप दर्शन, आध्यात्मिकता और विभिन्न संस्कृतियों की खोज के माध्यम से भावनात्मक शांति पाते हैं।",
        "दसवें घर में चंद्रमा आपकी भावनाओं को सार्वजनिक नजर में रखता है। आपका करियर जनता, देखभाल या भोजन से संबंधित हो सकता है, और आपकी प्रतिष्ठा उतार-चढ़ाव के अधीन है।",
        "ग्यारहवें घर में चंद्रमा दोस्ती, सामाजिक नेटवर्क और लक्ष्यों को प्राप्त करने के माध्यम से भावनात्मक संतुष्टि पाता है। आप अपने समुदाय और समूह की भागीदारी से पोषित होते हैं।",
        "बारहवें घर में चंद्रमा एक अत्यधिक कल्पनाशील, सहज और दयालु मन बनाता है। आपको रिचार्ज करने के लिए एकांत की अवधि की आवश्यकता होती है और आप आध्यात्मिक या अन्य दुनिया के क्षेत्रों से गहरा संबंध महसूस कर सकते हैं।"
    ],
    Mars: [
        "पहले घर में मंगल एक मुखर, ऊर्जावान और साहसी व्यक्तित्व देता है। आप एक प्राकृतिक कर्ता हैं, लेकिन आपको आवेगीपन और दुर्घटना-प्रवृत्ति से सावधान रहना चाहिए।",
        "दूसरे घर में मंगल वित्त और वाणी में प्रेरणा और संघर्ष लाता है। आप पैसा कमाने में आक्रामक हैं, लेकिन वित्तीय विवाद भी हो सकते हैं या कठोर शब्दों का उपयोग कर सकते हैं।",
        "तीसरे घर में मंगल अपार साहस, पहल और एक प्रत्यक्ष संचार शैली प्रदान करता है। आप अपने विचारों के एक शक्तिशाली हिमायती हैं, हालांकि तर्कशील हो सकते हैं।",
        "चौथे घर में मंगल घर के भीतर और परिवार के साथ संघर्ष और तर्क पैदा कर सकता है। यह आपकी ऊर्जा को उत्पादक घरेलू परियोजनाओं में लगाने की आवश्यकता को इंगित करता है।",
        "पांचवें घर में मंगल रचनात्मकता, खेल और रोमांस में एक भावुक और प्रतिस्पर्धी प्रेरणा प्रदान करता है। आप अपने शौक और प्रेम रुचियों को बड़ी ऊर्जा के साथ आगे बढ़ाते हैं।",
        "छठे घर में मंगल दुश्मनों और बाधाओं पर काबू पाने के लिए उत्कृष्ट है। आप एक दुर्जेय प्रतियोगी और एक अथक कार्यकर्ता हैं, लेकिन सूजन और चोटों से सावधान रहना चाहिए।",
        "सातवें घर में मंगल साझेदारी में एक भावुक लेकिन संभावित रूप से तर्कपूर्ण ऊर्जा लाता है। आप मुखर भागीदारों के प्रति आकर्षित होते हैं, लेकिन सत्ता संघर्ष आम हैं।",
        "आठवें घर में मंगल रहस्यों की जांच करने के लिए एक मजबूत प्रेरणा और संयुक्त वित्त के साथ जोखिम लेने की प्रकृति को इंगित करता है। यह अचानक घटनाओं और सावधान ऊर्जा प्रबंधन की आवश्यकता का संकेत दे सकता है।",
        "नौवें घर में मंगल आपके विश्वासों के लिए लड़ने की प्रेरणा दिखाता है। आप शिक्षकों के साथ या दर्शन के बारे में बहस कर सकते हैं, लेकिन आप जो सच मानते हैं उसके लिए एक भावुक हिमायती हैं।",
        "दसवें घर में मंगल आपके करियर में अपार महत्वाकांक्षा और प्रेरणा प्रदान करता है। आप एक प्राकृतिक कमांडर हैं और इंजीनियरिंग या सर्जरी जैसे साहस और तकनीकी कौशल की आवश्यकता वाले क्षेत्रों में उत्कृष्टता प्राप्त करते हैं।",
        "ग्यारहवें घर में मंगल आपकी ऊर्जा को लक्ष्यों को प्राप्त करने और नेटवर्किंग की ओर निर्देशित करता है। आप अपने सामाजिक दायरे में सक्रिय हैं और दोस्तों के बीच एक नेता हो सकते हैं, हालांकि प्रतिस्पर्धा उत्पन्न हो सकती है।",
        "बारहवें घर में मंगल छिपे हुए दुश्मन बना सकता है या आपकी ऊर्जा को अंदर की ओर निर्देशित कर सकता है, जिससे निराशा हो सकती है। इसे आध्यात्मिक अनुशासन, अनुसंधान या सेवा के माध्यम से सर्वोत्तम रूप से प्रसारित किया जाता है।"
    ],
    Mercury: [
        "पहले घर में बुध आपको अत्यधिक बुद्धिमान, मिलनसार और अनुकूलनीय बनाता है। आपकी पहचान आपकी बुद्धि से जुड़ी है, और आप खुद को एक युवा, जिज्ञासु तरीके से प्रस्तुत करते हैं।",
        "दूसरे घर में बुध वित्तीय मामलों में बुद्धि और एक कुशल, अक्सर विनोदी या बहुमुखी, भाषण की शैली प्रदान करता है। आपका मन संसाधनों और डेटा को जमा करने पर केंद्रित है।",
        "तीसरे घर में बुध (अपने ही घर में) संचार, लेखन और सीखने के लिए उत्कृष्ट है। आपके पास एक तेज, तार्किक दिमाग है और आप मीडिया, मार्केटिंग या कम दूरी की यात्रा में उत्कृष्टता प्राप्त करते हैं।",
        "चौथे घर में बुध आपकी बुद्धि को घरेलू मामलों पर केंद्रित करता है। आप घर पर सीखने का आनंद ले सकते हैं, एक पारिवारिक व्यवसाय कर सकते हैं, या अचल संपत्ति और परिवार के बारे में लगातार सोच सकते हैं।",
        "पांचवें घर में बुध एक चंचल, रचनात्मक और बुद्धिमान मन देता है। आप कौशल के खेल, बौद्धिक शौक और बच्चों के साथ संवाद करने में उत्कृष्टता प्राप्त करते हैं।",
        "छठे घर में बुध आपकी विश्लेषणात्मक कौशल को समस्याओं, स्वास्थ्य और काम पर लागू करता है। आप एक विस्तार-उन्मुख कार्यकर्ता और एक उत्कृष्ट समस्या निवारक हैं, लेकिन अत्यधिक चिंता कर सकते हैं।",
        "सातवें घर में बुध एक बुद्धिमान और मिलनसार साथी चाहता है। सभी आमने-सामने के रिश्तों में आपके लिए संवाद और मानसिक संबंध महत्वपूर्ण हैं।",
        "आठवें घर में बुध एक ऐसा मन बनाता है जो अनुसंधान, जांच और रहस्यों को उजागर करने की ओर आकर्षित होता है। आपके पास मनोविज्ञान, ज्योतिष या खोजी पत्रकारिता के लिए एक प्राकृतिक प्रतिभा है।",
        "नौवें घर में बुध आपको उच्च ज्ञान का छात्र बनाता है। आप दर्शन, कानून, धर्म और लंबी दूरी की यात्रा के बारे में सीखना और संवाद करना पसंद करते हैं।",
        "दसवें घर में बुध आपके करियर में संचार को एक प्राथमिक उपकरण के रूप में उपयोग करता है। आपके पास कई नौकरियां या मीडिया, लेखन, शिक्षण या परामर्श में एक पेशा हो सकता है।",
        "ग्यारहवें घर में बुध एक विस्तृत सामाजिक नेटवर्क और लक्ष्यों को प्राप्त करने में बुद्धि प्रदान करता है। आप कई अलग-अलग लोगों से जुड़ते हैं और समूह संचार में उत्कृष्टता प्राप्त करते हैं।",
        "बारहवें घर में बुध एक ऐसा मन देता है जो सहज, कल्पनाशील और पर्दे के पीछे के शोध या आध्यात्मिक विषयों पर केंद्रित होता है। आप छिपी हुई चीजों के बारे में गहराई से सोचते हैं।"
    ],
    Jupiter: [
        "पहले घर में बृहस्पति आपके व्यक्तित्व में आशावाद, ज्ञान और सौभाग्य लाता है। आपको उच्च सिद्धांतों वाले व्यक्ति के रूप में देखा जाता है, और आप स्वाभाविक रूप से अवसरों को आकर्षित करते हैं।",
        "दूसरे घर में बृहस्पति धन और वित्त के लिए उत्कृष्ट है। यह बहुतायत का मार्ग, एक उदार प्रकृति और संसाधनों को संभालने में ज्ञान को इंगित करता है।",
        "तीसरे घर में बृहस्पति आपके संचार और साहस का विस्तार करता है। आप एक आशावादी और प्रेरक वक्ता या लेखक हैं, और भाई-बहनों के साथ आपके अच्छे संबंध हैं।",
        "चौथे घर में बृहस्पति (एक मजबूत स्थान) आपको एक सुखी घरेलू जीवन, एक बड़ी संपत्ति और आपकी माँ से मजबूत समर्थन का आशीर्वाद देता है। यह गहरी आंतरिक शांति को इंगित करता है।",
        "पांचवें घर में बृहस्पति बच्चों, रचनात्मकता और निवेश या सट्टेबाजी के माध्यम से सौभाग्य के लिए एक आशीर्वाद है। आपकी बुद्धि व्यापक है और आपकी रचनात्मकता विस्तृत है।",
        "छठे घर में बृहस्पति ज्ञान के साथ संघर्षों और स्वास्थ्य समस्याओं पर काबू पाने में मदद करता है। आप अपनी सेवा में उदार हैं और अपने काम में एक महान शिक्षक या परामर्शदाता हो सकते हैं।",
        "सातवें घर में बृहस्पति एक बुद्धिमान, भाग्यशाली और सैद्धांतिक साथी का वादा करता है। आपके रिश्ते आपके जीवन में विकास और विस्तार का एक स्रोत हैं।",
        "आठवें घर में बृहस्पति विरासत या भागीदारों के माध्यम से धन ला सकता है, और जीवन के रहस्यों और दीर्घायु में गहरी, दार्शनिक रुचि देता है।",
        "नौवें घर में बृहस्पति (अपने ही घर में) भाग्य, उच्च ज्ञान और धर्म के लिए अत्यंत शक्तिशाली है। आप जन्मजात शिक्षक, दार्शनिक या मार्गदर्शक हैं, जो भाग्य से धन्य हैं।",
        "दसवें घर में बृहस्पति आपके करियर में बड़ी सफलता, नैतिकता और ज्ञान प्रदान करता है। आप अपने क्षेत्र में एक सलाहकार, शिक्षक या नेता के रूप में एक उच्च पद प्राप्त कर सकते हैं।",
        "ग्यारहवें घर में बृहस्पति लाभ और इच्छाओं की पूर्ति के लिए सबसे अच्छे स्थानों में से एक है। आपके पास शक्तिशाली और सहायक मित्रों का एक विस्तृत नेटवर्क है।",
        "बारहवें घर में बृहस्पति दिव्य सुरक्षा और आध्यात्मिकता, ध्यान और दान में गहरी रुचि प्रदान करता है। आप एकांत और जाने देने में ज्ञान पाते हैं।"
    ],
    Venus: [
        "पहले घर में शुक्र आपको आकर्षण, अनुग्रह और सुंदरता और सद्भाव के प्रति प्रेम का आशीर्वाद देता है। आप स्वाभाविक रूप से आकर्षक, कूटनीतिक और एक सुखद व्यवहार वाले हैं।",
        "दूसरे घर में शुक्र धन के लिए उत्कृष्ट है, जो विलासिता की वस्तुओं, बढ़िया भोजन और एक सुंदर बोलने वाली आवाज के लिए प्यार देता है। आप अपने आकर्षण के माध्यम से आसानी से पैसा आकर्षित करते हैं।",
        "तीसरे घर में शुक्र आपकी संचार शैली को कलात्मक और सुखद बनाता है। आपके पास रचनात्मक लेखन, कविता या डिजाइन के लिए एक प्रतिभा है और आप सामंजस्यपूर्ण भाई-बहन के संबंधों का आनंद लेते हैं।",
        "चौथे घर में शुक्र एक सुंदर घर, आराम के प्रति प्रेम और एक सुखी घरेलू जीवन को इंगित करता है। आपके पास लक्जरी वाहन हो सकते हैं और आपकी माँ के साथ एक मजबूत, प्रेमपूर्ण बंधन हो सकता है।",
        "पांचवें घर में शुक्र रचनात्मकता, रोमांस और कलात्मक प्रतिभा प्रदान करता है। आप अत्यधिक करिश्माई हैं और प्रेम संबंधों, कला और मनोरंजन में बहुत खुशी पाते हैं।",
        "छठे घर में शुक्र कार्यस्थल पर सद्भाव ला सकता है, लेकिन यह भी इंगित करता है कि अधिक भोग से स्वास्थ्य संबंधी समस्याएं उत्पन्न हो सकती हैं। आप कला या डिजाइन के माध्यम से दूसरों की सेवा कर सकते हैं।",
        "सातवें घर में शुक्र (अपने ही घर में) एक सुंदर, आकर्षक और समर्पित साथी का एक मजबूत संकेतक है। आपकी खुशी और सामाजिक जीवन के लिए आपका विवाह केंद्रीय है।",
        "आठवें घर में शुक्र विवाह या विरासत के माध्यम से धन ला सकता है, लेकिन यह तीव्र, गुप्त संबंधों को भी इंगित करता है। यह एक मजबूत चुंबकत्व और आकर्षण देता है।",
        "नौवें घर में शुक्र दर्शन, कला और विभिन्न संस्कृतियों में सुंदरता के प्रति प्रेम दिखाता है। आपके विश्वास सद्भाव पर केंद्रित हैं, और आप विदेशी भूमि से एक साथी ढूंढ सकते हैं।",
        "दसवें घर में शुक्र कला, मनोरंजन, सौंदर्य या कूटनीति से संबंधित करियर में सफलता प्रदान करता है। आप एक आकर्षक सार्वजनिक छवि है और आपको बहुत पसंद किया जाता है।",
        "ग्यारहवें घर में शुक्र आपके आकर्षण और सामाजिक अनुग्रह के माध्यम से लाभ और दोस्ती लाता है। आपके पास कलात्मक और धनी मित्रों का एक नेटवर्क है जो आपके लक्ष्यों को प्राप्त करने में आपकी मदद करते हैं।",
        "बारहवें घर में शुक्र एकांत, आध्यात्मिकता और कल्पना में प्रेम और सुंदरता पाता है। यह छिपे हुए संबंधों या निजी तौर पर शानदार सुख-सुविधाओं के प्रति प्रेम को इंगित कर सकता है।"
    ],
    Saturn: [
        "पहले घर में शनि आपके व्यक्तित्व में गंभीरता, अनुशासन और जिम्मेदारी जोड़ता है। आप कम उम्र से ही बोझिल जिम्मेदारियों को महसूस कर सकते हैं लेकिन महान सहनशक्ति विकसित करते हैं।",
        "दूसरे घर में शनि वित्त और पारिवारिक धन को प्रतिबंधित कर सकता है, समय के साथ कड़ी मेहनत और बचत की मांग करता है। यह एक गंभीर, व्यावहारिक और कभी-कभी उदास भाषण देता है।",
        "तीसरे घर में शनि भाई-बहनों या संचार के साथ चुनौतियां पैदा कर सकता है। हालांकि, यह किसी भी कौशल में immense दृढ़ता और अनुशासन देता है जिसे आप मास्टर करने के लिए निर्धारित करते हैं।",
        "चौथे घर में शनि एक प्रतिबंधात्मक या भावनात्मक रूप से ठंडा घरेलू वातावरण इंगित कर सकता है। यह अनुशासन और कड़ी मेहनत के माध्यम से समय के साथ धीरे-धीरे सुरक्षा का निर्माण करता है।",
        "पांचवें घर में शनि बच्चों, रोमांस और रचनात्मकता के प्रति देरी या एक गंभीर दृष्टिकोण ला सकता है। आपकी रचनात्मक गतिविधियां संरचित हैं और जीवन में बाद में प्रकट हो सकती हैं।",
        "छठे घर में शनि दृढ़ता के माध्यम से दुश्मनों पर काबू पाने के लिए एक शक्तिशाली स्थान है। यह एक मेहनती कार्यकर्ता को दिखाता है लेकिन पुरानी स्वास्थ्य समस्याओं को इंगित कर सकता है जिसके लिए अनुशासन की आवश्यकता होती है।",
        "सातवें घर में शनि विवाह में देरी कर सकता है या एक परिपक्व, पुराने या बहुत जिम्मेदार साथी को ला सकता है। यह रिश्तों में प्रतिबद्धता, संरचना और धैर्य की मांग करता है।",
        "आठवें घर में शनि दीर्घायु के लिए एक मजबूत स्थान है। यह लंबे, धैर्यपूर्ण इंतजार के माध्यम से विरासत ला सकता है, और अनुसंधान और तत्वमीमांसा में एक गहरी, गंभीर रुचि देता है।",
        "नौवें घर में शनि एक संरचित, पारंपरिक और कभी-कभी कठोर विश्वास प्रणाली बनाता है। आप दर्शन और उच्च शिक्षा को गंभीरता से लेते हैं, लेकिन अपने शिक्षकों पर सवाल उठा सकते हैं।",
        "दसवें घर में शनि (एक मजबूत स्थान) धीमी, स्थिर और अनुशासित कड़ी मेहनत के माध्यम से सफलता और उच्च स्थिति लाता है। आप समय के साथ एक स्थायी करियर और प्रतिष्ठा का निर्माण करते हैं।",
        "ग्यारहवें घर में शनि इच्छाओं की पूर्ति को एक धीमी प्रक्रिया बना सकता है। दोस्त कम लेकिन लंबे समय तक चलने वाले होते हैं। दृढ़ता और स्थापित नेटवर्क के माध्यम से लाभ होता है।",
        "बारहवें घर में शनि एक एकाकी, अनुशासित आध्यात्मिक मार्ग को इंगित करता है। यह ध्यान और परदे के पीछे के काम के लिए उत्कृष्ट है लेकिन अलगाव की भावनाओं को इंगित कर सकता है।"
    ],
    Rahu: [
        "पहले घर में राहु एक शक्तिशाली, महत्वाकांक्षी और अपरंपरागत व्यक्तित्व बनाता है। आपको मान्यता के लिए एक अतृप्त इच्छा होती है और आप खुद को साबित करने के लिए एक बाहरी व्यक्ति की तरह महसूस कर सकते हैं।",
        "दूसरे घर में राहु धन और संपत्ति जमा करने के लिए एक बड़ी इच्छा देता है। यह अपरंपरागत स्रोतों से धन ला सकता है, लेकिन असत्य भाषण की प्रवृत्ति भी हो सकती है।",
        "तीसरे घर में राहु immense साहस और एक शक्तिशाली, प्रेरक संचार शैली प्रदान करता है। आप मीडिया, प्रौद्योगिकी या विपणन में उत्कृष्टता प्राप्त कर सकते हैं, लेकिन जोड़ तोड़ भी हो सकते हैं।",
        "चौथे घर में राहु घर और भावनात्मक शांति के संबंध में बेचैनी पैदा कर सकता है। आपके घरेलू जीवन में विदेशी तत्व हो सकते हैं या कभी भी वास्तव में बसे हुए न होने की भावना हो सकती है।",
        "पांचवें घर में राहु रचनात्मकता, रोमांस और अटकलों के लिए एक जुनूनी प्रेरणा लाता है। यह मनोरंजन के माध्यम से प्रसिद्धि प्रदान कर सकता है लेकिन बच्चों के प्रति अपरंपरागत दृष्टिकोण भी हो सकता है।",
        "छठे घर में राहु दुश्मनों पर काबू पाने और अपरंपरागत तरीकों से जटिल समस्याओं को हल करने की एक अलौकिक क्षमता प्रदान करता है। यह प्रौद्योगिकी या उपचार में सफलता दे सकता है।",
        "सातवें घर में राहु साझेदारी के लिए एक मजबूत इच्छा पैदा करता है, अक्सर किसी ऐसे व्यक्ति के साथ जो एक अलग पृष्ठभूमि या संस्कृति से हो। रिश्ते एक प्रमुख फोकस हैं और अपरंपरागत हो सकते हैं।",
        "आठवें घर में राहु रहस्यों, तत्वमीमांसा और अचानक धन में एक शक्तिशाली और जुनूनी रुचि देता है। यह अप्रत्याशित लाभ और हानि और अनुसंधान के लिए एक प्रतिभा ला सकता है।",
        "नौवें घर में राहु अपरंपरागत विश्वासों और पारंपरिक धर्म और शिक्षकों के प्रति एक प्रश्नवाचक दृष्टिकोण बनाता है। यह विदेशी भूमि में बड़ी सफलता प्राप्त कर सकता है।",
        "दसवें घर में राहु करियर की महत्वाकांक्षा और प्रसिद्धि के लिए एक शक्तिशाली चालक है। आप उच्च स्थिति प्राप्त करने के लिए नियमों को तोड़ने से डरते नहीं हैं और अपने पेशे में तेजी से आगे बढ़ सकते हैं।",
        "ग्यारहवें घर में राहु प्रौद्योगिकी और बड़े नेटवर्क के माध्यम से भारी लाभ और इच्छाओं की पूर्ति के लिए एक उत्कृष्ट स्थान है। आपके पास प्रभावशाली और अपरंपरागत दोस्त हैं।",
        "बारहवें घर में राहु अपनी जुनूनी ऊर्जा को आध्यात्मिकता, विदेशी भूमि या छिपे हुए मामलों की ओर निर्देशित करता है। यह शक्तिशाली सहज अंतर्दृष्टि दे सकता है या गुप्त सौदों और खर्चों को जन्म दे सकता है।"
    ],
    Ketu: [
        "पहले घर में केतु एक अलग, आत्मनिरीक्षण और आध्यात्मिक रूप से इच्छुक व्यक्तित्व बनाता है। आप जड़हीनता की भावना महसूस कर सकते हैं या अपनी पहचान पर सवाल उठा सकते हैं, जिससे आध्यात्मिक खोज हो सकती है।",
        "दूसरे घर में केतु धन और परिवार के प्रति एक अलग रवैया बना सकता है। यह वित्तीय अनिश्चितता या फोकस की कमी का कारण बन सकता है।",
        "तीसरे घर में केतु एक सहज और गैर-रेखीय संचार शैली लाता है। आपको पारंपरिक मीडिया में कोई दिलचस्पी नहीं हो सकती है, लेकिन आपके पास शक्तिशाली मानसिक या प्रतीकात्मक अंतर्दृष्टि हो सकती है।",
        "चौथे घर में केतु आपके घर और जड़ों के बारे में एक अलग या अस्थिर भावना का संकेत दे सकता है। यह एक भौतिक घर के बजाय एक आध्यात्मिक 'घर' की खोज को बढ़ावा देता है।",
        "पांचवें घर में केतु रोमांस, रचनात्मकता और बच्चों का एक अलग और महत्वपूर्ण दृष्टिकोण बनाता है। आपके पास अत्यधिक सहज बुद्धि हो सकती है लेकिन पारंपरिक रचनात्मक अभिव्यक्ति के साथ संघर्ष कर सकते हैं।",
        "छठे घर में केतु समस्याओं या बीमारियों का सहज रूप से निदान और समाधान करने की एक शक्तिशाली क्षमता प्रदान करता है। हालांकि, यह अजीब, कठिन-से-निदान स्वास्थ्य समस्याओं का भी संकेत दे सकता है।",
        "सातवें घर में केतु साझेदारी के लिए एक आध्यात्मिक, अलग या महत्वपूर्ण दृष्टिकोण लाता है। आप अपने साथी के प्रति एक कर्म संबंध महसूस कर सकते हैं, लेकिन असंतोष की भावना भी महसूस कर सकते हैं।",
        "आठवें घर में केतु गहरे रहस्यमय और गुप्त अनुसंधान के लिए एक शक्तिशाली स्थान है। आपके पास भ्रम के माध्यम से देखने और गहरे आध्यात्मिक सत्य को समझने की एक प्राकृतिक क्षमता है।",
        "नौवें घर में केतु पारंपरिक विश्वासों पर सवाल उठाने और अधिक प्रत्यक्ष, सहज आध्यात्मिक सत्य की खोज का संकेत देता है। यह दर्शन के पिछले जीवन की महारत को दर्शाता है।",
        "दसवें घर में केतु एक ऐसा करियर पथ बनाता है जो अपरंपरागत, आध्यात्मिक या अनुसंधान से जुड़ा होता है। आप पद और प्रसिद्धि की महत्वाकांक्षाओं से अलग हैं।",
        "ग्यारहवें घर में केतु सामाजिक नेटवर्क और भौतिक लाभ का एक अलग दृष्टिकोण देता है। आपकी दोस्ती कुछ या असामान्य हो सकती है, और आपके लक्ष्य अक्सर भौतिकवादी नहीं होते हैं।",
        "बारहवें घर में केतु मुक्ति (मोक्ष) का कारक है और यहाँ अत्यंत शक्तिशाली है। यह गहन सहज अंतर्दृष्टि, ध्यान क्षमता और आध्यात्मिक वैराग्य प्रदान करता है।"
    ]
};

export function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function generateLordshipText(lordOfHouse, placementHouse, lordPlanet, planetaryPowers, lang = 'en') {
    const houseThemes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    const planetNames = lang === 'hi' ? planetNames_hi : { Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn' };

    const themes1 = houseThemes[lordOfHouse];
    const themes2 = houseThemes[placementHouse];
    const lord = planetNames[lordPlanet] || lordPlanet;
    const lordOfOrdinal = lang === 'hi' ? `${lordOfHouse}` : getOrdinal(lordOfHouse);
    const placementOrdinal = lang === 'hi' ? `${placementHouse}` : getOrdinal(placementHouse);

    const TRIKONA = [1, 5, 9];
    const KENDRA = [1, 4, 7, 10];
    const DUSTHANA = [6, 8, 12];
    const UPACHAYA = [3, 6, 10, 11];

    let strengthComment = '';
    const lordScore = planetaryPowers[lordPlanet]?.total;
    if (lordScore !== undefined) {
        const strengthDesc = getUPBSDescription(lordScore, lang);
        strengthComment = lang === 'hi' ? ` (इसकी समग्र शक्ति ${lordScore.toFixed(2)} है, और यह ${strengthDesc})` : ` (Its overall strength is ${lordScore.toFixed(2)}, and it ${strengthDesc})`;
    }

    if (lang === 'hi') {
        // Case 1: Lord in its own house
        if (lordOfHouse === placementHouse) {
            return `${lordOfOrdinal} घर का स्वामी, ${lord}, अपने ही घर में है${strengthComment}। यह इस घर (${themes1}) के मामलों को शक्तिशाली रूप से मजबूत करता है, जिससे वे आपके जीवन में एक केंद्रीय और आत्मनिर्भर विषय बन जाते हैं। इस क्षेत्र पर आपका स्वाभाविक नियंत्रण और कमान है।`;
        }

        // Case 2: Raja Yoga (Lord of Kendra in Trikona or vice-versa)
        if ((KENDRA.includes(lordOfHouse) && TRIKONA.includes(placementHouse)) || (TRIKONA.includes(lordOfHouse) && KENDRA.includes(placementHouse))) {
            return `यह एक शक्तिशाली राज योग बनाता है, जो सफलता और स्थिति का एक संयोजन है। ${lordOfOrdinal} घर (${themes1}) के स्वामी (${lord}) का ${placementOrdinal} घर (${themes2}) से जुड़ना यह दर्शाता है कि आपका भाग्य और कर्म जुड़े हुए हैं, जो आपके प्रयासों को धर्मी तरीके से लागू करके महत्वपूर्ण उपलब्धियों का वादा करता है${strengthComment}।`;
        }
        
        // Case 3: Viparita Raja Yoga (Lords of Dusthanas in other Dusthanas)
        if (DUSTHANA.includes(lordOfHouse) && DUSTHANA.includes(placementHouse)) {
            return `यह एक विपरीत राज योग बना सकता है। एक चुनौतीपूर्ण घर (${lordOfOrdinal} - ${themes1}) के स्वामी (${lord}) का दूसरे चुनौतीपूर्ण घर (${placementOrdinal} - ${themes2}) में जाना यह दर्शाता है कि आप कठिन परिस्थितियों से अप्रत्याशित रूप से लाभ प्राप्त कर सकते हैं। यह प्रारंभिक संघर्ष या हानि की अवधि के बाद अचानक सकारात्मक बदलाव ला सकता है${strengthComment}।`;
        }

        // Case 4: Lord of a good house in a Dusthana
        if ((KENDRA.includes(lordOfHouse) || TRIKONA.includes(lordOfHouse)) && DUSTHANA.includes(placementHouse)) {
            return `आपके ${lordOfOrdinal} घर (${themes1}) की सकारात्मक ऊर्जा चुनौतीपूर्ण ${placementOrdinal} घर (${themes2}) में जा रही है। यह बताता है कि आपकी व्यक्तिगत पहचान, भाग्य, या कार्यों का परीक्षण संघर्ष, छिपे हुए मामलों, या बाधाओं पर काबू पाने में किया जा सकता है${strengthComment}।`;
        }

        // Case 5: Lord of a Dusthana in a good house
        if (DUSTHANA.includes(lordOfHouse) && (KENDRA.includes(placementHouse) || TRIKONA.includes(placementHouse))) {
            return `आपके ${lordOfOrdinal} घर (${themes1}) के चुनौतीपूर्ण विषय आपके जीवन के एक प्रमुख क्षेत्र, ${placementOrdinal} घर (${themes2}) में लाए जाते हैं। यह बताता है कि संघर्ष, स्वास्थ्य, या हानि के मामले सीधे आपकी व्यक्तिगत पहचान, घर, या भाग्य को प्रभावित कर सकते हैं, जिसके लिए सचेत प्रबंधन की आवश्यकता होती है${strengthComment}।`;
        }

        // Default generic (but improved) case
        return `आपके ${lordOfOrdinal} घर (जो ${themes1} को नियंत्रित करता है) का स्वामी, जो ${lord} है, आपके ${placementOrdinal} घर में स्थित है${strengthComment}। यह एक शक्तिशाली लिंक बनाता है, यह सुझाव देता है कि आपके ${lordOfOrdinal} घर के मामलों को पूरा करने का आपका मार्ग ${themes2} से संबंधित गतिविधियों से गहरा जुड़ा हुआ है।`;
    }

    // English version
    // Case 1: Lord in its own house
    if (lordOfHouse === placementHouse) {
        return `The lord of the ${lordOfOrdinal} house, ${lord}, is in its own house${strengthComment}. This powerfully strengthens the matters of this house (${themes1}), making them a central and self-sufficient theme in your life. You have natural control and command over this area.`;
    }

    // Case 2: Raja Yoga (Lord of Kendra in Trikona or vice-versa)
    if ((KENDRA.includes(lordOfHouse) && TRIKONA.includes(placementHouse)) || (TRIKONA.includes(lordOfHouse) && KENDRA.includes(placementHouse))) {
        return `This forms a powerful Raja Yoga, a combination for success and status. The lord of the ${lordOfOrdinal} house (${themes1}) connecting with the ${placementOrdinal} house (${themes2}) indicates that your fortune and actions are linked, promising significant achievements by applying your efforts in a righteous way${strengthComment}.`;
    }
    
    // Case 3: Viparita Raja Yoga (Lords of Dusthanas in other Dusthanas)
    if (DUSTHANA.includes(lordOfHouse) && DUSTHANA.includes(placementHouse)) {
        return `This can form a Viparita Raja Yoga. The lord of a challenging house (${lordOfOrdinal} - ${themes1}) moving to another challenging house (${placementOrdinal} - ${themes2}) indicates that you may gain unexpectedly from difficult situations. It can bring sudden positive shifts after periods of initial struggle or loss${strengthComment}.`;
    }

    // Case 4: Lord of a good house in a Dusthana
    if ((KENDRA.includes(lordOfHouse) || TRIKONA.includes(lordOfHouse)) && DUSTHANA.includes(placementHouse)) {
        return `The positive energies of your ${lordOfOrdinal} house (${themes1}) are being channeled into the challenging ${placementOrdinal} house (${themes2}). This suggests that your personal identity, fortune, or actions may be tested or spent in dealing with conflicts, hidden matters, or overcoming obstacles${strengthComment}.`;
    }

    // Case 5: Lord of a Dusthana in a good house
    if (DUSTHANA.includes(lordOfHouse) && (KENDRA.includes(placementHouse) || TRIKONA.includes(placementHouse))) {
        return `The challenging themes of your ${lordOfOrdinal} house (${themes1}) are brought into a key area of your life, the ${placementOrdinal} house (${themes2}). This suggests that matters of conflict, health, or loss may directly impact your personal identity, home, or fortune, requiring conscious management${strengthComment}.`;
    }

    // Default generic (but improved) case
    return `The lord of your ${lordOfOrdinal} house (governing ${themes1}), which is ${lord}, is placed in your ${placementOrdinal} house${strengthComment}. This links matters of ${themes1} with activities related to ${themes2}.`;
}


export const nakshatraTraitsLong_en = {
    Ashwini: "Ashwini grants vitality, speed, boldness, and a youthful spirit. You excel at initiating tasks and may have natural healing or rescue abilities. Your instinct is fast and intuitive.",
    Bharani: "Bharani gives intense endurance, moral strength, and transformative power. You experience life deeply and can handle karmic purification with resilience.",
    Krittika: "Krittika brings sharp intellect, cleansing energy, leadership ability, and determination. You cut through illusions and pursue excellence.",
    Rohini: "Rohini gives charm, beauty, creativity, material growth, and nurturing ability. You attract abundance and artistic expression.",
    Mrigashira: "Mrigashira gives curiosity, a searching nature, intellectual sharpness, and restlessness. You constantly seek deeper understanding.",
    Ardra: "Ardra symbolizes transformation through storms. You possess emotional depth, intense insight, and the capacity to rebuild life.",
    Punarvasu: "Punarvasu gives renewal, hope, gentleness, and restorative energy. You rise after setbacks and spread optimism.",
    Pushya: "Pushya gives nourishment, wisdom, responsibility, and spiritual grace. You support others and value disciplined purity.",
    Ashlesha: "Ashlesha brings depth, intuition, psychological insight, and hypnotic influence. You understand hidden motives.",
    Magha: "Magha grants ancestral strength, leadership, recognition, and royal dignity. Your personality carries authority.",
    PurvaPhalguni: "Purva Phalguni gives creativity, charm, relaxation, attractions, and enjoyment of life's pleasures.",
    UttaraPhalguni: "Uttara Phalguni gives integrity, reliability, discipline, and a strong sense of duty toward relationships.",
    Hasta: "Hasta gives manual skill, control, cleverness, communication talent, and sincerity.",
    Chitra: "Chitra grants artistry, design sense, charisma, and strong individuality.",
    Swati: "Swati gives independence, adaptability, self-discovery, and freedom in thought and movement.",
    Vishakha: "Vishakha grants determination, ambition, goal-orientation, and a deep hunger for achievement.",
    Anuradha: "Anuradha gives devotion, friendship, loyalty, discipline, and cooperation.",
    Jyeshtha: "Jyeshtha grants authority, seniority, protection, and sharp intelligence.",
    Mula: "Mula gives deep truth-seeking, intensity, philosophical depth, and transformative energy.",
    PurvaAshadha: "Purva Ashadha gives victory, confidence, persuasiveness, and idealistic motivation.",
    UttaraAshadha: "Uttara Ashadha gives nobility, discipline, leadership ability, and long-term success. You are committed to your principles and can achieve lasting victory through patient, persistent effort.",
    Shravana: "Shravana gives learning ability, listening skills, wisdom, and social respect.",
    Dhanishta: "Dhanishta grants rhythm, wealth potential, generosity, and leadership in groups.",
    Shatabhisha: "Shatabhisha grants healing ability, secrecy, research skills, and mystical insight.",
    PurvaBhadrapada: "Purva Bhadrapada grants intensity, spiritual idealism, transformative thinking, and strong determination.",
    UttaraBhadrapada: "Uttara Bhadrapada grants peace, patience, inner wisdom, and stable emotional maturity.",
    Revati: "Revati provides compassion, gentleness, creativity, security, and spiritual refinement.",
    Unknown: "Unknown" // Added Unknown Nakshatra
};


export const nakshatraTraitsLong_hi = {
    Ashwini: "अश्विनी जीवन शक्ति, गति, साहस और युवा भावना प्रदान करती है। आप काम शुरू करने में माहिर हैं और आपके पास प्राकृतिक उपचार या बचाव की क्षमता हो सकती है। आपकी प्रवृत्ति तेज़ और सहज है।",
    Bharani: "भरणी तीव्र सहनशक्ति, नैतिक शक्ति और परिवर्तनकारी शक्ति देती है। आप जीवन को गहराई से अनुभव करते हैं और लचीलेपन के साथ कर्मों के शुद्धिकरण को संभाल सकते हैं।",
    Krittika: "कृतिका तेज बुद्धि, शुद्ध करने वाली ऊर्जा, नेतृत्व क्षमता और दृढ़ संकल्प लाती है। आप भ्रम को दूर करते हैं और उत्कृष्टता का पीछा करते हैं।",
    Rohini: "रोहिणी आकर्षण, सुंदरता, रचनात्मकता, भौतिक विकास और पोषण करने की क्षमता देती है। आप प्रचुरता और कलात्मक अभिव्यक्ति को आकर्षित करते हैं।",
    Mrigashira: "मृगशिरा जिज्ञासा, खोजी स्वभाव, बौद्धिक तीक्ष्णता और बेचैनी देती है। आप लगातार गहरी समझ की तलाश करते हैं।",
    Ardra: "आर्द्रा तूफानों के माध्यम से परिवर्तन का प्रतीक है। आपके पास भावनात्मक गहराई, तीव्र अंतर्दृष्टि और जीवन को फिर से बनाने की क्षमता है।",
    Punarvasu: "पुनर्वसु नवीनीकरण, आशा, कोमलता और पुनर्स्थापनात्मक ऊर्जा देती है। आप असफलताओं के बाद उठते हैं और आशावाद फैलाते हैं।",
    Pushya: "पुष्य पोषण, ज्ञान, जिम्मेदारी और आध्यात्मिक कृपा देता है। आप दूसरों का समर्थन करते हैं और अनुशासित पवित्रता को महत्व देते हैं।",
    Ashlesha: "आश्लेषा गहराई, अंतर्ज्ञान, मनोवैज्ञानिक अंतर्दृष्टि और सम्मोहक प्रभाव लाती है। आप छिपे हुए उद्देश्यों को समझते हैं।",
    Magha: "मघा पैतृक शक्ति, नेतृत्व, पहचान और शाही गरिमा प्रदान करती है। आपके व्यक्तित्व में अधिकार होता है।",
    "Purva Phalguni": "पूर्वा फाल्गुनी रचनात्मकता, आकर्षण, विश्राम, आकर्षण और जीवन के सुखों का आनंद देती है।",
    "Uttara Phalguni": "उत्तरा फाल्गुनी ईमानदारी, विश्वसनीयता, अनुशासन और रिश्तों के प्रति कर्तव्य की एक मजबूत भावना देती है।",
    Hasta: "हस्त हस्त कौशल, नियंत्रण, चतुराई, संचार प्रतिभा और ईमानदारी देता है।",
    Chitra: "चित्रा कलात्मकता, डिजाइन की समझ, करिश्मा और मजबूत व्यक्तित्व प्रदान करती है।",
    Swati: "स्वाति स्वतंत्रता, अनुकूलनशीलता, आत्म-खोज और विचार और गति में स्वतंत्रता देती है।",
    Vishakha: "विशाखा दृढ़ संकल्प, महत्वाकांक्षा, लक्ष्य-उन्मुखता और उपलब्धि के लिए गहरी भूख प्रदान करती है।",
    Anuradha: "अनुराधा भक्ति, मित्रता, वफादारी, अनुशासन और सहयोग देती है।",
    Jyeshtha: "ज्येष्ठा अधिकार, वरिष्ठता, संरक्षण और तेज बुद्धि प्रदान करती है।",
    Mula: "मूल गहरा सत्य की खोज, तीव्रता, दार्शनिक गहराई और परिवर्तनकारी ऊर्जा।",
    "Purva Ashadha": "पूर्वाषाढ़ा विजय, आत्मविश्वास, प्रेरक क्षमता और आदर्शवादी प्रेरणा देता है।",
    "Uttara Ashadha": "उत्तराषाढ़ा कुलीनता, अनुशासन, नेतृत्व क्षमता और दीर्घकालिक सफलता देता है। आप अपने सिद्धांतों के प्रति प्रतिबद्ध हैं और धैर्यवान, निरंतर प्रयास के माध्यम से स्थायी जीत हासिल कर सकते हैं।",
    Shravana: "श्रवण सीखने की क्षमता, सुनने का कौशल, ज्ञान और सामाजिक सम्मान देता है।",
    Dhanishta: "धनिष्ठा लय, धन की संभावना, उदारता और समूहों में नेतृत्व प्रदान करता है।",
    Shatabhisha: "शतभिषा उपचार क्षमता, गोपनीयता, अनुसंधान कौशल और रहस्यमय अंतर्दृष्टि देता है।",
    "Purva Bhadrapada": "पूर्व भाद्रपद तीव्रता, आध्यात्मिक आदर्शवाद, परिवर्तनकारी सोच और दृढ़ संकल्प देता है।",
    "Uttara Bhadrapada": "उत्तराभाद्रपद शांति, धैर्य, आंतरिक ज्ञान और स्थिर भावनात्मक परिपक्वता देता है।",
    Revati: "रेवती करुणा, कोमलता, रचनात्मकता, सुरक्षा और आध्यात्मिक परिष्कार प्रदान करती है।" ,
    Unknown: "अज्ञात" // Added Unknown Nakshatra
};


// Helper function to provide a qualitative description of strength based on UPBS
export function getUPBSDescription(score, lang = 'en') {
    if (lang === 'hi') {
        if (score >= 12) return `असाधारण रूप से शुभ और शक्तिशाली है, जो उत्कृष्ट परिणाम देने में सक्षम है।`;
        if (score >= 5) return `शुभ और अच्छी तरह से स्थित है, जो जीवन में सकारात्मकता और आसानी का वादा करता है।`;
        if (score >= 0) return `हल्का शुभ है, लेकिन इसके प्रभाव मिश्रित हो सकते हैं या अन्य ग्रहों के समर्थन पर निर्भर हो सकते हैं।`;
        if (score >= -4) return `थोड़ा पीड़ित है, जो कुछ चुनौतियों या बाधाओं का संकेत देता है।`;
        if (score >= -10) return `काफी पीड़ित है, और इसके क्षेत्रों में महत्वपूर्ण चुनौतियों का प्रबंधन करने के लिए सचेत प्रयास की आवश्यकता होगी।`;
        return `गंभीर रूप से पीड़ित है, जो इसके संकेतकों से संबंधित क्षेत्रों में बड़े अवरोधों या कठिनाइयों का सुझाव देता है।`;
    }
    // English default
    if (score >= 12) return `is exceptionally benefic and powerful, capable of delivering excellent results.`;
    if (score >= 5) return `is benefic and well-disposed, promising positivity and ease in life.`;
    if (score >= 0) return `is mildly benefic, though its effects may be mixed or dependent on other planetary support.`;
    if (score >= -4) return `is slightly afflicted, indicating some struggles or obstacles.`;
    if (score >= -10) return `is significantly afflicted, and will require conscious effort to manage the challenges in its domains.`;
    return `is severely afflicted, suggesting major blockages or difficulties in areas related to its significations.`;
}


// Helper function to provide a qualitative description of strength
function getStrengthDescription(strength, lang = 'en') {
    // This function now maps the UPBS score ranges to the old percentage-style descriptions for compatibility where needed.
    // However, getUPBSDescription should be preferred for more nuanced text.
    if (lang === 'hi') {
        if (strength >= 12) return `असाधारण रूप से मजबूत है, जो आपके भाग्य पर एक प्रमुख और स्पष्ट प्रभाव डालता है।`;
        if (strength >= 5) return `काफी मजबूत है, जो बताता है कि जीवन की घटनाओं में इसका एक शक्तिशाली और सीधा कहना है।`;
        if (strength >= 0) return `मध्यम रूप से मजबूत है, जो आपके मार्ग को आकार देने की एक उल्लेखनीय लेकिन संतुलित क्षमता का सुझाव देता है।`;
        if (strength >= -4) return `का प्रभाव मध्यम लेकिन कभी-कभी असंगत होता है, जिसकी क्षमता को सक्रिय करने के लिए सचेत प्रयास की आवश्यकता होती है।`;
        return `की ताकत कुछ कम है, यह सुझाव देता है कि यद्यपि यह एक पृष्ठभूमि विषय निर्धारित करता है, इसका प्रभाव सूक्ष्म हो सकता है या अन्य ग्रहों के समर्थन पर निर्भर हो सकता है।`;
    }
    // English default
    if (strength >= 12) return `is exceptionally strong, giving it a dominant and clear-cut influence over your destiny.`;
    if (strength >= 5) return `is significantly strong, indicating it has a powerful and direct say in your life's events.`;
    if (strength >= 0) return `is moderately strong, suggesting a noticeable but balanced capacity to shape your path.`;
    if (strength >= -4) return `has a moderate but sometimes inconsistent influence, requiring conscious effort to activate its potential.`;
    return `is somewhat less pronounced in strength, suggesting that while it sets a background theme, its influence may be subtle or dependent on support from other planets.`;
}

// Helper function to interpret the Lagna Lord's placement
function getLagnaLordInterpretation(lord, house, lang = 'en') {
    const planetNature_en = { Sun: 'authoritative', Moon: 'receptive', Mars: 'assertive', Mercury: 'intellectual', Jupiter: 'expansive', Venus: 'harmonious', Saturn: 'disciplined', Rahu: 'ambitious', Ketu: 'detached' };
    const planetNature_hi = { Sun: 'आधिकारिक', Moon: 'ग्रहणशील', Mars: 'मुखर', Mercury: 'बौद्धिक', Jupiter: 'विस्तृत', Venus: 'सामंजस्यपूर्ण', Saturn: 'अनुशासित', Rahu: 'महत्वाकांक्षी', Ketu: 'अनासक्त' };
    
    const themes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    const natures = lang === 'hi' ? planetNature_hi : planetNature_en;
    const lordTranslated = lang === 'hi' ? (planetNames_hi[lord] || lord) : lord;

    if (lang === 'hi') {
        return `चूंकि आपका लग्न ${natures[lord] || ''} ${lordTranslated} द्वारा निर्देशित है, इसका ${house}वें घर में स्थान आपकी मुख्य जीवन ऊर्जा को ${themes[house] || ''} के विषयों की ओर निर्देशित करता है।`;
    }
    // English default
    return `As your ascendant is guided by the ${natures[lord] || ''} ${lord}, its placement in the ${house}th house directs your core life energy towards themes of ${themes[house] || ''}.`;
}

// New function for UPBS breakdown interpretation
export function getPlanetUPBSBreakdownDescription(planetName, breakdown, lang = 'en') {
    let description = '';
    const translatedPlanet = getPlanetName(planetName, lang);
    const positiveFactors = [];
    const negativeFactors = [];

    const appendFactor = (factor, score, positivePhrase, negativePhrase) => {
        if (score > 0) {
            positiveFactors.push(positivePhrase(score));
        } else if (score < 0) {
            negativeFactors.push(negativePhrase(score));
        }
    };

    // NBS
    appendFactor('NBS', breakdown.NBS,
        (s) => lang === 'hi' ? `इसकी प्राकृतिक शुभता (${s})` : `its natural beneficence (${s})`,
        (s) => lang === 'hi' ? `इसकी प्राकृतिक अशुभता (${s})` : `its natural maleficence (${s})`
    );

    // FBS
    appendFactor('FBS', breakdown.FBS,
        (s) => lang === 'hi' ? `आपके चार्ट में भाव स्वामित्व की शुभ प्रकृति (${s})` : `the benefic nature of its house lordship (${s}) in your chart`,
        (s) => lang === 'hi' ? `आपके चार्ट में भाव स्वामित्व की अशुभ प्रकृति (${s})` : `the malefic nature of its house lordship (${s}) in your chart`
    );

    // PDS
    appendFactor('PDS', breakdown.PDS,
        (s) => lang === 'hi' ? `इसकी मजबूत गरिमा या उच्च स्थिति (${s})` : `its strong dignity or exalted status (${s})`,
        (s) => lang === 'hi' ? `इसकी कमजोर गरिमा या नीच स्थिति (${s})` : `its weak dignity or debilitated status (${s})`
    );

    // SS
    appendFactor('SS', breakdown.SS,
        (s) => lang === 'hi' ? `इसकी समग्र शक्ति (शद्बल, अवस्था, नवमांश आदि) (${s})` : `its overall strength (Shadbala, Avasthas, Navamsa etc.) (${s})`,
        (s) => lang === 'hi' ? `इसकी समग्र कमजोरी (शद्बल, अवस्था, नवमांश आदि) (${s})` : `its overall weakness (Shadbala, Avasthas, Navamsa etc.) (${s})`
    );

    // CRS
    appendFactor('CRS', breakdown.CRS,
        (s) => lang === 'hi' ? `वक्रत्व (retrograde) का सकारात्मक प्रभाव (${s})` : `the positive effect of its retrograde motion (${s})`,
        (s) => lang === 'hi' ? `अस्तंगत (combust) होने या वक्रत्व का नकारात्मक प्रभाव (${s})` : `the negative impact of combustion or retrograde motion (${s})`
    );

    // HPS
    appendFactor('HPS', breakdown.HPS,
        (s) => lang === 'hi' ? `इसके शुभ भाव में स्थान (${s})` : `its placement in an auspicious house (${s})`,
        (s) => lang === 'hi' ? `इसके अशुभ भाव में स्थान (${s})` : `its placement in an inauspicious house (${s})`
    );

    // ARS
    appendFactor('ARS', breakdown.ARS,
        (s) => lang === 'hi' ? `इस पर शुभ ग्रहों के पहलू (${s})` : `the beneficial aspects it receives (${s})`,
        (s) => lang === 'hi' ? `इस पर अशुभ ग्रहों के पहलू (${s})` : `the challenging aspects it receives (${s})`
    );

    // NLM
    appendFactor('NLM', breakdown.NLM,
        (s) => lang === 'hi' ? `इसके नक्षत्र स्वामी की शुभ प्रकृति (${s})` : `the benefic nature of its Nakshatra Lord (${s})`,
        (s) => lang === 'hi' ? `इसके नक्षत्र स्वामी की अशुभ प्रकृति (${s})` : `the malefic nature of its Nakshatra Lord (${s})`
    );

    // ASC
    appendFactor('ASC', breakdown.ASC,
        (s) => lang === 'hi' ? `शुभ ग्रहों के साथ इसका संबंध (${s})` : `its association with benefic planets (${s})`,
        (s) => lang === 'hi' ? `अशुभ ग्रहों के साथ इसका संबंध (${s})` : `its association with malefic planets (${s})`
    );

    if (positiveFactors.length > 0 && negativeFactors.length === 0) {
        description = lang === 'hi'
            ? `${translatedPlanet} मुख्य रूप से ${positiveFactors.join(', ')} के कारण अत्यंत शुभ है।`
            : `${translatedPlanet} is predominantly benefic, primarily due to ${positiveFactors.join(', ')}.`;
    } else if (negativeFactors.length > 0 && positiveFactors.length === 0) {
        description = lang === 'hi'
            ? `${translatedPlanet} मुख्य रूप से ${negativeFactors.join(', ')} के कारण पीड़ित है।`
            : `${translatedPlanet} is significantly afflicted, mainly due to ${negativeFactors.join(', ')}.`;
    } else if (positiveFactors.length > 0 && negativeFactors.length > 0) {
        description = lang === 'hi'
            ? `${translatedPlanet} की शक्ति ${positiveFactors.join(', ')} के सकारात्मक प्रभावों और ${negativeFactors.join(', ')} के चुनौतीपूर्ण प्रभावों का मिश्रण है।`
            : `${translatedPlanet}'s strength is a mix of positive influences from ${positiveFactors.join(', ')} and challenging effects from ${negativeFactors.join(', ')}.`;
    } else {
        description = lang === 'hi'
            ? `${translatedPlanet} की शक्ति पर औसत प्रभाव है।`
            : `${translatedPlanet}'s strength has an average influence.`;
    }

    return description.trim();
}

export function getCareerFieldSuggestions(houseLord, placementHouse, lang = 'en') {
    const suggestions = {
        en: {
            // By Planet
            Sun: ['government service', 'leadership roles', 'positions of authority', 'medicine'],
            Moon: ['public service', 'nursing', 'hospitality', 'sailing', 'dairy industry', 'dealing with liquids'],
            Mars: ['engineering', 'military', 'surgery', 'policing', 'sports', 'real estate', 'firefighting'],
            Mercury: ['communication', 'writing', 'teaching', 'commerce', 'accounting', 'IT', 'astrology', 'media'],
            Jupiter: ['law', 'teaching', 'consulting', 'finance', 'religion', 'advisory roles', 'banking'],
            Venus: ['arts', 'entertainment', 'fashion', 'beauty', 'luxury goods', 'diplomacy', 'acting', 'music'],
            Saturn: ['manual labor', 'agriculture', 'mining', 'law', 'history', 'architecture', 'civil service', 'social service'],
            Rahu: ['technology', 'research', 'aviation', 'unconventional fields', 'foreign-related jobs', 'IT', 'pharmaceuticals'],
            Ketu: ['spirituality', 'research', 'programming', 'metaphysics', 'healing', 'alternative medicine', 'language expertise'],

            // By House
            1: ['self-employment', 'entrepreneurship', 'roles where your personality is key'],
            2: ['finance', 'banking', 'family business', 'food industry', 'public speaking', 'teaching'],
            3: ['Communication', 'media', 'writing', 'sales', 'marketing', 'short-distance Travel', 'performing arts'],
            4: ['real estate', 'agriculture', 'home-based business', 'psychology', 'vehicle industry', 'education'],
            5: ['education', 'speculation', 'stock market', 'entertainment', 'politics', 'working with Children', 'creative arts'],
            6: ['service industry', 'healthcare', 'law', 'social work', 'military', 'dealing with disputes'],
            7: ['business partnerships', 'foreign trade', 'diplomacy', 'law', 'consulting'],
            8: ['research', 'investigation', 'insurance', 'occult sciences', 'inheritance law', 'mining', 'psychology'],
            9: ['higher education (professor)', 'law', 'religion (priest/preacher)', 'long-distance Travel', 'publishing', 'philosophy'],
            10: ['strong leadership roles', 'public recognition', 'government service', 'independent enterprise'],
            11: ['large organizations', 'NGOs', 'networks', 'financial gains', 'fulfilling ambitions through social circles'],
            12: ['foreign lands', 'hospitals', 'ashrams', 'spiritual institutions', 'behind-the-scenes work', 'research', 'import-export']
        },
        hi: {
            // By Planet
            Sun: ['सरकारी सेवा', 'नेतृत्व की भूमिकाएँ', 'अधिकार के पद', 'चिकित्सा'],
            Moon: ['सार्वजनिक सेवा', 'नर्सिंग', 'अतिथि सत्कार', 'नाविक', 'डेयरी उद्योग', 'तरल पदार्थों से संबंधित कार्य'],
            Mars: ['इंजीनियरिंग', 'सेना', 'सर्जरी', 'पुलिस', 'खेल', 'अचल संपत्ति', 'अग्निशमन'],
            Mercury: ['संचार', 'लेखन', 'शिक्षण', 'वाणिज्य', 'लेखा', 'आईटी', 'ज्योतिष', 'मीडिया'],
            Jupiter: ['कानून', 'शिक्षण', 'परामर्श', 'वित्त', 'धर्म', 'सलाहकार की भूमिकाएँ', 'बैंकिंग'],
            Venus: ['कला', 'मनोरंजन', 'फैशन', 'सौंदर्य', 'विलासिता के सामान', 'कूटनीति', 'अभिनय', 'संगीत'],
            Saturn: ['शारीरिक श्रम', 'कृषि', 'खनन', 'कानून', 'इतिहास', 'वास्तुशिल्प', 'सिविल सेवा', 'समाज सेवा'],
            Rahu: ['प्रौद्योगिकी', 'अनुसंधान', 'विमानन', 'अपरंपरागत क्षेत्र', 'विदेश से संबंधित नौकरियां', 'आईटी', 'फार्मास्यूटिकल्स'],
            Ketu: ['अध्यात्म', 'अनुसंधान', 'प्रोग्रामिंग', 'तत्वमीमांसा', 'उपचार', 'वैकल्पिक चिकित्सा', 'भाषा विशेषज्ञता'],

            // By House
            1: ['स्वरोजगार', 'उद्यमिता', 'ऐसी भूमिकाएँ जहाँ आपका व्यक्तित्व महत्वपूर्ण है'],
            2: ['वित्त', 'बैंकिंग', 'पारिवारिक व्यवसाय', 'खाद्य उद्योग', 'सार्वजनिक भाषण', 'शिक्षण'],
            3: ['संचार', 'मीडिया', 'लेखन', 'बिक्री', 'विपणन', 'छोटी दूरी की यात्रा', 'प्रदर्शन कला'],
            4: ['अचल संपत्ति', 'कृषि', 'गृह-आधारित व्यवसाय', 'मनोविज्ञान', 'वाहन उद्योग', 'शिक्षा'],
            5: ['शिक्षा', 'सट्टा', 'शेयर बाजार', 'मनोरंजन', 'राजनीति', 'बच्चों के साथ काम करना', 'रचनात्मक कला'],
            6: ['सेवा उद्योग', 'स्वास्थ्य सेवा', 'कानून', 'सामाजिक कार्य', 'सेना', 'विवादों से निपटना'],
            7: ['व्यावसायिक साझेदारी', 'विदेश व्यापार', 'कूटनीति', 'कानून', 'परामर्श'],
            8: ['अनुसंधान', 'जांच', 'बीमा', 'गूढ़ विज्ञान', 'विरासत कानून', 'खनन', 'मनोविज्ञान'],
            9: ['उच्च शिक्षा (प्रोफेसर)', 'कानून', 'धर्म (पुजारी/उपदेशक)', 'लंबी दूरी की यात्रा', 'प्रकाशन', 'दर्शन'],
            10: ['मजबूत नेतृत्व की भूमिकाएँ', 'सार्वजनिक मान्यता', 'सरकारी सेवा', 'स्वतंत्र उद्यम'],
            11: ['बड़े संगठन', 'गैर-सरकारी संगठन', 'नेटवर्क', 'वित्तीय लाभ', 'सामाजिक हलकों के माध्यम से महत्वाकांक्षाओं को पूरा करना'],
            12: ['विदेश', 'अस्पताल', 'आश्रम', 'आध्यात्मिक संस्थान', 'पर्दे के पीछे का काम', 'अनुसंधान', 'आयात-निर्यात']
        }
    };

    const currentSuggestions = suggestions[lang];
    const fromPlanet = currentSuggestions[houseLord] || [];
    const fromHouse = currentSuggestions[placementHouse] || [];

    const combined = [...new Set([...fromPlanet, ...fromHouse])]; // Combine and remove duplicates

    if (combined.length === 0) {
        return '';
    }
    const translatedHouseLord = getPlanetName(houseLord, lang);

    const suggestionText = lang === 'hi'
        ? `\n**संभावित करियर क्षेत्र:** आपकी कुंडली के आधार पर, निम्नलिखित करियर क्षेत्र विशेष रूप से आपके लिए अनुकूल हो सकते हैं: ${combined.join(', ')}। ये सुझाव आपके दसवें घर के स्वामी (${translatedHouseLord}) और इसकी घर में स्थिति (${placementHouse}) के संयोजन पर आधारित हैं।`
        : `\n**Potential Career Fields:** Based on your chart, the following career fields may be particularly suitable for you: ${combined.join(', ')}. These suggestions are based on the combination of your 10th house lord (${houseLord}) and its house placement (${placementHouse}).`;
        
    return suggestionText;
}


// ---------------------------------------------------------
//  FULL COMBINED PREDICTION GENERATOR (Lagna, Rashi, Nakshatra)
// ---------------------------------------------------------

export function getCombinedPredictionLong(lagna, rashi, nakshatra, additionalData, lang = 'en') {
    const { lagnaLord, lagnaLordNatalHouse, planetaryPowers, atmakaraka, planetaryPositions, houses } = additionalData || {};
    
    const lagnaTraits_en = {
        Aries: "Being an Aries ascendant, your worldview is shaped by action and courage. You are a natural leader, always ready to take the first step and inspire others. Your energy is infectious, though it can sometimes lead to haste. You prefer to deal with issues directly and honestly, and your path in life involves learning to balance your powerful drive with patience and consideration for others.",
        Taurus: "As a Taurus ascendant, you are grounded and methodical in your approach to life. You seek to create a world of comfort and beauty around you, and you have a natural talent for managing resources. Your determination is a great asset, but it can sometimes manifest as stubbornness.",
        Gemini: "Gemini Lagna blesses you with a flexible, curious, and talkative personality. Mental stimulation drives you, and you constantly seek new ideas, connections, and perspectives. You adapt quickly to changing situations and enjoy sharing knowledge.",
        Cancer: "Cancer Lagna gives you a nurturing, intuitive, and emotionally aware outer personality. You are deeply sensitive to your environment and the needs of others, often acting as a natural protector or caretaker. Family, roots, and personal security matter greatly to you.",
        Leo: "Leo Lagna brings a charismatic, expressive, and confident presence. You naturally gravitate toward leadership roles and appreciate recognition for your efforts. Your personality radiates warmth, creativity, and strong willpower.",
        Virgo: "With Virgo rising, you move through life with precision, logic, and an analytical mindset. You observe details others overlook and strive for improvement in everything you do. Practical and health-conscious, you prefer structure and order.",
        Libra: "Libra Lagna gives you a graceful, balanced, and diplomatic personality. You naturally seek harmony in relationships and environments, excelling at mediation and fairness. You dislike conflict and are gifted at seeing both sides of a situation.",
        Scorpio: "Scorpio Lagna creates a powerful, intense, and deeply insightful personality. Your presence is magnetic, and your emotional depth is unmatched. You rarely reveal your true thoughts easily and possess strong resilience in crisis.",
        Sagittarius: "Sagittarius rising gives you an optimistic, adventurous, and knowledge-seeking personality. You value freedom and exploring broader perspectives—whether through travel, philosophy, or personal growth.",
        Capricorn: "Capricorn Lagna makes you disciplined, realistic, and focused on long-term achievement. You approach life with seriousness and responsibility, and your ability to persevere through difficulties is exceptional.",
        Aquarius: "With Aquarius rising, your personality blends originality, intelligence, and humanitarian concern. You think in unconventional ways and often detach emotionally to analyze situations objectively.",
        Pisces: "Pisces Lagna gives you a gentle, imaginative, and intuitive personality. You perceive the world through emotion and symbolism. Compassion and creativity flow naturally through you."
    };
    const rashiTraits_en = {
        Aries: "With Aries Moon, your emotional responses are quick, passionate, and honest. You dislike emotional stagnation and prefer direct communication of feelings.",
        Taurus: "A Taurus Moon gives you a calm, steady emotional nature. You seek peace, predictability, and long-term comfort. Sudden emotional changes unsettle you.",
        Gemini: "Moon in Gemini makes your emotions tied to intellect and communication. You express feelings through words, and your mind rarely rests. Curiosity shapes your emotional world.",
        Cancer: "With Moon in Cancer, you experience emotions deeply and intuitively. Family bonds, memory, and home strongly influence your emotional wellbeing.",
        Leo: "Leo Moon gives you a dramatic, warm, and expressive emotional nature. You feel happiest when appreciated or admired and seek emotional connection that validates your inner dignity.",
        Virgo: "Moon in Virgo makes your emotions analytical and practical. You seek order and clarity, and your care shows through helpful actions rather than overt displays.",
        Libra: "Moon in Libra gives you a need for balance and harmony in your emotional life. You dislike conflict and seek cooperative and mentally aligned relationships.",
        Scorpio: "Scorpio Moon creates powerful, intense, and transformative emotions. You experience loyalty deeply and form strong attachments. Emotional betrayal can trigger profound internal reactions.",
        Sagittarius: "Moon in Sagittarius brings optimism and a need for freedom. You dislike emotional confinement and thrive on honesty and open communication.",
        Capricorn: "Capricorn Moon gives emotional discipline and restraint. You express feelings carefully, preferring control and stability over spontaneity.",
        Aquarius: "Moon in Aquarius gives you a detached, intellectualized emotional style. You value logic over sentiment and prefer friendships and ideas that align with your principles.",
        Pisces: "Pisces Moon gives deep sensitivity, compassion, and psychic receptivity. You feel emotions profoundly and may merge too easily with others’ moods."
    };
    const nakshatraTraits_en = nakshatraTraitsLong_en;

    const lagnaTraits_hi = {
        Aries: "मेष लग्न होने के कारण, आपका विश्वदृष्टिकोण क्रिया और साहस से आकार लेता है। आप एक प्राकृतिक नेता हैं, जो हमेशा पहला कदम उठाने और दूसरों को प्रेरित करने के लिए तैयार रहते हैं। आपकी ऊर्जा संक्रामक है, हालांकि यह कभी-कभी जल्दबाजी का कारण बन सकती है। आप मुद्दों से सीधे और ईमानदारी से निपटना पसंद करते हैं, और आपके जीवन के पथ में अपनी शक्तिशाली प्रेरणा को धैर्य और दूसरों के प्रति विचार के साथ संतुलित करना सीखना शामिल है।",
        Taurus: "वृषभ लग्न के रूप में, आप जीवन के प्रति अपने दृष्टिकोण में जमीन से जुड़े और व्यवस्थित हैं। आप अपने चारों ओर आराम और सुंदरता की दुनिया बनाना चाहते हैं, और आपके पास संसाधनों के प्रबंधन के लिए एक प्राकृतिक प्रतिभा है। आपका दृढ़ संकल्प एक बड़ी संपत्ति है, लेकिन यह कभी-कभी जिद्दीपन के रूप में प्रकट हो सकता है।",
        Gemini: "मिथुन लग्न आपको एक लचीला, जिज्ञासु और बातूनी व्यक्तित्व प्रदान करता है। मानसिक उत्तेजना आपको प्रेरित करती है, और आप लगातार नए विचारों, कनेक्शन और दृष्टिकोणों की तलाश करते हैं। आप बदलती परिस्थितियों में जल्दी से ढल जाते हैं और ज्ञान साझा करने का आनंद लेते हैं।",
        Cancer: "कर्क लग्न आपको एक पोषण करने वाला, सहज और भावनात्मक रूप से जागरूक बाहरी व्यक्तित्व देता है। आप अपने पर्यावरण और दूसरों की जरूरतों के प्रति गहराई से संवेदनशील हैं, अक्सर एक प्राकृतिक रक्षक या देखभाल करने वाले के रूप में कार्य करते हैं। परिवार, जड़ें और व्यक्तिगत सुरक्षा आपके लिए बहुत मायने रखती है।",
        Leo: "सिंह लग्न एक करिश्माई, अभिव्यंजक और आत्मविश्वासी उपस्थिति लाता है। आप स्वाभाविक रूप से नेतृत्व की भूमिकाओं की ओर आकर्षित होते हैं और अपने प्रयासों के लिए मान्यता की सराहना करते हैं। आपका व्यक्तित्व गर्मजोशी, रचनात्मकता और मजबूत इच्छाशक्ति बिखेरता है।",
        Virgo: "कन्या लग्न के साथ, आप जीवन में सटीकता, तर्क और एक विश्लेषणात्मक मानसिकता के साथ आगे बढ़ते हैं। आप उन विवरणों को देखते हैं जिन्हें दूसरे अनदेखा कर देते हैं और आप जो कुछ भी करते हैं उसमें सुधार के लिए प्रयास करते हैं। व्यावहारिक और स्वास्थ्य के प्रति जागरूक, आप संरचना और व्यवस्था पसंद करते हैं।",
        Libra: "तुला लग्न आपको एक सुंदर, संतुलित और राजनयिक व्यक्तित्व देता है। आप स्वाभाविक रूप से रिश्तों और वातावरण में सद्भाव चाहते हैं, मध्यस्थता और निष्पक्षता में उत्कृष्टता प्राप्त करते हैं। आप संघर्ष को नापसंद करते हैं और किसी स्थिति के दोनों पक्षों को देखने में प्रतिभाशाली हैं।",
        Scorpio: "वृश्चिक लग्न एक शक्तिशाली, तीव्र और गहन अंतर्दृष्टिपूर्ण व्यक्तित्व बनाता है। आपकी उपस्थिति चुंबकीय है, और आपकी भावनात्मक गहराई बेजोड़ है। आप शायद ही कभी अपने सच्चे विचारों को आसानी से प्रकट करते हैं और संकट में मजबूत लचीलापन रखते हैं।",
        Sagittarius: "धनु लग्न आपको एक आशावादी, साहसी और ज्ञान-खोजी व्यक्तित्व देता है। आप स्वतंत्रता और व्यापक दृष्टिकोणों की खोज को महत्व देते हैं - चाहे वह यात्रा, दर्शन या व्यक्तिगत विकास के माध्यम से हो।",
        Capricorn: "मकर लग्न आपको अनुशासित, यथार्थवादी और दीर्घकालिक उपलब्धि पर केंद्रित बनाता है। आप जीवन को गंभीरता और जिम्मेदारी के साथ देखते हैं, और कठिनाइयों के माध्यम से दृढ़ रहने की आपकी क्षमता असाधारण है।",
        Aquarius: "कुंभ लग्न के साथ, आपका व्यक्तित्व मौलिकता, बुद्धि और मानवीय चिंता का मिश्रण है। आप अपरंपरागत तरीकों से सोचते हैं और अक्सर स्थितियों का निष्पक्ष रूप से विश्लेषण करने के लिए भावनात्मक रूप से अलग हो जाते हैं।",
        Pisces: "मीन लग्न आपको एक कोमल, कल्पनाशील और सहज व्यक्तित्व देता है। आप दुनिया को भावना और प्रतीकवाद के माध्यम से देखते हैं। करुणा और रचनात्मकता आपके माध्यम से स्वाभाविक रूप से बहती है।"
    };
    const rashiTraits_hi = {
        Aries: "मेष राशि में चंद्रमा के साथ, आपकी भावनात्मक प्रतिक्रियाएं तेज, भावुक और ईमानदार होती हैं। आप भावनात्मक ठहराव को नापसंद करते हैं और भावनाओं के सीधे संचार को पसंद करते हैं।",
        Taurus: "वृषभ चंद्रमा आपको एक शांत, स्थिर भावनात्मक प्रकृति देता है। आप शांति, पूर्वानुमेयता और दीर्घकालिक आराम चाहते हैं। अचानक भावनात्मक परिवर्तन आपको अस्थिर कर देते हैं।",
        Gemini: "मिथुन राशि में चंद्रमा आपकी भावनाओं को बुद्धि और संचार से जोड़ता है। आप शब्दों के माध्यम से भावनाओं को व्यक्त करते हैं, और आपका मन शायद ही कभी आराम करता है। जिज्ञासा आपकी भावनात्मक दुनिया को आकार देती है।",
        Cancer: "कर्क राशि में चंद्रमा के साथ, आप भावनाओं को गहराई से और सहज रूप से अनुभव करते हैं। पारिवारिक बंधन, स्मृति और घर आपके भावनात्मक कल्याण को दृढ़ता से प्रभावित करते हैं।",
        Leo: "सिंह चंद्रमा आपको एक नाटकीय, गर्म और अभिव्यंजक भावनात्मक प्रकृति देता है। जब आपकी सराहना या प्रशंसा की जाती है तो आप सबसे खुश महसूस करते हैं और भावनात्मक संबंध चाहते हैं जो आपके आंतरिक सम्मान को मान्य करता है।",
        Virgo: "कन्या राशि में चंद्रमा आपकी भावनाओं को विश्लेषणात्मक और व्यावहारिक बनाता है। आप व्यवस्था और स्पष्टता चाहते हैं, और आपकी देखभाल प्रत्यक्ष प्रदर्शन के बजाय सहायक कार्यों के माध्यम से दिखती है।",
        Libra: "तुला राशि में चंद्रमा आपके भावनात्मक जीवन में संतुलन और सद्भाव की आवश्यकता देता है। आप संघर्ष को नापसंद करते हैं और सहकारी और मानसिक रूप से संरेखित संबंधों की तलाश करते हैं।",
        Scorpio: "वृश्चिक चंद्रमा शक्तिशाली, तीव्र और परिवर्तनकारी भावनाएं पैदा करता है। आप वफादारी का गहराई से अनुभव करते हैं और मजबूत लगाव बनाते हैं। भावनात्मक विश्वासघात गहन आंतरिक प्रतिक्रियाओं को ट्रिगर कर सकता है।",
        Sagittarius: "धनु राशि में चंद्रमा आशावाद और स्वतंत्रता की आवश्यकता लाता है। आप भावनात्मक कैद को नापसंद करते हैं और ईमानदारी और खुले संचार पर पनपते हैं।",
        Capricorn: "मकर चंद्रमा भावनात्मक अनुशासन और संयम देता है। आप भावनाओं को सावधानी से व्यक्त करते हैं, सहजता पर नियंत्रण और स्थिरता को प्राथमिकता देते हैं।",
        Aquarius: "कुंभ राशि में चंद्रमा आपको एक अलग, बौद्धिक भावनात्मक शैली देता है। आप भावना पर तर्क को महत्व देते हैं और दोस्ती और विचारों को पसंद करते हैं जो आपके सिद्धांतों के अनुरूप हों।",
        Pisces: "मीन चंद्रमा गहरी संवेदनशीलता, करुणा और मानसिक ग्रहणशीलता देता है। आप भावनाओं को गहराई से महसूस करते हैं और दूसरों के मूड के साथ बहुत आसानी से घुलमिल सकते हैं।"
    };
    const nakshatraTraits_hi = nakshatraTraitsLong_hi;

    const p_en = {
        yourChartCombines: "Your chart combines the qualities of your", lagna: "Lagna", rashi: "Rashi", and: "and", nakshatra: "Nakshatra", creatingProfile: ", creating a deeply layered personality profile.",
        asALagnaAscendant: "As a", outerBehavior: "ascendant, your outer behavior, approach to life, and first instincts are shaped by the following tendencies:",
        emotionallyAndMentally: "Emotionally and mentally, your Moon sign in", influencesHowYou: "influences how you process experiences, form bonds, and respond to your inner world. This gives you the following emotional nature:",
        atADeeperKarmic: "At a deeper karmic and spiritual level, your birth in the", infusesYourInstincts: "Nakshatra infuses your instincts, subconscious drives, and soul journey with the following qualities:",
        whenTheseThree: "When these three forces blend, they create a unique harmony between your external personality, your internal emotional life, and your spiritual foundation. This combination reveals how you behave in the world, how you feel within, and what your soul seeks across your life path. This integrated pattern shapes your natural strengths, challenges, relationships, decisions, and long-term destiny."
    };

    const p_hi = {
        yourChartCombines: "आपकी कुंडली आपके", lagna: "लग्न", rashi: "राशि", and: "और", nakshatra: "नक्षत्र", creatingProfile: "के गुणों को मिलाकर एक गहरी स्तरित व्यक्तित्व प्रोफाइल बनाती है।",
        asALagnaAscendant: "एक", outerBehavior: "लग्न के रूप में, आपका बाहरी व्यवहार, जीवन के प्रति दृष्टिकोण, और पहली प्रवृत्ति निम्नलिखित प्रवृत्तियों से आकार लेती है:",
        emotionallyAndMentally: "भावनात्मक और मानसिक रूप से, आपकी", influencesHowYou: " में चंद्र राशि आपके अनुभवों को संसाधित करने, बंधन बनाने और आपकी आंतरिक दुनिया पर प्रतिक्रिया करने के तरीके को प्रभावित करती है। यह आपको निम्नलिखित भावनात्मक प्रकृति देता है:",
        atADeeperKarmic: "एक गहरे कर्म और आध्यात्मिक स्तर पर, आपका जन्म", infusesYourInstincts: " नक्षत्र में आपकी प्रवृत्ति, अवचेतन प्रेरणाओं और आत्मा की यात्रा को निम्नलिखित गुणों से भर देता है:",
        whenTheseThree: "जब ये तीन ताकतें मिलती हैं, तो वे आपके बाहरी व्यक्तित्व, आपके आंतरिक भावनात्मक जीवन और आपकी आध्यात्मिक नींव के बीच एक अनूठा सामंजस्य बनाती हैं। यह संयोजन बताता है कि आप दुनिया में कैसा व्यवहार करते हैं, आप भीतर कैसा महसूस करते हैं, और आपकी आत्मा आपके जीवन पथ पर क्या चाहती है। यह एकीकृत पैटर्न आपकी प्राकृतिक शक्तियों, चुनौतियों, रिश्तों, निर्णयों और दीर्घकालिक भाग्य को आकार देता है।"
    };

    const p = lang === 'hi' ? p_hi : p_en;
    const lagnaTraits = lang === 'hi' ? lagnaTraits_hi : lagnaTraits_en;
    const rashiTraits = lang === 'hi' ? rashiTraits_hi : rashiTraits_en;
    const nakshatraTraits = lang === 'hi' ? nakshatraTraits_hi : nakshatraTraits_en;

    let lagnaText = lagnaTraits[lagna] || "";
    let rashiText = rashiTraits[rashi] || "";
    let nakshatraText = nakshatraTraits[nakshatra] || ""; // Changed to let to allow modification

    const cuspDegrees = houses ? houses.map(h => convertDMSToDegrees(h.start_dms)) : [];

    // --- Synthesize Lagna Lord into Lagna Paragraph ---
    if (lagnaLord && lagnaLordNatalHouse && cuspDegrees.length > 0) {
        const houseTheme = (lang === 'hi' ? houseThemes_hi : houseThemes_en)[lagnaLordNatalHouse];
        if (lang === 'hi') {
            lagnaText += ` यह मुख्य पहचान ${lagnaLordNatalHouse}वें घर में अपनी प्राथमिक अभिव्यक्ति पाती है, जो आपके जीवन के पथ को ${houseTheme} के विषयों की ओर ले जाती है।`;
        } else {
            lagnaText += ` This core identity finds its primary expression in the ${getOrdinal(lagnaLordNatalHouse)} house, channeling your life's path toward matters of ${houseTheme}.`;
        }
    }

    // --- Synthesize Moon's House Placement and Nakshatra Pada into Rashi Paragraph ---
    const moonData = planetaryPositions?.Moon;
    if (moonData && typeof moonData.longitude === 'number' && cuspDegrees.length > 0) {
        const moonHouse = getHouseOfPlanet(moonData.longitude, cuspDegrees);
        const { nakshatraNumber, pada } = getNakshatraPada(moonData.longitude);
        if (moonHouse) {
            const houseTheme = (lang === 'hi' ? houseThemes_hi : houseThemes_en)[moonHouse];
            const currentNakshatraPadaMeanings = lang === 'hi' ? NAKSHATRA_PADA_MEANINGS_HI : NAKSHATRA_PADA_MEANINGS_EN;
            const nakshatraPadaMeaning = currentNakshatraPadaMeanings[nakshatra]?.[pada - 1] || ""; // pada is 1-indexed

            if (lang === 'hi') {
                rashiText += ` यह भावनात्मक प्रकृति सबसे अधिक ${moonHouse}वें घर पर केंद्रित है, जो बताता है कि आप ${houseTheme} से संबंधित मामलों में भावनात्मक पूर्ति और सुरक्षा चाहते हैं। आपका चंद्रमा ${nakshatra} नक्षत्र के ${pada}वें पद में है, जिसका अर्थ है: ${nakshatraPadaMeaning}। यह आपके भावनात्मक प्रतिक्रियाओं में एक और परत जोड़ता है।`;
            } else {
                rashiText += ` This emotional nature is most actively focused on the ${getOrdinal(moonHouse)} house, suggesting you seek emotional fulfillment and security in matters related to ${houseTheme}. Your Moon is in the ${pada}th pada of ${nakshatra} nakshatra, meaning: ${nakshatraPadaMeaning}. This adds another layer to your emotional responses.`;
            }
        }
    }

    // --- Add Nakshatra Pada meaning to Nakshatra section ---
    const currentNakshatraPadaMeanings = lang === 'hi' ? NAKSHATRA_PADA_MEANINGS_HI : NAKSHATRA_PADA_MEANINGS_EN;
    const moonNakshatraData = planetaryPositions.Moon; // Assuming nakshatra is always Moon's nakshatra
    if (moonNakshatraData && typeof moonNakshatraData.longitude === 'number') {
        const { pada } = getNakshatraPada(moonNakshatraData.longitude);
        const nakshatraPadaMeaning = currentNakshatraPadaMeanings[nakshatra]?.[pada - 1] || "";
        if (nakshatraPadaMeaning) {
            if (lang === 'hi') {
                nakshatraText += ` आपका जन्म ${nakshatra} नक्षत्र के ${pada}वें पद में हुआ है, जिसका अर्थ है: ${nakshatraPadaMeaning}`;
            } else {
                nakshatraText += ` Your birth in the ${pada}th pada of ${nakshatra} nakshatra means: ${nakshatraPadaMeaning}`;
            }
        }
    }


    // --- Assemble the final report ---
    const displayedNakshatra = lang === 'hi' ? (nakshatraNames_hi[nakshatra] || nakshatra) : nakshatra; // Defensive fallback
    let result = `
${p.yourChartCombines} ${lang === 'hi' ? rashiNames_hi[lagna] : lagna} ${p.lagna}, ${lang === 'hi' ? rashiNames_hi[rashi] : rashi} ${p.rashi}, ${p.and} ${displayedNakshatra} ${p.nakshatra}${p.creatingProfile} 
${p.asALagnaAscendant} ${lang === 'hi' ? rashiNames_hi[lagna] : lagna} ${p.outerBehavior} ${lagnaText}
${lang === 'hi' ? `यह आपके चंद्र राशि के भावनात्मक प्रतिक्रियाओं के साथ कैसे जुड़ता है, यह आपके आंतरिक अनुभव को गहराई से प्रभावित करता है।` : `This further connects with the emotional responses of your Moon sign, deeply influencing your inner experience.`}

${p.emotionallyAndMentally} ${lang === 'hi' ? rashiNames_hi[rashi] : rashi} ${p.influencesHowYou} ${rashiText}
${lang === 'hi' ? `यह भावनात्मक नींव आपके जन्म नक्षत्र के अंतर्निहित आध्यात्मिक और कर्मिक ड्राइव के साथ प्रतिध्वनित होती है।` : `This emotional foundation resonates with the underlying spiritual and karmic drive of your birth Nakshatra.`}

${p.atADeeperKarmic} ${displayedNakshatra} ${p.infusesYourInstincts} ${nakshatraText}

${p.whenTheseThree}`;
return result.trim();
}

// Helper function to interpret Mudda Dasha periods
function getMuddaDashaInterpretation(dashaLord, dashaLordHouse, lang = 'en', muddaThemes, houseThemes) {
    const muddaThemesLang = muddaThemes[lang] || muddaThemes['en'];
    const houseThemesLang = houseThemes[lang] || houseThemes['en'];

    const generalTheme = muddaThemesLang[dashaLord] || '';
    const houseTheme = houseThemesLang[dashaLordHouse] || '';
    const translatedDashaLord = getPlanetName(dashaLord, lang);
    const ordinalHouse = getOrdinal(dashaLordHouse);

    const P_MUDDA = {
        en: {
            period: `**${translatedDashaLord} Period:**`,
            intro: `This phase activates themes of **${generalTheme}**.`,
            focus: `Your focus will be drawn to matters of your **${ordinalHouse} house (${houseTheme})**.`,
            positive_sun: "This is an excellent time for taking on leadership roles, launching new projects, and seeking recognition for your work. Your vitality will be high.",
            positive_moon: "A period for emotional connection, nurturing relationships, and finding comfort in your home life. Your intuition will be a strong guide.",
            positive_mars: "Expect a surge of energy and drive. This is the time to take action, tackle difficult tasks, and assert yourself with courage.",
            positive_mercury: "Communication, learning, and commerce are highlighted. An excellent time for negotiations, writing, and intellectual pursuits.",
            positive_jupiter: "Opportunities for growth, learning, and expansion will appear. This is a fortunate period for education, travel, and seeking wisdom.",
            positive_venus: "A time for love, creativity, and social enjoyment. Relationships will flourish, and you will find pleasure in artistic and beautiful things.",
            positive_saturn: "Focus on long-term goals, discipline, and responsibility. Hard work during this period will build a solid foundation for the future.",
            positive_rahu: "Expect sudden opportunities and a drive for unconventional success. A great time for innovation, technology, and pursuing worldly ambitions.",
            positive_ketu: "A period for introspection, spiritual growth, and letting go of the past. Your intuition will be sharp, leading to profound insights.",
        },
        hi: {
            period: `**${translatedDashaLord} की अवधि:**`,
            intro: `यह चरण **${generalTheme}** के विषयों को सक्रिय करेगा।`,
            focus: `आपका ध्यान आपके **${ordinalHouse} घर (${houseTheme})** के मामलों की ओर खींचा जाएगा।`,
            positive_sun: "नेतृत्व की भूमिका निभाने, नई परियोजनाओं को शुरू करने और अपने काम के लिए मान्यता प्राप्त करने का यह एक उत्कृष्ट समय है। आपकी जीवन शक्ति उच्च होगी।",
            positive_moon: "भावनात्मक संबंध, रिश्तों को पोषित करने और अपने घरेलू जीवन में आराम पाने की अवधि। आपकी अंतर्ज्ञान एक मजबूत मार्गदर्शक होगी।",
            positive_mars: "ऊर्जा और प्रेरणा की वृद्धि की अपेक्षा करें। यह कार्रवाई करने, कठिन कार्यों से निपटने और साहस के साथ खुद को मुखर करने का समय है।",
            positive_mercury: "संचार, सीखना और वाणिज्य पर प्रकाश डाला गया है। बातचीत, लेखन और बौद्धिक गतिविधियों के लिए एक उत्कृष्ट समय।",
            positive_jupiter: "विकास, सीखने और विस्तार के अवसर दिखाई देंगे। यह शिक्षा, यात्रा और ज्ञान प्राप्त करने के लिए एक भाग्यशाली अवधि है।",
            positive_venus: "प्रेम, रचनात्मकता और सामाजिक आनंद का समय। रिश्ते फलेंगे-फूलेंगे, और आपको कलात्मक और सुंदर चीजों में आनंद मिलेगा।",
            positive_saturn: "दीर्घकालिक लक्ष्यों, अनुशासन और जिम्मेदारी पर ध्यान दें। इस अवधि के दौरान की गई कड़ी मेहनत भविष्य के लिए एक ठोस आधार बनाएगी।",
            positive_rahu: "अचानक अवसरों और अपरंपरागत सफलता के लिए एक प्रेरणा की अपेक्षा करें। नवाचार, प्रौद्योगिकी और सांसारिक महत्वाकांक्षाओं को आगे बढ़ाने का एक बढ़िया समय।",
            positive_ketu: "आत्मनिरीक्षण, आध्यात्मिक विकास और अतीत को जाने देने की अवधि। आपकी अंतर्ज्ञान तेज होगी, जिससे गहन अंतर्दृष्टि प्राप्त होगी।",
        }
    }
    const phrases = P_MUDDA[lang] || P_MUDDA['en'];
    let interpretation = `${phrases.period} ${phrases.intro} ${phrases.focus} `;
    
    switch(dashaLord) {
        case 'Sun': interpretation += phrases.positive_sun; break;
        case 'Moon': interpretation += phrases.positive_moon; break;
        case 'Mars': interpretation += phrases.positive_mars; break;
        case 'Mercury': interpretation += phrases.positive_mercury; break;
        case 'Jupiter': interpretation += phrases.positive_jupiter; break;
        case 'Venus': interpretation += phrases.positive_venus; break;
        case 'Saturn': interpretation += phrases.positive_saturn; break;
        case 'Rahu': interpretation += phrases.positive_rahu; break;
        case 'Ketu': interpretation += phrases.positive_ketu; break;
    }

    return interpretation;
}

export function getVarshphalPrediction(payload = {}, lang = 'en') {

    const { varshphalChart = {}, muntha = null, yearLord = null, muddaDasha = [], varshphalYear = null } = payload;
    const { ascendant, planetHousePlacements, planetDetails } = varshphalChart || {};
    const upbsScores = planetDetails?.upbsScores || {};

    const planetThemes = {
        en: {
            Sun: "Authority, Vitality, and Leadership",
            Moon: "Emotional Sensitivity, Intuition, and Adaptability",
            Mars: "Energy, Drive, and Courage",
            Mercury: "Intellect, Communication, and Logical Analysis",
            Jupiter: "Wisdom, Expansion, and Optimism",
            Venus: "Love, Beauty, and Harmony",
            Saturn: "Discipline, Structure, and Perseverance",
            Rahu: "Ambition, Innovation, and Worldly Desire",
            Ketu: "Detachment, Spirituality, and Deep Insight"
        },
        hi: {
            Sun: "अधिकार, जीवन शक्ति और नेतृत्व",
            Moon: "भावनात्मक संवेदनशीलता, अंतर्ज्ञान और अनुकूलनशीलता",
            Mars: "ऊर्जा, प्रेरणा और साहस",
            Mercury: "बुद्धि, संचार और तार्किक विश्लेषण",
            Jupiter: "ज्ञान, विस्तार और आशावाद",
            Venus: "प्रेम, सौंदर्य और सद्भाव",
            Saturn: "अनुशासन, संरचना और दृढ़ता",
            Rahu: "महत्वाकांक्षा, नवाचार और सांसारिक इच्छा",
            Ketu: "वैराग्य, आध्यात्मिकता और गहरी अंतर्दृष्टि"
        }
    };

    const P_VARS = {
        en: {
            predictionForYear: `### Detailed Prediction for Your Varshphal Year: ${varshphalYear}\n\n`,
            intro: `This annual chart, or Varshphal, provides a detailed forecast for your year ahead, highlighting the specific opportunities and challenges you will encounter. Your experience will be shaped by three key astrological markers: the **Year Lord (Varshphal Lord)**, the **Muntha**, and the **Annual Ascendant**. Understanding their interplay is the key to navigating the year successfully.`,
            yearLord: (lord, house, theme) => `\n\n**1. The Year's Main Theme: The Year Lord**\nThe overarching theme for your year is set by the Year Lord, **${lord}**. As the "captain" of the year, its position and nature dictate the primary energy and focus. Placed in house **${house}**, it directs the year's energy towards matters of **${theme}**.`,
            yearLordBenefic: (lord) => ` Since ${lord} is a natural benefic, this theme will likely manifest through **opportunities for growth, learning, and positive new beginnings**. You will find that progress in these areas comes more naturally.`,
            yearLordMalefic: (lord) => ` Since ${lord} is a natural malefic, this theme will involve **discipline, overcoming obstacles, and achieving results through perseverance**. Progress in this area will require your dedicated effort and patience.`,
            muntha: (sign, house, theme) => `\n\n**2. Your Personal Focus: The Muntha**\nThe Muntha represents your personal focus and the primary area of self-development for the year. This year, it falls in the sign of **${sign}** within your **${house}**th house. This placement pulls your personal attention and efforts towards **${theme}**. This is where you are meant to concentrate your energy for personal growth.`,
            ascendant: (sign, lord, theme) => `\n\n**3. Your Outlook and Approach: The Annual Ascendant**\nFinally, the annual ascendant, which is **${sign}** (ruled by **${lord}**), colors your personal outlook and how you project yourself to the world. It emphasizes themes of **${theme}** in your approach to all of life's events throughout the year.`,
            synthesis: `\n\n**Synthesizing the Themes:**\nThe interplay between these three factors is crucial. The most successful path this year lies in aligning the year's broader theme of **{yearLordTheme}** with your personal area of development, **{munthaTheme}**, all while expressing yourself through the lens of **{ascendantTheme}**. In essence, you are being asked to use your personal focus to achieve the year's main goal.`,
            strengthHeader: `\n\n#### Key Planetary Influences\n`,
            strongestPlanet: (planet, score, yearLordName, planetTheme) => `While **${yearLordName}** sets the overarching tone, the planet with the most power to influence events this year is **${planet}** (with a high UPBS score of ${score.toFixed(2)}). Its core themes of **${planetTheme}** will be a dominant force, demanding your attention. Areas of life influenced by this planet will be amplified, for better or worse, and will reward your focus.`,
            muddaDashaHeader: `\n\n#### Timeline of the Year: The Mudda Dasha Periods\nYour year is divided into smaller planetary periods called Mudda Dashas. Each period brings a different theme to the forefront, creating a dynamic timeline of focus areas. Here is what to expect:\n`,
            dashaPeriod: (interpretation, start, end) => `*   ${interpretation} (from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}).\n`,
            conclusionHeader: `\n\n#### Final Summary & Strategic Advice\n`,
        },
        hi: {
            predictionForYear: `### आपके वर्षफल वर्ष के लिए विस्तृत भविष्यवाणी: ${varshphalYear}\n\n`,
            intro: `यह वार्षिक चार्ट, या वर्षफल, आपके आने वाले वर्ष के लिए एक विस्तृत पूर्वानुमान प्रदान करता है, जो आपके सामने आने वाले विशिष्ट अवसरों और चुनौतियों पर प्रकाश डालता है। आपका अनुभव तीन प्रमुख ज्योतिषीय मार्करों द्वारा आकार दिया जाएगा: **वर्ष के स्वामी (वर्षेश्वर)**, **मुंथा**, और **वार्षिक लग्न**। उनकी परस्पर क्रिया को समझना वर्ष को सफलतापूर्वक नेविगेट करने की कुंजी है।`,
            yearLord: (lord, house, theme) => `\n\n**१. वर्ष का मुख्य विषय: वर्ष के स्वामी**\nआपके वर्ष का मुख्य विषय वर्ष के स्वामी, **${lord}**, द्वारा निर्धारित किया गया है। वर्ष के "कप्तान" के रूप में, इसकी स्थिति और प्रकृति प्राथमिक ऊर्जा और ध्यान को निर्देशित करती है। **${house}**वें घर में स्थित होने के कारण, यह वर्ष की ऊर्जा को **${theme}** के मामलों की ओर निर्देशित करता है।`,
            yearLordBenefic: (lord) => ` चूंकि ${lord} एक नैसर्गिक शुभ ग्रह है, इसलिए यह विषय संभवतः **विकास, सीखने और सकारात्मक नई शुरुआत के अवसरों** के माध्यम से प्रकट होगा। आप पाएंगे कि इन क्षेत्रों में प्रगति अधिक स्वाभाविक रूप से होती है।`,
            yearLordMalefic: (lord) => ` चूंकि ${lord} एक नैसर्गिक पापी ग्रह है, इसलिए इस विषय में **अनुशासन, बाधाओं पर काबू पाना और दृढ़ता के माध्यम से परिणाम प्राप्त करना** शामिल होगा। इस क्षेत्र में प्रगति के लिए आपके समर्पित प्रयास और धैर्य की आवश्यकता होगी।`,
            muntha: (sign, house, theme) => `\n\n**२. आपका व्यक्तिगत ध्यान: मुंथा**\nमुंथा आपके व्यक्तिगत ध्यान और वर्ष के लिए आत्म-विकास के प्राथमिक क्षेत्र का प्रतिनिधित्व करता है। इस वर्ष, यह आपके **${house}**वें घर के भीतर **${sign}** राशि में पड़ता है। यह स्थान आपके व्यक्तिगत ध्यान और प्रयासों को **${theme}** की ओर खींचता है। यह वह जगह है जहाँ आपको व्यक्तिगत विकास के लिए अपनी ऊर्जा केंद्रित करनी है।`,
            ascendant: (sign, lord, theme) => `\n\n**३. आपका दृष्टिकोण और तरीका: वार्षिक लग्न**\nअंत में, वार्षिक लग्न, जो **${sign}** है (जिसका स्वामी **${lord}** है), आपके व्यक्तिगत दृष्टिकोण और आप खुद को दुनिया के सामने कैसे प्रस्तुत करते हैं, को रंग देता है। यह पूरे वर्ष जीवन की सभी घटनाओं के प्रति आपके दृष्टिकोण में **${theme}** के विषयों पर जोर देता है।`,
            synthesis: `\n\n**विषयों का संश्लेषण:**\nइन तीन कारकों के बीच की परस्पर क्रिया महत्वपूर्ण है। इस वर्ष सबसे सफल मार्ग वर्ष के व्यापक विषय **{yearLordTheme}** को आपके व्यक्तिगत विकास के क्षेत्र, **{munthaTheme}** के साथ संरेखित करने में निहित है, यह सब **{ascendantTheme}** के लेंस के माध्यम से खुद को व्यक्त करते हुए। संक्षेप में, आपको वर्ष के मुख्य लक्ष्य को प्राप्त करने के लिए अपने व्यक्तिगत ध्यान का उपयोग करने के लिए कहा जा रहा है।`,
            strengthHeader: `\n\n#### प्रमुख ग्रहों के प्रभाव\n`,
            strongestPlanet: (planet, score, yearLordName, planetTheme) => `जबकि **${yearLordName}** व्यापक स्वर सेट करता है, इस वर्ष की घटनाओं को प्रभावित करने की सबसे अधिक शक्ति वाला ग्रह **${planet}** है (उच्च UPBS स्कोर ${score.toFixed(2)} के साथ)। इसके मूल विषय **${planetTheme}** एक प्रमुख शक्ति होंगे, जो आपके ध्यान की मांग करेंगे। इस ग्रह से प्रभावित जीवन के क्षेत्र, अच्छे या बुरे के लिए, बढ़ जाएंगे और आपके ध्यान को पुरस्कृत करेंगे।`,
            muddaDashaHeader: `\n\n#### वर्ष की समयरेखा: मुद्दा दशा अवधि\nआपका वर्ष मुद्दा दशा नामक छोटी ग्रहों की अवधियों में विभाजित है। प्रत्येक अवधि एक अलग विषय को सबसे आगे लाती है, जिससे फोकस क्षेत्रों की एक गतिशील समयरेखा बनती है। यहाँ क्या उम्मीद की जाए:\n`,
            dashaPeriod: (interpretation, start, end) => `*   ${interpretation} (${start.toLocaleDateString()} से ${end.toLocaleDateString()} तक).\n`,
            conclusionHeader: `\n\n#### अंतिम सारांश और रणनीतिक सलाह\n`,
        }
    };
    
    const phrases = P_VARS[lang] || P_VARS['en'];
    const themes = lang === 'hi' ? houseThemes_hi : houseThemes_en;

    const muddaThemes = {
        en: { Sun: "Authority, Leadership, and Self-expression", Moon: "Emotions, Home, and Public Connection", Mars: "Energy, Action, and Conflict Resolution", Mercury: "Communication, Intellect, and Commerce", Jupiter: "Wisdom, Expansion, and Opportunities", Venus: "Relationships, Creativity, and Pleasure", Saturn: "Discipline, Responsibility, and Long-term Goals", Rahu: "Ambition, Unconventional Thinking, and Worldly Desires", Ketu: "Introspection, Letting Go, and Spiritual Insights" },
        hi: { Sun: "अधिकार, नेतृत्व और आत्म-अभिव्यक्ति", Moon: "भावनाओं, घर और सार्वजनिक संबंध", Mars: "ऊर्जा, कार्रवाई और संघर्ष समाधान", Mercury: "संचार, बुद्धि और वाणिज्य", Jupiter: "ज्ञान, विस्तार और अवसर", Venus: "रिश्ते, रचनात्मकता और आनंद", Saturn: "अनुशासन, जिम्मेदारी और दीर्घकालिक लक्ष्य", Rahu: "महत्वाकांक्षा, अपरंपरागत सोच और सांसारिक इच्छाएं", Ketu: "आत्मनिरीक्षण, जाने देना और आध्यात्मिक अंतर्दृष्टि" }
    };
    
    const muddaThemesLang = muddaThemes[lang] || muddaThemes['en'];

    if (!ascendant || !muntha || !yearLord || !planetHousePlacements) {
        return lang === 'hi' ? 'वर्षफल भविष्यवाणी के लिए अपर्याप्त डेटा।' : 'Insufficient data for Varshphal prediction.';
    }

    let parts = [phrases.predictionForYear, phrases.intro];

    // 1. Year Lord
    const yearLordHouse = planetHousePlacements[yearLord];
    const yearLordTheme = themes[yearLordHouse] || '';
    const translatedYearLord = getPlanetName(yearLord, lang);
    parts.push(phrases.yearLord(translatedYearLord, yearLordHouse, yearLordTheme));
    const isYearLordBenefic = ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(yearLord);
    parts.push(isYearLordBenefic ? phrases.yearLordBenefic(translatedYearLord) : phrases.yearLordMalefic(translatedYearLord));

    // 2. Muntha
    const munthaTheme = themes[muntha.house] || '';
    const translatedMunthaSign = lang === 'hi' ? rashiNames_hi[muntha.sign] : muntha.sign;
    parts.push(phrases.muntha(translatedMunthaSign, muntha.house, munthaTheme));

    // 3. Ascendant
    const ascendantTheme = themes[1] || '';
    const translatedAscRashi = lang === 'hi' ? rashiNames_hi[ascendant.rashi] : ascendant.rashi;
    const translatedAscLord = getPlanetName(ascendant.rashiLord, lang);
    parts.push(phrases.ascendant(translatedAscRashi, translatedAscLord, ascendantTheme));

    // 4. Synthesis
    parts.push(phrases.synthesis.replace('{munthaTheme}', `**${munthaTheme}**`).replace('{yearLordTheme}', `**${yearLordTheme}**`).replace('{ascendantTheme}', `**${ascendantTheme}**`));

    // 5. Strongest Planet
    let strongestPlanet = '';
    let strongestPlanetScore = -Infinity;
    if (upbsScores && Object.keys(upbsScores).length > 0) {
        for (const [planet, data] of Object.entries(upbsScores)) {
            if (data.total > strongestPlanetScore) {
                strongestPlanetScore = data.total;
                strongestPlanet = planet;
            }
        }
    }
    if (strongestPlanet) {
        parts.push(phrases.strengthHeader);
        const translatedStrongestPlanet = getPlanetName(strongestPlanet, lang);
        const pTheme = (lang === 'hi' ? planetThemes.hi[strongestPlanet] : planetThemes.en[strongestPlanet]) || '';
        parts.push(phrases.strongestPlanet(translatedStrongestPlanet, strongestPlanetScore, translatedYearLord, pTheme));
    }
    
    // 6. Mudda Dasha
    if (muddaDasha && muddaDasha.length > 0) {
        parts.push(phrases.muddaDashaHeader);
        muddaDasha.forEach(dasha => {
            const dashaLordHouse = planetHousePlacements[dasha.lord]; // Get house placement for the dasha lord
            const interpretation = getMuddaDashaInterpretation(dasha.lord, dashaLordHouse, lang, muddaThemes, { en: houseThemes_en, hi: houseThemes_hi });
            parts.push(phrases.dashaPeriod(interpretation, new Date(dasha.start), new Date(dasha.end)));
        });
    }

        // 7. Conclusion
        const summary = generateVarshphalSummary(yearLordTheme, munthaTheme, ascendantTheme, strongestPlanet, lang);
        parts.push(summary);
    
        return parts.join(' ');
    }
    function generateVarshphalSummary(yearLordTheme, munthaTheme, ascendantTheme, strongestPlanet, lang) {
        const P_VARS = {
            en: {
                header: `\n\n#### Summary & Advice\n`,
                intro: `This year is a complex tapestry woven from the themes of **{yearLordTheme}** (overall focus), **{munthaTheme}** (personal development), and **{ascendantTheme}** (your outlook).`,
                synthesis: `To make the most of this year, you should aim to apply your personal focus on {munthaTheme} to serve the year's broader theme of {yearLordTheme}.`,
                keyPlanet: `The key to unlocking this synergy lies in leveraging the energy of **${getPlanetName(strongestPlanet, lang)}**.`,
                suggestionsHeader: `\nHere are some practical ways to harmonize these themes:\n`,
                suggestion: (text) => `*   ${text}\n`,
                defaultConclusion: "By consciously integrating these themes, you can navigate the year's challenges and make the most of its opportunities."
            },
            hi: {
                header: `\n\n#### सारांश और सलाह\n`,
                intro: `यह वर्ष **{yearLordTheme}** (समग्र फोकस), **{munthaTheme}** (व्यक्तिगत विकास), और **{ascendantTheme}** (आपका दृष्टिकोण) के विषयों से बुना हुआ एक जटिल ताना-बाना है।`,
                synthesis: `इस वर्ष का अधिकतम लाभ उठाने के लिए, आपको {yearLordTheme} के व्यापक विषय की सेवा के लिए {munthaTheme} पर अपना व्यक्तिगत ध्यान केंद्रित करना चाहिए।`,
                keyPlanet: `इस तालमेल को अनलॉक करने की कुंजी **${getPlanetName(strongestPlanet, lang)}** की ऊर्जा का लाभ उठाने में निहित है।`,
                suggestionsHeader: `\nइन विषयों में सामंजस्य स्थापित करने के कुछ व्यावहारिक तरीके यहां दिए गए हैं:\n`,
                suggestion: (text) => `*   ${text}\n`,
                defaultConclusion: "इन विषयों को सचेत रूप से एकीकृत करके, आप वर्ष की चुनौतियों से निपट सकते हैं और इसके अवसरों का अधिकतम लाभ उठा सकते हैं।"
            }
        };
    
        const phrases = P_VARS[lang] || P_VARS['en'];
        let summary = phrases.header;
        summary += phrases.intro.replace('{yearLordTheme}', yearLordTheme).replace('{munthaTheme}', munthaTheme).replace('{ascendantTheme}', ascendantTheme);
        summary += ` ${phrases.synthesis.replace('{munthaTheme}', `**${munthaTheme}**`).replace('{yearLordTheme}', `**${yearLordTheme}**`)}`;
        summary += ` ${phrases.keyPlanet}`;
        summary += phrases.suggestionsHeader;
    
        // Add specific suggestions based on the prominent themes
        const suggestions = [];
        const yearLordThemeKeywords = yearLordTheme.split(', ').map(s => s.trim());
        const munthaThemeKeywords = munthaTheme.split(', ').map(s => s.trim());
        const ascendantThemeKeywords = ascendantTheme.split(', ').map(s => s.trim());

        // Suggestion 1: Integrate spiritual practices into pursuit of knowledge/travel
        if ((yearLordThemeKeywords.includes('higher learning') || yearLordThemeKeywords.includes('travel') || yearLordThemeKeywords.includes('faith')) &&
            (munthaThemeKeywords.includes('secrets') || munthaThemeKeywords.includes('expenses') || munthaThemeKeywords.includes('spirituality'))) {
            suggestions.push(lang === 'hi' ? 'अध्ययन या पवित्र स्थलों के दौरे के माध्यम से ज्ञान या यात्रा की अपनी खोज में आध्यात्मिक प्रथाओं (रहस्यों, खर्चों, आध्यात्मिकता) को एकीकृत करें।' : 'Integrate spiritual practices (secrets, expenses, spirituality) into your pursuit of knowledge or travel (higher learning, travel, faith), perhaps through studying ancient texts or visiting sacred sites.');
        }

        // Suggestion 2: Use self-awareness to guide exploration of philosophies
        if ((yearLordThemeKeywords.includes('higher learning') || yearLordThemeKeywords.includes('travel') || yearLordThemeKeywords.includes('faith')) &&
            (ascendantThemeKeywords.includes('self') || ascendantThemeKeywords.includes('identity') || ascendantThemeKeywords.includes('health'))) {
             suggestions.push(lang === 'hi' ? 'नई दर्शनशास्त्रों या विश्वास प्रणालियों (उच्च शिक्षा, यात्रा, विश्वास) की अपनी खोज को मार्गदर्शन करने के लिए अपनी व्यक्तिगत अंतर्दृष्टि और आत्म-जागरूकता (स्वयं, पहचान, स्वास्थ्य) का उपयोग करें।' : 'Using your personal insights and self-awareness (self, identity, health) to guide your exploration of new philosophies or belief systems (higher learning, travel, faith).');
        }

        // Suggestion 3: Creativity + Spirituality (5 + 12)
        if ((yearLordThemeKeywords.includes('creativity') || yearLordThemeKeywords.includes('children')) &&
            (munthaThemeKeywords.includes('spirituality') || munthaThemeKeywords.includes('secrets'))) {
             suggestions.push(lang === 'hi' ? 'अपनी रचनात्मक प्रतिभा का उपयोग आध्यात्मिक अभिव्यक्ति या उपचार के लिए करें। एकांत में किया गया रचनात्मक कार्य बहुत फलदायी हो सकता है।' : 'Channel your creative energy into spiritual expression or healing practices. Solitary creative work may prove very fruitful.');
        }

        // Suggestion 4: Career + Gains (10 + 11)
        if ((yearLordThemeKeywords.includes('career') || yearLordThemeKeywords.includes('reputation')) &&
            (munthaThemeKeywords.includes('gains') || munthaThemeKeywords.includes('networks'))) {
             suggestions.push(lang === 'hi' ? 'अपने करियर को बढ़ावा देने के लिए नेटवर्किंग पर ध्यान दें। आपकी व्यावसायिक सफलता आपके सामाजिक दायरे से जुड़ी है।' : 'Focus on networking to boost your career. Your professional success is closely linked to your social circle and professional networks.');
        }
        
        // Suggestion 5: Career + Home (10 + 4)
        if ((yearLordThemeKeywords.includes('career') || yearLordThemeKeywords.includes('reputation')) &&
            (munthaThemeKeywords.includes('home') || munthaThemeKeywords.includes('family'))) {
             suggestions.push(lang === 'hi' ? 'व्यावसायिक महत्वाकांक्षाओं और घरेलू जिम्मेदारियों के बीच संतुलन बनाना महत्वपूर्ण होगा। घर से काम करना या रियल एस्टेट फायदेमंद हो सकता है।' : 'Balancing professional ambitions with domestic responsibilities will be key. Working from home or real estate ventures might be favored.');
        }

        // Suggestion 6: Health + Self (6 + 1)
        if ((yearLordThemeKeywords.includes('health') || yearLordThemeKeywords.includes('work')) &&
            (ascendantThemeKeywords.includes('self') || ascendantThemeKeywords.includes('identity'))) {
             suggestions.push(lang === 'hi' ? 'अपनी जीवन शक्ति और प्रभावशीलता बनाए रखने के लिए अपने स्वास्थ्य और दैनिक दिनचर्या को प्राथमिकता दें।' : 'Prioritize your health and daily routines to maintain your vitality and personal effectiveness.');
        }

        // Suggestion 7: Financial Prudence for Spiritual/Hidden Matters (2 + 12)
        if ((yearLordThemeKeywords.includes('finance') || yearLordThemeKeywords.includes('possessions')) &&
            (munthaThemeKeywords.includes('secrets') || munthaThemeKeywords.includes('expenses') || munthaThemeKeywords.includes('spirituality'))) {
             suggestions.push(lang === 'hi' ? 'आध्यात्मिक या गुप्त मामलों से संबंधित वित्तीय निर्णयों में सावधानी बरतें। खर्चों को समझदारी से प्रबंधित करें।' : 'Exercise financial prudence regarding spiritual or hidden matters. Manage expenses wisely in these areas.');
        }
        
        // Suggestion 8: Communication and Self-expression for Relationships (3 + 7)
        if ((yearLordThemeKeywords.includes('communication') || yearLordThemeKeywords.includes('siblings')) &&
            (munthaThemeKeywords.includes('partnerships') || munthaThemeKeywords.includes('marriage'))) {
             suggestions.push(lang === 'hi' ? 'अपने रिश्तों में आत्म-अभिव्यक्ति और संचार को बढ़ावा दें। यह आपके बंधनों को मजबूत करेगा।' : 'Foster open communication and self-expression within your relationships. This will strengthen your bonds.');
        }

        // Suggestion 9: Nurturing Home for Creative Projects (4 + 5)
        if ((yearLordThemeKeywords.includes('home') || yearLordThemeKeywords.includes('family')) &&
            (munthaThemeKeywords.includes('creativity') || munthaThemeKeywords.includes('children'))) {
             suggestions.push(lang === 'hi' ? 'अपने घर को अपनी रचनात्मक परियोजनाओं और बच्चों के लिए एक पोषण स्थान बनाएं। घरेलू स्थिरता रचनात्मकता को बढ़ावा देगी।' : 'Create a nurturing home environment that supports your creative projects and children. Domestic stability will foster creativity.');
        }
        
        // Suggestion 10: Higher Learning for Career Advancement (9 + 10)
        if ((yearLordThemeKeywords.includes('higher learning') || yearLordThemeKeywords.includes('travel')) &&
            (munthaThemeKeywords.includes('career') || munthaThemeKeywords.includes('reputation'))) {
             suggestions.push(lang === 'hi' ? 'अपने करियर में आगे बढ़ने के लिए उच्च शिक्षा या विशेष प्रशिक्षण प्राप्त करें। यात्रा व्यावसायिक अवसरों को भी बढ़ा सकती है।' : 'Pursue higher education or specialized training to advance your career. Travel may also enhance professional opportunities.');
        }
        
        // Suggestion 11: Transformative Healing/Service (8 + 6)
        if ((yearLordThemeKeywords.includes('shared resources') || yearLordThemeKeywords.includes('transformation')) &&
            (munthaThemeKeywords.includes('work') || munthaThemeKeywords.includes('health') || munthaThemeKeywords.includes('service'))) {
             suggestions.push(lang === 'hi' ? 'दूसरों की सेवा या स्वास्थ्य देखभाल में परिवर्तनकारी भूमिकाओं पर विचार करें। यह उपचार और व्यक्तिगत विकास का मार्ग हो सकता है।' : 'Consider transformative roles in service to others or in healthcare. This can be a path of healing and personal growth.');
        }


        // Default generic suggestion if no specific ones are matched
        if (suggestions.length === 0) {
            suggestions.push(lang === 'hi' ? 'वर्ष के मुख्य विषयों पर विचार करने के लिए समय निकालें और उन्हें अपने व्यक्तिगत लक्ष्यों के साथ कैसे संरेखित करें।' : 'Take time to reflect on the year\'s main themes and how to align them with your personal goals.');
        }
    
    
        suggestions.forEach(s => summary += phrases.suggestion(s));
        summary += `\n${phrases.defaultConclusion}`;
    
        return summary;
    }
    
function getPlanetInterpretation(planet, dignity, lang) {
    const interpretations = {
        en: {
            Sun: {
                Exalted: "Sun, being exalted, brings strong leadership, confidence, and success. You'll find natural authority.",
                'Own Sign': "Sun, in its own sign, provides strong willpower, authority, and a stable sense of self. Your core identity is robust.",
                Friend: "Sun, well-disposed, supports vitality and leadership, bringing ease in assertion.",
                Neutral: "Sun, in a neutral sign, gives results based on its house placement. Its influence is balanced.",
                Enemy: "Sun, unfavorably placed, may challenge ego, health, or authority, testing assertiveness.",
                Debilitated: "Sun, being debilitated, can indicate a lack of confidence, and challenges in leadership roles. Your self-esteem may need nurturing.",
            },
            Moon: {
                Exalted: "Moon, being exalted, promises emotional stability, high receptivity, and a nurturing disposition. Your feelings are a strong guide.",
                'Own Sign': "Moon, in its own sign, indicates a strong connection to emotions, home, and family. Emotional security is paramount.",
                Friend: "Moon, well-disposed, brings emotional happiness and supportive relationships, with comfort found easily.",
                Neutral: "Moon, in a neutral sign, reflects emotional climate of its house. Feelings are balanced but susceptible to environment.",
                Enemy: "Moon, unfavorably placed, may cause emotional restlessness and fluctuations, making inner peace elusive.",
                Debilitated: "Moon, being debilitated, can indicate emotional turmoil and a sense of insecurity. You may struggle with emotional well-being.",
            },
            Mars: {
                Exalted: "Mars, being exalted, provides immense courage, drive, and determination to succeed. Your actions are powerful and effective.",
                'Own Sign': "Mars, in its own sign, gives strong logical abilities, and the energy to pursue goals. You are a natural executor.",
                Friend: "Mars, well-disposed, ensures productive actions and efforts, leading to constructive assertion.",
                Neutral: "Mars, in a neutral sign, acts according to the house it occupies. Energy is present, but needs direction.",
                Enemy: "Mars, unfavorably placed, may lead to arguments, conflicts, or misdirected energy, requiring patience.",
                Debilitated: "Mars, being debilitated, can result in a lack of motivation or frustrated energy. You may struggle to assert yourself.",
            },
            Mercury: {
                Exalted: "Mercury, being exalted, grants superior intellect, analytical skills, and communication abilities. Your mind is sharp and articulate.",
                'Own Sign': "Mercury, in its own sign, indicates a sharp mind, adaptability, and skill in commerce. You are quick-witted and versatile.",
                Friend: "Mercury, well-disposed, implies intelligence is used effectively and communication flows smoothly.",
                Neutral: "Mercury, in a neutral sign, is influenced by planets it conjoins. Your thought process is balanced but can be swayed.",
                Enemy: "Mercury, unfavorably placed, can lead to communication issues and nervous energy, making clear expression challenging.",
                Debilitated: "Mercury, being debilitated, may cause difficulties in decision-making and learning. Mental clarity can be elusive.",
            },
            Jupiter: {
                Exalted: "Jupiter, being exalted, is a sign of great wisdom, fortune, and divine grace. Opportunities and growth abound.",
                'Own Sign': "Jupiter, in its own sign, provides strong principles, optimism, and opportunities for growth. Your inherent wisdom is powerful.",
                Friend: "Jupiter, well-disposed, implies wisdom is well-received and supported, inspiring confidence.",
                Neutral: "Jupiter, in a neutral sign, gives balanced results in its areas of influence. Growth is steady.",
                Enemy: "Jupiter, unfavorably placed, may cause rigid beliefs or challenges with teachers, hindering expansion.",
                Debilitated: "Jupiter, being debilitated, can indicate a lack of judgment or missed opportunities. Fortune may be challenging.",
            },
            Venus: {
                Exalted: "Venus, being exalted, promises refinement, artistic talent, and happiness in relationships. Harmony is a key theme.",
                'Own Sign': "Venus, in its own sign, gives a love for beauty, harmony, and pleasure. You naturally attract comfort.",
                Friend: "Venus, well-disposed, implies a happy social life and good fortune in love, with supportive relationships.",
                Neutral: "Venus, in a neutral sign, provides a balanced approach to relationships and comforts. Aesthetics are important.",
                Enemy: "Venus, unfavorably placed, may create dissatisfaction or challenges in relationships, making harmony hard to find.",
                Debilitated: "Venus, being debilitated, can lead to difficulties in finding happiness and refinement. Relationships may struggle.",
            },
            Saturn: {
                Exalted: "Saturn, being exalted, gives profound discipline, patience, and the ability to achieve long-lasting success. You build with strength.",
                'Own Sign': "Saturn, in its own sign, indicates a strong sense of duty, responsibility, and a structured approach to life. You are naturally disciplined.",
                Friend: "Saturn, well-disposed, indicates hard work and discipline are rewarded, leading to tangible results.",
                Neutral: "Saturn, in a neutral sign, delivers results based on your karma and efforts. Lessons are learned through experience.",
                Enemy: "Saturn, unfavorably placed, can bring delays, frustrations, and a feeling of being burdened, making patience vital.",
                Debilitated: "Saturn, being debilitated, may indicate a struggle with discipline and enduring hardships. Responsibilities can feel heavy.",
            },
            Rahu: {
                Exalted: "Rahu, being exalted, can give immense worldly success and the ability to achieve great ambition. Unconventional paths lead to prominence.",
                'Own Sign': "Rahu, in its own sign, provides a strong drive for innovation and unconventional success. You break new ground effectively.",
                Friend: "Rahu, well-disposed, implies ambitions find supportive environments, and desires manifest easily.",
                Neutral: "Rahu, in a neutral sign, amplifies the results of the house it is in. Its influence is unpredictable but strong.",
                Enemy: "Rahu, unfavorably placed, can create insatiable desires and dissatisfaction, leading to empty material pursuits.",
                Debilitated: "Rahu, being debilitated, may lead to confusion, deception, and unfulfilled desires. A sense of direction is needed.",
            },
            Ketu: {
                Exalted: "Ketu, being exalted, can provide profound spiritual insights and detachment from worldly affairs. Intuition is heightened.",
                'Own Sign': "Ketu, in its own sign, indicates a strong intuitive ability and a path towards spiritual liberation. Your inner guidance is strong.",
                Friend: "Ketu, well-disposed, implies spiritual journey is supported, and detachment brings peace.",
                Neutral: "Ketu, in a neutral sign, brings a sense of detachment to the house it occupies. Your focus is more internal.",
                Enemy: "Ketu, unfavorably placed, may create confusion, loss, or unexpected obstacles, making letting go challenging.",
                Debilitated: "Ketu, being debilitated, can indicate a lack of direction and feelings of helplessness. Spiritual path may be unclear.",
            },
        },
        hi: {
            Sun: {
                Exalted: "उच्च का सूर्य मजबूत नेतृत्व, आत्मविश्वास और सफलता लाता है। आपको स्वाभाविक अधिकार मिलेगा।",
                'Own Sign': "स्वराशि में सूर्य मजबूत इच्छाशक्ति, अधिकार और स्वयं की एक स्थिर भावना प्रदान करता है। आपकी मूल पहचान मजबूत है।",
                Friend: "मित्र राशि में सूर्य जीवन शक्ति और नेतृत्व का समर्थन करता है, जिससे मुखरता में आसानी होती है।",
                Neutral: "सम राशि में सूर्य अपने भाव के आधार पर परिणाम देता है। इसका प्रभाव संतुलित है।",
                Enemy: "शत्रु राशि में सूर्य अहंकार, स्वास्थ्य या अधिकार को चुनौती दे सकता है, जिससे मुखरता का परीक्षण होता है।",
                Debilitated: "नीच का सूर्य आत्मविश्वास की कमी और नेतृत्व की भूमिकाओं में चुनौतियों का संकेत दे सकता है। आपके आत्म-सम्मान को पोषण की आवश्यकता हो सकती है।",
            },
            Moon: {
                Exalted: "उच्च का चंद्रमा भावनात्मक स्थिरता, उच्च ग्रहणशीलता और एक पोषण करने वाले स्वभाव का वादा करता है। आपकी भावनाएं एक मजबूत मार्गदर्शक हैं।",
                'Own Sign': "स्वराशि में चंद्रमा भावनाओं, घर और परिवार से एक मजबूत संबंध का संकेत देता है। भावनात्मक सुरक्षा सर्वोपरि है।",
                Friend: "मित्र राशि में चंद्रमा भावनात्मक खुशी और सहायक रिश्ते लाता है, जिसमें आराम आसानी से मिलता है।",
                Neutral: "सम राशि में चंद्रमा अपने भाव के भावनात्मक माहौल को दर्शाता है। भावनाएं संतुलित हैं लेकिन पर्यावरण के प्रति संवेदनशील हैं।",
                Enemy: "शत्रु राशि में चंद्रमा भावनात्मक बेचैनी और उतार-चढ़ाव का कारण बन सकता है, जिससे आंतरिक शांति मायावी हो जाती है।",
                Debilitated: "नीच का चंद्रमा भावनात्मक उथल-पुथल और असुरक्षा की भावना का संकेत दे सकता है। आप भावनात्मक कल्याण के साथ संघर्ष कर सकते हैं।",
            },
            Mars: {
                Exalted: "उच्च का मंगल सफल होने के लिए अपार साहस, प्रेरणा और दृढ़ संकल्प प्रदान करता है। आपके कार्य शक्तिशाली और प्रभावी हैं।",
                'Own Sign': "स्वराशि में मंगल मजबूत तार्किक क्षमताएं और लक्ष्यों को प्राप्त करने के लिए ऊर्जा देता है। आप एक प्राकृतिक निष्पादक हैं।",
                Friend: "मित्र राशि में मंगल उत्पादक कार्यों और प्रयासों को सुनिश्चित करता है, जिससे रचनात्मक मुखरता होती है।",
                Neutral: "सम राशि में मंगल उस भाव के अनुसार कार्य करता है जिसमें वह रहता है। ऊर्जा मौजूद है, लेकिन दिशा की आवश्यकता है।",
                Enemy: "शत्रु राशि में मंगल तर्क, संघर्ष या गलत दिशा में ऊर्जा का कारण बन सकता है, जिसके लिए धैर्य की आवश्यकता होती है।",
                Debilitated: "नीच का मंगल प्रेरणा की कमी या निराश ऊर्जा का परिणाम हो सकता है। आप खुद को मुखर करने के लिए संघर्ष कर सकते हैं।",
            },
            Mercury: {
                Exalted: "उच्च का बुध श्रेष्ठ बुद्धि, विश्लेषणात्मक कौशल और संचार क्षमता प्रदान करता है। आपका मन तेज और स्पष्ट है।",
                'Own Sign': "स्वराशि में बुध एक तेज दिमाग, अनुकूलनशीलता और वाणिज्य में कौशल का संकेत देता है। आप हाजिरजवाब और बहुमुखी हैं।",
                Friend: "मित्र राशि में बुध का अर्थ है कि बुद्धि का प्रभावी ढंग से उपयोग किया जाता है और संचार सुचारू रूप से बहता है।",
                Neutral: "सम राशि में बुध उन ग्रहों से प्रभावित होता है जिनसे यह जुड़ता है। आपकी विचार प्रक्रिया संतुलित है लेकिन इसे प्रभावित किया जा सकता है।",
                Enemy: "शत्रु राशि में बुध संचार समस्याओं और घबराहट वाली ऊर्जा का कारण बन सकता है, जिससे स्पष्ट अभिव्यक्ति चुनौतीपूर्ण हो जाती है।",
                Debilitated: "नीच का बुध निर्णय लेने और सीखने में कठिनाइयों का कारण बन सकता है। मानसिक स्पष्टता मायावी हो सकती है।",
            },
            Jupiter: {
                Exalted: "उच्च का बृहस्पति महान ज्ञान, भाग्य और दिव्य कृपा का संकेत है। अवसर और विकास प्रचुर मात्रा में हैं।",
                'Own Sign': "स्वराशि में बृहस्पति मजबूत सिद्धांत, आशावाद और विकास के अवसर प्रदान करता है। आपका अंतर्निहित ज्ञान शक्तिशाली है।",
                Friend: "मित्र राशि में बृहस्पति का अर्थ है कि ज्ञान को अच्छी तरह से प्राप्त और समर्थित किया जाता है, जिससे आत्मविश्वास प्रेरित होता है।",
                Neutral: "सम राशि में बृहस्पति अपने प्रभाव के क्षेत्रों में संतुलित परिणाम देता है। विकास स्थिर है।",
                Enemy: "शत्रु राशि में बृहस्पति कठोर विश्वासों या शिक्षकों के साथ चुनौतियों का कारण बन सकता है, जिससे विस्तार में बाधा आती है।",
                Debilitated: "नीच का बृहस्पति निर्णय की कमी या चूके हुए अवसरों का संकेत दे सकता है। भाग्य चुनौतीपूर्ण हो सकता है।",
            },
            Venus: {
                Exalted: "उच्च का शुक्र शोधन, कलात्मक प्रतिभा और रिश्तों में खुशी का वादा करता है। सद्भाव एक प्रमुख विषय है।",
                'Own Sign': "स्वराशि में शुक्र सौंदर्य, सद्भाव और आनंद के प्रति प्रेम देता है। आप स्वाभाविक रूप से आराम को आकर्षित करते हैं।",
                Friend: "मित्र राशि में शुक्र एक खुशहाल सामाजिक जीवन और प्यार में सौभाग्य का अर्थ है, सहायक रिश्तों के साथ।",
                Neutral: "सम राशि में शुक्र रिश्तों और सुख-सुविधाओं के लिए एक संतुलित दृष्टिकोण प्रदान करता है। सौंदर्यशास्त्र महत्वपूर्ण हैं।",
                Enemy: "शत्रु राशि में शुक्र रिश्तों में असंतोष या चुनौतियां पैदा कर सकता है, जिससे सद्भाव खोजना मुश्किल हो जाता है।",
                Debilitated: "नीच का शुक्र खुशी और शोधन खोजने में कठिनाइयों का कारण बन सकता है। रिश्ते संघर्ष कर सकते हैं।",
            },
            Saturn: {
                Exalted: "उच्च का शनि गहरा अनुशासन, धैर्य और स्थायी सफलता प्राप्त करने की क्षमता देता है। आप ताकत से निर्माण करते हैं।",
                'Own Sign': "स्वराशि में शनि कर्तव्य, जिम्मेदारी की एक मजबूत भावना और जीवन के लिए एक संरचित दृष्टिकोण का संकेत देता है। आप स्वाभाविक रूप से अनुशासित हैं।",
                Friend: "मित्र राशि में शनि इंगित करता है कि कड़ी मेहनत और अनुशासन को पुरस्कृत किया जाता है, जिससे ठोस परिणाम मिलते हैं।",
                Neutral: "सम राशि में शनि आपके कर्म और प्रयासों के आधार पर परिणाम देता है। सबक अनुभव के माध्यम से सीखे जाते हैं।",
                Enemy: "शत्रु राशि में शनि देरी, निराशा और बोझ महसूस करने की भावना ला सकता है, जिससे धैर्य महत्वपूर्ण हो जाता है।",
                Debilitated: "नीच का शनि अनुशासन के साथ संघर्ष और कठिनाइयों को सहन करने का संकेत दे सकता है। जिम्मेदारियां भारी महसूस हो सकती हैं।",
            },
            Rahu: {
                Exalted: "उच्च का राहु अपार सांसारिक सफलता और महान महत्वाकांक्षा प्राप्त करने की क्षमता दे सकता है। अपरंपरागत रास्ते प्रमुखता की ओर ले जाते हैं।",
                'Own Sign': "स्वराशि में राहु नवाचार और अपरंपरागत सफलता के लिए एक मजबूत प्रेरणा प्रदान करता है। आप प्रभावी ढंग से नई जमीन तोड़ते हैं।",
                Friend: "राहु, अच्छी तरह से निपटारा, महत्वाकांक्षाओं को सहायक वातावरण मिलते हैं, और इच्छाएं आसानी से प्रकट होती हैं।",
                Neutral: "सम राशि में राहु उस घर के परिणामों को बढ़ाता है जिसमें वह है। इसका प्रभाव अप्रत्याशित लेकिन मजबूत है।",
                Enemy: "राहु, प्रतिकूल रूप से रखा गया, अतृप्त इच्छाएं और असंतोष पैदा कर सकता है, जिससे खाली भौतिकवादी खोज होती है।",
                Debilitated: "नीच का राहु भ्रम, धोखे और अधूरी इच्छाओं को जन्म दे सकता है। दिशा की भावना की आवश्यकता है।",
            },
            Ketu: {
                Exalted: "उच्च का केतु गहन आध्यात्मिक अंतर्दृष्टि और सांसारिक मामलों से वैराग्य प्रदान कर सकता है। अंतर्ज्ञान बढ़ जाता है।",
                'Own Sign': "स्वराशि में केतु एक मजबूत सहज क्षमता और आध्यात्मिक मुक्ति की ओर एक मार्ग का संकेत देता है। आपका आंतरिक मार्गदर्शन मजबूत है।",
                Friend: "केतु, अच्छी तरह से निपटारा, आध्यात्मिक यात्रा समर्थित है, और वैराग्य शांति लाता है।",
                Neutral: "सम राशि में केतु उस घर में वैराग्य की भावना लाता है जिसमें वह रहता है। आपका ध्यान अधिक आंतरिक है।",
                Enemy: "शत्रु राशि में केतु भ्रम, हानि या अप्रत्याशित बाधाएं पैदा कर सकता है, जिससे जाने देना चुनौतीपूर्ण हो जाता है।",
                Debilitated: "नीच का केतु दिशा की कमी और लाचारी की भावनाओं का संकेत दे सकता है। आध्यात्मिक मार्ग अस्पष्ट हो सकता।",
            },
        }
    };

    const langInterpretations = interpretations[lang] || interpretations['en'];
    return langInterpretations[planet]?.[dignity] || '';
}

function getKpCuspSignificatorInterpretation(planet, dignity, houseNumber, lang) {
    const themes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    const houseTheme = themes[houseNumber] || (lang === 'hi' ? 'इस भाव' : 'this house');
    const planetName = getPlanetName(planet, lang);
    const ordinalHouse = getOrdinal(houseNumber);

    const interpretations = {
        en: {
            Sun: {
                Exalted: `being exalted, brings exceptional leadership, vitality, and success to your **${ordinalHouse} house (${houseTheme})**. It indicates that your ego and identity are powerfully and positively expressed, leading to recognition and influence in these life areas.`,
                'Own Sign': `in its own sign, provides a strong and stable sense of self regarding your **${ordinalHouse} house (${houseTheme})**. You'll have natural authority and willpower to direct these matters with confidence.`,
                Friend: `in a friendly sign, offers supportive energy to your **${ordinalHouse} house (${houseTheme})**. This suggests that your efforts in these areas will be productive and met with favor from others.`,
                Neutral: `in a neutral sign, provides a balanced but adaptable influence on your **${ordinalHouse} house (${houseTheme})**. The outcome of your efforts will largely depend on other conjoining or aspecting planets.`,
                Enemy: `in an enemy sign, may test your ego and authority in your **${ordinalHouse} house (${houseTheme})**. You might face challenges to your leadership or a lack of recognition, requiring you to develop resilience.`,
                Debilitated: `being debilitated, can signify struggles with confidence and vitality concerning your **${ordinalHouse} house (${houseTheme})**. Your self-esteem in these areas may need deliberate nurturing to overcome obstacles.`
            },
            Moon: {
                Exalted: `being exalted, ensures profound emotional stability and receptivity in your **${ordinalHouse} house (${houseTheme})**. Your intuition will be a powerful and reliable guide in these matters, leading to nurturing outcomes.`,
                'Own Sign': `in its own sign, deeply connects your emotional well-being to your **${ordinalHouse} house (${houseTheme})**. You will seek and find emotional security and comfort by focusing on these life areas.`,
                Friend: `in a friendly sign, fosters emotional happiness and harmonious relationships related to your **${ordinalHouse} house (${houseTheme})**. You will find it easy to connect with others and find contentment here.`,
                Neutral: `in a neutral sign, brings a moderate and adaptable emotional tone to your **${ordinalHouse} house (${houseTheme})**. Your feelings are balanced but can be easily influenced by your environment.`,
                Enemy: `in an enemy sign, may cause emotional restlessness and inner conflict regarding your **${ordinalHouse} house (${houseTheme})**. Achieving peace of mind in these matters will require conscious effort and emotional management.`,
                Debilitated: `being debilitated, suggests emotional turmoil and insecurity related to your **${ordinalHouse} house (${houseTheme})**. You may find it difficult to form supportive bonds or find comfort in these areas.`
            },
            Mars: {
                Exalted: `being exalted, provides immense courage, drive, and strategic assertiveness for your **${ordinalHouse} house (${houseTheme})**. Your actions will be powerful and effective, leading to clear success.`,
                'Own Sign': `in its own sign, gives you strong logical abilities and the energy to decisively pursue goals related to your **${ordinalHouse} house (${houseTheme})**. You are a natural executor in these matters.`,
                Friend: `in a friendly sign, promotes productive and constructive efforts concerning your **${ordinalHouse} house (${houseTheme})**. Your actions are likely to be well-received and lead to beneficial outcomes.`,
                Neutral: `in a neutral sign, brings a baseline of energy to your **${ordinalHouse} house (${houseTheme})** that needs clear direction. Its effectiveness will depend on the other planets influencing it.`,
                Enemy: `in an enemy sign, can manifest as arguments, conflicts, or misdirected energy within your **${ordinalHouse} house (${houseTheme})**. Patience and careful planning are required to avoid disputes.`,
                Debilitated: `being debilitated, may result in a lack of motivation or frustrated energy regarding your **${ordinalHouse} house (${houseTheme})**. Asserting yourself and overcoming obstacles will be a key challenge.`
            },
            Mercury: {
                Exalted: `being exalted, grants superior intellect and articulate communication regarding your **${ordinalHouse} house (${houseTheme})**. Your analytical skills will be sharp, leading to success in intellectual pursuits.`,
                'Own Sign': `in its own sign, brings a sharp, adaptable mind and commercial skill to your **${ordinalHouse} house (${houseTheme})**. You are versatile and excel at communication and commerce in these areas.`,
                Friend: `in a friendly sign, ensures your intelligence is applied effectively for your **${ordinalHouse} house (${houseTheme})**. Communication flows smoothly, and learning is favored.`,
                Neutral: `in a neutral sign, makes your thought process for your **${ordinalHouse} house (${houseTheme})** balanced but easily swayed by other influences. Your adaptability is a strength, but indecisiveness can be a challenge.`,
                Enemy: `in an enemy sign, can lead to communication issues or nervous energy affecting your **${ordinalHouse} house (${houseTheme})**. Mental friction and misunderstandings are possible.`,
                Debilitated: `being debilitated, may cause difficulties in decision-making and learning related to your **${ordinalHouse} house (${houseTheme})**. Mental clarity will require conscious focus.`
            },
            Jupiter: {
                Exalted: `being exalted, bestows great wisdom, fortune, and grace upon your **${ordinalHouse} house (${houseTheme})**. This is a sign of abundant growth, opportunities, and blessings in these matters.`,
                'Own Sign': `in its own sign, provides strong principles and optimism for your **${ordinalHouse} house (${houseTheme})**. Your inherent wisdom will guide you toward expansive and favorable outcomes.`,
                Friend: `in a friendly sign, indicates that your wisdom and guidance concerning your **${ordinalHouse} house (${houseTheme})** will be well-received and supported, inspiring confidence.`,
                Neutral: `in a neutral sign, offers balanced and steady growth in your **${ordinalHouse} house (${houseTheme})**. The results will be positive but not necessarily dramatic, depending on other factors.`,
                Enemy: `in an enemy sign, may cause rigid beliefs or challenges with mentors related to your **${ordinalHouse} house (${houseTheme})**. This can hinder expansion and create philosophical friction.`,
                Debilitated: `being debilitated, can indicate a lack of judgment or missed opportunities regarding your **${ordinalHouse} house (${houseTheme})**. Fortune may feel elusive or hard-won.`
            },
            Venus: {
                Exalted: `being exalted, promises exceptional refinement, artistic talent, and happiness in your **${ordinalHouse} house (${houseTheme})**. Harmony and beauty will flow into these areas of your life.`,
                'Own Sign': `in its own sign, gives a natural love for beauty, harmony, and pleasure concerning your **${ordinalHouse} house (${houseTheme})**. You will easily attract comfort and supportive relationships here.`,
                Friend: `in a friendly sign, points to a happy social life and good fortune in matters of your **${ordinalHouse} house (${houseTheme})**. Expect creative ease and supportive relationships.`,
                Neutral: `in a neutral sign, provides a balanced and diplomatic approach to your **${ordinalHouse} house (${houseTheme})**. Aesthetics and social graces will be important, leading to moderate but stable outcomes.`,
                Enemy: `in an enemy sign, may create dissatisfaction or challenges in relationships connected to your **${ordinalHouse} house (${houseTheme})**. Finding harmony may require extra effort and compromise.`,
                Debilitated: `being debilitated, can lead to difficulties in finding happiness and refinement in your **${ordinalHouse} house (${houseTheme})**. A lack of fulfillment in aesthetic or relational pursuits is possible.`
            },
            Saturn: {
                Exalted: `being exalted, grants profound discipline and the patience to achieve long-lasting success in your **${ordinalHouse} house (${houseTheme})**. Your structured efforts will lead to significant and stable achievements.`,
                'Own Sign': `in its own sign, indicates a strong sense of duty and a structured approach to your **${ordinalHouse} house (${houseTheme})**. You are naturally disciplined and can manage these areas with great responsibility.`,
                Friend: `in a friendly sign, indicates that your hard work and discipline regarding your **${ordinalHouse} house (${houseTheme})** will be rewarded with tangible results and steady progress.`,
                Neutral: `in a neutral sign, delivers results based on your karma and efforts in your **${ordinalHouse} house (${houseTheme})**. Lessons will be learned through practical experience, leading to gradual but sure outcomes.`,
                Enemy: `in an enemy sign, can bring delays, frustrations, or a sense of being burdened in your **${ordinalHouse} house (${houseTheme})**. Patience and perseverance will be essential to overcome these trials.`,
                Debilitated: `being debilitated, may signify struggles with discipline and enduring hardships related to your **${ordinalHouse} house (${houseTheme})**. Responsibilities may feel heavy, and progress slow.`
            },
            Rahu: {
                Exalted: `being exalted, can trigger immense worldly success and ambition in your **${ordinalHouse} house (${houseTheme})**. Unconventional methods will lead to prominence and unexpected gains.`,
                'Own Sign': `in its own sign, provides a powerful drive for innovation and unconventional success regarding your **${ordinalHouse} house (${houseTheme})**. You are poised to break new ground and pursue unique opportunities.`,
                Friend: `in a friendly sign, suggests that your ambitions concerning your **${ordinalHouse} house (${houseTheme})** will find supportive environments, allowing your desires to manifest more easily.`,
                Neutral: `in a neutral sign, amplifies the affairs of your **${ordinalHouse} house (${houseTheme})**. The influence will be strong but unpredictable, pushing boundaries and creating sudden shifts.`,
                Enemy: `in an enemy sign, can create insatiable desires and dissatisfaction in your **${ordinalHouse} house (${houseTheme})**. This may lead to a feeling of being unfulfilled despite material gains.`,
                Debilitated: `being debilitated, may lead to confusion, deception, or unfulfilled desires concerning your **${ordinalHouse} house (${houseTheme})**. A clear, ethical direction is crucial to navigate this energy.`
            },
            Ketu: {
                Exalted: `being exalted, can provide profound spiritual insights and detachment from worldly matters in your **${ordinalHouse} house (${houseTheme})**. Your intuition is heightened, leading to deep understanding.`,
                'Own Sign': `in its own sign, indicates a strong intuitive ability and a path toward spiritual liberation through your **${ordinalHouse} house (${houseTheme})**. Your inner guidance is a powerful asset here.`,
                Friend: `in a friendly sign, suggests your spiritual journey related to your **${ordinalHouse} house (${houseTheme})** is supported. Detachment from material outcomes will bring peace.`,
                Neutral: `in a neutral sign, brings a sense of detachment to your **${ordinalHouse} house (${houseTheme})**. The focus is more internal, seeking spiritual solutions rather than external results.`,
                Enemy: `in an enemy sign, may create confusion, loss, or unexpected obstacles in your **${ordinalHouse} house (${houseTheme})**. The key lesson is learning to let go, which will be challenging but necessary.`,
                Debilitated: `being debilitated, can indicate a lack of direction or feelings of helplessness in your **${ordinalHouse} house (${houseTheme})**. The path may be unclear, requiring introspection to find clarity.`
            },
        },
        hi: {
            Sun: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के लिए असाधारण नेतृत्व, जीवन शक्ति और सफलता लाता है। यह इंगित करता है कि आपका अहंकार और पहचान शक्तिशाली और सकारात्मक रूप से व्यक्त होती है, जिससे इन जीवन क्षेत्रों में मान्यता और प्रभाव पड़ता है।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में स्वयं की एक मजबूत और स्थिर भावना प्रदान करता है। आपके पास इन मामलों को आत्मविश्वास के साथ निर्देशित करने के लिए प्राकृतिक अधिकार और इच्छाशक्ति होगी।`,
                Friend: `मित्र राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** को सहायक ऊर्जा प्रदान करता है। यह बताता है कि इन क्षेत्रों में आपके प्रयास उत्पादक होंगे और दूसरों से faveur प्राप्त करेंगे।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** पर एक संतुलित लेकिन अनुकूलनीय प्रभाव प्रदान करता है। आपके प्रयासों का परिणाम काफी हद तक अन्य संयुक्त या पहलू ग्रहों पर निर्भर करेगा।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में आपके अहंकार और अधिकार का परीक्षण कर सकता है। आपको अपने नेतृत्व के लिए चुनौतियों का सामना करना पड़ सकता है या मान्यता की कमी हो सकती है, जिससे आपको लचीलापन विकसित करने की आवश्यकता होगी।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित आत्मविश्वास और जीवन शक्ति के साथ संघर्ष का संकेत दे सकता है। इन क्षेत्रों में आपके आत्म-सम्मान को बाधाओं को दूर करने के लिए जानबूझकर पोषण की आवश्यकता हो सकती है।`
            },
            Moon: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में गहन भावनात्मक स्थिरता और ग्रहणशीलता सुनिश्चित करता है। इन मामलों में आपकी अंतर्ज्ञान एक शक्तिशाली और विश्वसनीय मार्गदर्शक होगी, जिससे पोषण संबंधी परिणाम प्राप्त होंगे।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपकी भावनात्मक भलाई को आपके **${ordinalHouse} भाव (${houseTheme})** से गहराई से जोड़ता है। आप इन जीवन क्षेत्रों पर ध्यान केंद्रित करके भावनात्मक सुरक्षा और आराम की तलाश करेंगे और पाएंगे।`,
                Friend: `मित्र राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित भावनात्मक खुशी और सामंजस्यपूर्ण संबंधों को बढ़ावा देता है। आपको यहां दूसरों से जुड़ना और संतोष पाना आसान लगेगा।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में एक मध्यम और अनुकूलनीय भावनात्मक स्वर लाता है। आपकी भावनाएं संतुलित हैं लेकिन आपके पर्यावरण से आसानी से प्रभावित हो सकती हैं।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में भावनात्मक बेचैनी और आंतरिक संघर्ष का कारण बन सकता है। इन मामलों में मन की शांति प्राप्त करने के लिए सचेत प्रयास और भावनात्मक प्रबंधन की आवश्यकता होगी।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित भावनात्मक उथल-पुथल और असुरक्षा का सुझाव देता है। आपको सहायक बंधन बनाने या इन क्षेत्रों में आराम पाने में कठिनाई हो सकती है।`
            },
            Mars: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के लिए अपार साहस, प्रेरणा और रणनीतिक मुखरता प्रदान करता है। आपके कार्य शक्तिशाली और प्रभावी होंगे, जिससे स्पष्ट सफलता मिलेगी।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपको अपने **${ordinalHouse} भाव (${houseTheme})** से संबंधित लक्ष्यों को निर्णायक रूप से आगे बढ़ाने के लिए मजबूत तार्किक क्षमताएं और ऊर्जा देता है। आप इन मामलों में एक प्राकृतिक निष्पादक हैं।`,
                Friend: `मित्र राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित उत्पादक और रचनात्मक प्रयासों को बढ़ावा देता है। आपके कार्यों को अच्छी तरह से प्राप्त होने और लाभकारी परिणाम देने की संभावना है।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में ऊर्जा का एक आधार रेखा लाता है जिसे स्पष्ट दिशा की आवश्यकता होती है। इसकी प्रभावशीलता इसे प्रभावित करने वाले अन्य ग्रहों पर निर्भर करेगी।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के भीतर तर्क, संघर्ष या गलत दिशा में ऊर्जा के रूप में प्रकट हो सकता है। विवादों से बचने के लिए धैर्य और सावधानीपूर्वक योजना की आवश्यकता है।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में प्रेरणा की कमी या निराश ऊर्जा का परिणाम हो सकता है। खुद को मुखर करना और बाधाओं को दूर करना एक प्रमुख चुनौती होगी।`
            },
            Mercury: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में बेहतर बुद्धि और स्पष्ट संचार प्रदान करता है। आपकी विश्लेषणात्मक कौशल तेज होगी, जिससे बौद्धिक गतिविधियों में सफलता मिलेगी।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में एक तेज, अनुकूलनीय दिमाग और व्यावसायिक कौशल लाता है। आप इन क्षेत्रों में बहुमुखी हैं और संचार और वाणिज्य में उत्कृष्टता प्राप्त करते हैं।`,
                Friend: `मित्र राशि में होने के कारण, यह सुनिश्चित करता है कि आपकी बुद्धि आपके **${ordinalHouse} भाव (${houseTheme})** के लिए प्रभावी ढंग से लागू हो। संचार सुचारू रूप से बहता है, और सीखने का पक्ष लिया जाता है।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के लिए आपकी विचार प्रक्रिया को संतुलित लेकिन अन्य प्रभावों से आसानी से प्रभावित करता है। आपकी अनुकूलनशीलता एक ताकत है, लेकिन अनिर्णय एक चुनौती हो सकती है।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** को प्रभावित करने वाली संचार समस्याओं या घबराहट वाली ऊर्जा का कारण बन सकता है। मानसिक घर्षण और गलतफहमी संभव है।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित निर्णय लेने और सीखने में कठिनाइयों का कारण बन सकता है। मानसिक स्पष्टता के लिए सचेत ध्यान की आवश्यकता होगी।`
            },
            Jupiter: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** पर महान ज्ञान, भाग्य और कृपा प्रदान करता है। यह इन मामलों में प्रचुर वृद्धि, अवसरों और आशीर्वाद का संकेत है।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के लिए मजबूत सिद्धांत और आशावाद प्रदान करता है। आपकी अंतर्निहित बुद्धि आपको विशाल और अनुकूल परिणामों की ओर मार्गदर्शन करेगी।`,
                Friend: `मित्र राशि में होने के कारण, यह इंगित करता है कि आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित आपके ज्ञान और मार्गदर्शन को अच्छी तरह से प्राप्त और समर्थित किया जाएगा, जिससे आत्मविश्वास प्रेरित होगा।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में संतुलित और स्थिर विकास प्रदान करता है। परिणाम सकारात्मक होंगे लेकिन जरूरी नहीं कि नाटकीय हों, यह अन्य कारकों पर निर्भर करता है।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित कठोर विश्वासों या गुरुओं के साथ चुनौतियों का कारण बन सकता है। यह विस्तार में बाधा डाल सकता है और दार्शनिक घर्षण पैदा कर सकता है।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में निर्णय की कमी या चूके हुए अवसरों का संकेत दे सकता है। भाग्य मायावी या कठिन परिश्रम से प्राप्त हो सकता है।`
            },
            Venus: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में असाधारण शोधन, कलात्मक प्रतिभा और खुशी का वादा करता है। सद्भाव और सुंदरता आपके जीवन के इन क्षेत्रों में प्रवाहित होगी।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित सौंदर्य, सद्भाव और आनंद के लिए एक स्वाभाविक प्रेम देता है। आप यहां आसानी से आराम और सहायक रिश्तों को आकर्षित करेंगे।`,
                Friend: `मित्र राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के मामलों में एक खुशहाल सामाजिक जीवन और सौभाग्य की ओर इशारा करता है। रचनात्मक सहजता और सहायक संबंधों की अपेक्षा करें।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के लिए एक संतुलित और राजनयिक दृष्टिकोण प्रदान करता है। सौंदर्यशास्त्र और सामाजिक अनुग्रह महत्वपूर्ण होंगे, जिससे मध्यम लेकिन स्थिर परिणाम प्राप्त होंगे।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से जुड़े रिश्तों में असंतोष या चुनौतियां पैदा कर सकता है। सद्भाव खोजने के लिए अतिरिक्त प्रयास और समझौते की आवश्यकता हो सकती है।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में खुशी और शोधन खोजने में कठिनाइयों का कारण बन सकता है। सौंदर्य या संबंधपरक गतिविधियों में पूर्ति की कमी संभव है।`
            },
            Saturn: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में स्थायी सफलता प्राप्त करने के लिए गहरा अनुशासन और धैर्य प्रदान करता है। आपके संरचित प्रयासों से महत्वपूर्ण और स्थिर उपलब्धियां प्राप्त होंगी।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के प्रति कर्तव्य की एक मजबूत भावना और एक संरचित दृष्टिकोण को इंगित करता है। आप स्वाभाविक रूप से अनुशासित हैं और इन क्षेत्रों को बड़ी जिम्मेदारी के साथ प्रबंधित कर सकते हैं।`,
                Friend: `मित्र राशि में होने के कारण, यह इंगित करता है कि आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में आपकी कड़ी मेहनत और अनुशासन को ठोस परिणामों और स्थिर प्रगति के साथ पुरस्कृत किया जाएगा।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में आपके कर्म और प्रयासों के आधार पर परिणाम देता है। सबक व्यावहारिक अनुभव के माध्यम से सीखे जाएंगे, जिससे क्रमिक लेकिन निश्चित परिणाम प्राप्त होंगे।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में देरी, निराशा, या बोझ महसूस करने की भावना ला सकता है। इन परीक्षणों को दूर करने के लिए धैर्य और दृढ़ता आवश्यक होगी।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित अनुशासन और स्थायी कठिनाइयों के साथ संघर्ष का संकेत दे सकता है। जिम्मेदारियां भारी महसूस हो सकती हैं, और प्रगति धीमी हो सकती है।`
            },
            Rahu: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में अपार सांसारिक सफलता और महत्वाकांक्षा को गति प्रदान कर सकता है। अपरंपरागत तरीके प्रमुखता और अप्रत्याशित लाभ की ओर ले जाएंगे।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के संबंध में नवाचार और अपरंपरागत सफलता के लिए एक शक्तिशाली प्रेरणा प्रदान करता है। आप नई जमीन तोड़ने और अद्वितीय अवसरों का पीछा करने के लिए तैयार हैं।`,
                Friend: `मित्र राशि में होने के कारण, यह बताता है कि आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित आपकी महत्वाकांक्षाओं को सहायक वातावरण मिलेगा, जिससे आपकी इच्छाएं अधिक आसानी से प्रकट होंगी।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के मामलों को बढ़ाता है। प्रभाव मजबूत लेकिन अप्रत्याशित होगा, सीमाओं को आगे बढ़ाएगा और अचानक बदलाव पैदा करेगा।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में अतृप्त इच्छाओं और असंतोष का कारण बन सकता है। इससे भौतिक लाभ के बावजूद अधूरापन महसूस हो सकता है।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित भ्रम, धोखे या अधूरी इच्छाओं का कारण बन सकता है। इस ऊर्जा को नेविगेट करने के लिए एक स्पष्ट, नैतिक दिशा महत्वपूर्ण है।`
            },
            Ketu: {
                Exalted: `उच्च का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में गहन आध्यात्मिक अंतर्दृष्टि और सांसारिक मामलों से वैराग्य प्रदान कर सकता है। आपकी अंतर्ज्ञान बढ़ जाती है, जिससे गहरी समझ प्राप्त होती है।`,
                'Own Sign': `स्वराशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** के माध्यम से एक मजबूत सहज क्षमता और आध्यात्मिक मुक्ति की ओर एक मार्ग इंगित करता है। आपका आंतरिक मार्गदर्शन यहां एक शक्तिशाली संपत्ति है।`,
                Friend: `मित्र राशि में होने के कारण, यह बताता है कि आपके **${ordinalHouse} भाव (${houseTheme})** से संबंधित आपकी आध्यात्मिक यात्रा समर्थित है। भौतिक परिणामों से वैराग्य शांति लाएगा।`,
                Neutral: `सम राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में वैराग्य की भावना लाता है। ध्यान बाहरी परिणामों के बजाय आध्यात्मिक समाधानों की तलाश में अधिक आंतरिक है।`,
                Enemy: `शत्रु राशि में होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में भ्रम, हानि या अप्रत्याशित बाधाएं पैदा कर सकता है। जाने देना सीखना महत्वपूर्ण सबक है, जो चुनौतीपूर्ण लेकिन आवश्यक होगा।`,
                Debilitated: `नीच का होने के कारण, यह आपके **${ordinalHouse} भाव (${houseTheme})** में दिशा की कमी या लाचारी की भावनाओं का संकेत दे सकता है। मार्ग अस्पष्ट हो सकता है, जिसके लिए स्पष्टता खोजने के लिए आत्मनिरीक्षण की आवश्यकता होती है।`
            },
        }
    };

    const planetInterpretations = interpretations[lang][planet];
    if (planetInterpretations && planetInterpretations[dignity]) {
        return planetInterpretations[dignity];
    }
    
    // Fallback to a more generic interpretation if a specific one isn't found
    return lang === 'hi'
        ? `${planetName} (${dignity}) ${houseTheme} के मामलों को प्रभावित करता है।`
        : `${planetName} (${dignity}) influences matters of ${houseTheme}.`;
}


// Helper function to provide nuanced interpretation for planet significators
function getPlanetSignificatorDetailedDescription(planetName, dignity, signifiedHouses, lang = 'en') {
    const translatedPlanet = getPlanetName(planetName, lang);
    const houseThemes = lang === 'hi' ? houseThemes_hi : houseThemes_en;

    if (signifiedHouses.length === 0) {
        return lang === 'hi'
            ? `${translatedPlanet} इस चार्ट में किसी भी भाव का एक मजबूत कारक नहीं है, जो एक तटस्थ भूमिका का सुझाव देता है।`
            : `${translatedPlanet} is not a strong significator for any house in this chart, suggesting a neutral role.`;
    }

    const houseLinks = signifiedHouses.map(h => {
        const theme = houseThemes[h] || (lang === 'hi' ? `भाव ${h}` : `House ${h}`);
        const houseNum = lang === 'hi' ? `(भाव ${h})` : `(House ${h})`;
        return `**${theme} ${houseNum}**`;
    }).join(', ');

    let description = '';

    if (lang === 'hi') {
        const dignityTemplates_hi = {
            Exalted: `उच्च का होने के कारण, यह **अत्यधिक शुभ और शक्तिशाली परिणाम** देगा। इसकी दशा में, आप इन क्षेत्रों में उत्कृष्ट प्रगति की उम्मीद कर सकते हैं: ${houseLinks}।`,
            'Own Sign': `अपनी स्वराशि में होने के कारण, यह **स्थिर और मजबूत परिणाम** देगा। इसकी दशा में, इन क्षेत्रों में आत्मविश्वास और नियंत्रण रहेगा: ${houseLinks}।`,
            Friend: `मित्र राशि में होने के कारण, यह **अनुकूल और सहायक परिणाम** देगा। इसकी दशा में, आप इन क्षेत्रों में सुचारू प्रगति और अवसरों की उम्मीद कर सकते हैं: ${houseLinks}।`,
            Neutral: `सम राशि में होने के कारण, यह **संतुलित परिणाम** देगा। इसकी दशा में, इन क्षेत्रों में परिणाम अन्य ग्रहों के प्रभाव पर निर्भर करेंगे: ${houseLinks}।`,
            Enemy: `शत्रु राशि में होने के कारण, यह **चुनौतियां और बाधाएं** ला सकता है। इसकी दशा में, इन क्षेत्रों में सचेत प्रयास और धैर्य की आवश्यकता होगी: ${houseLinks}।`,
            Debilitated: `नीच का होने के कारण, यह **गंभीर बाधाएं और कठिनाइयां** ला सकता है। इसकी दशा में, आपको इन क्षेत्रों में महत्वपूर्ण चुनौतियों का सामना करना पड़ सकता है: ${houseLinks}।`,
            Moolatrikona: `मूलत्रिकोण राशि में होने के कारण, यह **अत्यधिक शुभ और शक्तिशाली परिणाम** देगा। इसकी दशा में, आप इन क्षेत्रों में उत्कृष्ट प्रगति की उम्मीद कर सकते हैं: ${houseLinks}।`
        };
        const translatedDignity = { 'Standard': 'सामान्य', 'Unknown': 'अज्ञात' }[dignity] || dignity;
        description = dignityTemplates_hi[dignity] || `अपनी ${translatedDignity} स्थिति के कारण, यह अपनी क्षमता के अनुसार परिणाम देगा, जो इन क्षेत्रों को प्रभावित करेगा: ${houseLinks}।`;
    } else { // English
        const dignityTemplates_en = {
            Exalted: `Due to its **Exalted** status, it will deliver **highly favorable and powerful results**. During its periods, this will positively influence matters of: ${houseLinks}.`,
            'Own Sign': `In its **Own Sign**, it will deliver **stable and strong results**. Its periods will bring confidence and control regarding: ${houseLinks}.`,
            Friend: `In a **Friendly** sign, it is well-positioned to deliver **favorable and supportive results**. Expect smooth progress and opportunities concerning: ${houseLinks}.`,
            Neutral: `Its **Neutral** status suggests **balanced results**. Outcomes during its periods will depend on other influences regarding: ${houseLinks}.`,
            Enemy: `In an **Enemy** sign, it may bring **challenges and obstacles**. Conscious effort will be required during its periods for matters of: ${houseLinks}.`,
            Debilitated: `Being **Debilitated**, it may indicate **significant hurdles and difficulties**. You may face considerable challenges during its periods concerning: ${houseLinks}.`,
            Moolatrikona: `In its **Moolatrikona** sign, it will deliver **highly favorable and powerful results**. During its periods, this will positively influence matters of: ${houseLinks}.`
        };
        description = dignityTemplates_en[dignity] || `Due to its ${dignity} status, it will deliver results according to its capacity, affecting areas of: ${houseLinks}.`;
    }
    return description;
}
// Helper function to rank significators for a specific event
function rankSignificators(event, eventType, keyHouses, karaka, kpSignificators, planetDetailsMap, lang) {
    const { cusps, planets } = kpSignificators.overview;
    const scores = {};
    const allPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

    const translatedEvent = lang === 'hi' ? (eventNames_hi[event] || event) : event;

    allPlanets.forEach(p => scores[p] = 0);

    // Score planets
    allPlanets.forEach(p => {
        // +3 points if planet is a primary significator of a key house
        keyHouses.forEach(house => {
            if (cusps[house] && cusps[house].includes(p)) {
                scores[p] += 3;
            }
        });

        // +2 points if planet signifies a key house in its own list
        const signifiedHouses = planets[p] || [];
        if (signifiedHouses.some(h => keyHouses.includes(h))) {
            scores[p] += 2;
        }

        // +2 points if it's the karaka
        if (p === karaka) {
            scores[p] += 2;
        }

        // +1 for good dignity
        const planetDetail = planetDetailsMap.get(p);
        const dignity = planetDetail?.avasthas?.dignity;
        if (['Exalted', 'Own Sign', 'Friend'].includes(dignity)) {
            scores[p] += 1;
        }
    });

    // Filter out planets with a score of 0 and sort
    const ranked = Object.entries(scores)
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1]);

    // Build the analysis string
    let analysis = '';
    const topSignificators = ranked.slice(0, 4);

    if (topSignificators.length > 0) {
        analysis += `**${translatedEvent}:**\n`;
        analysis += `*   **${lang === 'hi' ? 'प्रमुख कारक' : 'Top Significators'}:** ${topSignificators.map(p => `${getPlanetName(p[0], lang)} (${lang === 'hi' ? 'स्कोर' : 'Score'}: ${p[1]})`).join(', ')}.\n`;

        // --- NEW LOGIC for Timing of Event ---
        const favorablePeriods = [];
        const challengingPeriods = [];
        const neutralPeriods = [];

        topSignificators.forEach(p_arr => {
            const planetName = p_arr[0];
            const planetDetail = planetDetailsMap.get(planetName);
            const dignity = planetDetail?.avasthas?.dignity || 'Unknown';
            const translatedPlanetName = getPlanetName(planetName, lang);
            
            if (['Exalted', 'Own Sign', 'Friend', 'Moolatrikona'].includes(dignity)) {
                favorablePeriods.push(translatedPlanetName);
            } else if (['Debilitated', 'Enemy'].includes(dignity)) {
                challengingPeriods.push(translatedPlanetName);
            } else {
                neutralPeriods.push(translatedPlanetName);
            }
        });

        let timingText = '';
        if (favorablePeriods.length > 0) {
            timingText += (lang === 'hi' ? `**अनुकूल अवधि:** ${favorablePeriods.join(', ')} की दशा/अंतर्दशा के दौरान उन्नति और सफलता की संभावना है। ` : `**Favorable Periods:** The Dasha/Antardasha of **${favorablePeriods.join(', ')}** are particularly promising for growth and success. `);
        }
        if (challengingPeriods.length > 0) {
            timingText += (lang === 'hi' ? `**चुनौतीपूर्ण अवधि:** ${challengingPeriods.join(', ')} की अवधि में बाधाएं आ सकती हैं या अधिक प्रयास की आवश्यकता हो सकती है। ` : `**Challenging Periods:** The periods of **${challengingPeriods.join(', ')}** may bring obstacles or require more effort. `);
        }
        if (neutralPeriods.length > 0) {
            timingText += (lang === 'hi' ? `**मिश्रित अवधि:** ${neutralPeriods.join(', ')} की अवधि में परिणाम अन्य गोचरों पर निर्भर करेंगे। ` : `**Mixed Periods:** The periods of **${neutralPeriods.join(', ')}** will yield mixed results dependent on other transits. `);
        }
        
        if (timingText.trim() === '') {
            // Fallback to old generic text if no planets are categorized
            timingText = (lang === 'hi' ? `इन शीर्ष कारक ग्रहों की महादशा, भुक्ति, या अंतर दशा के दौरान ${translatedEvent} की संभावना सबसे अधिक होती है।` : `The event is most likely to manifest during the Mahadasha, Bhukti, or Antara of these top-ranked significator planets.`);
        }

        analysis += `*   **${lang === 'hi' ? 'घटना का समय' : 'Timing of Event'}:** ${timingText.trim()}\n`;


        const topScore = topSignificators[0][1];
        let eventConclusion = '';

        if (lang === 'hi') {
            if (eventType === 'positive') {
                if (topScore >= 10) eventConclusion = 'इस घटना के लिए अत्यधिक अनुकूल और मजबूत क्षमता का संकेत है।';
                else if (topScore >= 7) eventConclusion = 'इस घटना के लिए एक मजबूत क्षमता है, जो अनुकूल परिणाम का वादा करती है।';
                else if (topScore >= 4) eventConclusion = 'एक अनुकूल दृष्टिकोण है, लेकिन इसमें कुछ प्रयास या मामूली देरी शामिल हो सकती है।';
                else eventConclusion = 'यह घटना संभव है, लेकिन इसमें बाधाएं, देरी या महत्वपूर्ण प्रयास की आवश्यकता हो सकती है।';
            } else { // negative event
                if (topScore >= 10) eventConclusion = 'इस क्षेत्र में महत्वपूर्ण चुनौतियों का सामना करने की प्रबल संभावना है। सावधानी बरतने की सलाह दी जाती है।';
                else if (topScore >= 7) eventConclusion = 'इस क्षेत्र में कुछ चुनौतियों का संकेत है। आपको सचेत रहना चाहिए।';
                else if (topScore >= 4) eventConclusion = 'मामूली बाधाएं आ सकती हैं, लेकिन उन्हें प्रयास से दूर किया जा सकता है।';
                else eventConclusion = 'इस क्षेत्र में चुनौतियों की क्षमता कम है, जो एक आसान मार्ग का संकेत देती है।';
            }
        } else { // English
            if (eventType === 'positive') {
                if (topScore >= 10) eventConclusion = 'Excellent potential for a highly favorable event.';
                else if (topScore >= 7) eventConclusion = 'Strong potential for a favorable event.';
                else if (topScore >= 4) eventConclusion = 'Favorable outlook, but may involve some effort or minor delays.';
                else eventConclusion = 'The event is possible, but likely with obstacles, delays, or requiring significant effort.';
            } else { // negative event
                if (topScore >= 10) eventConclusion = 'There is a strong potential for significant challenges in this area. Caution is advised.';
                else if (topScore >= 7) eventConclusion = 'Indicates some challenges in this area. You should remain mindful.';
                else if (topScore >= 4) eventConclusion = 'Minor obstacles may arise but can be overcome with effort.';
                else eventConclusion = 'The potential for challenges in this area is low, indicating a smoother path.';
            }
        }
        analysis += `*   **${lang === 'hi' ? 'निष्कर्ष' : 'Conclusion'}:** ${eventConclusion}\n\n`;
    } else {
        analysis += `**${translatedEvent}:** ${lang === 'hi' ? 'इस घटना के लिए कोई महत्वपूर्ण ज्योतिषीय कारक नहीं मिला।' : 'No significant astrological drivers found for this event.'}\n\n`;
    }
    return analysis;
}


function generateHouseSummary(houseNumber, significators, planetDetailsMap, lang) {
    const themes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    const houseTheme = themes[houseNumber];

    const positive = [];
    const negative = [];
    const neutral = [];

    significators.forEach(p => {
        const planetDetail = planetDetailsMap.get(p);
        const dignity = planetDetail?.avasthas?.dignity || 'Unknown';
        const planetName = getPlanetName(p, lang);
        if (['Exalted', 'Own Sign', 'Friend', 'Moolatrikona'].includes(dignity)) {
            positive.push(planetName);
        } else if (['Debilitated', 'Enemy'].includes(dignity)) {
            negative.push(planetName);
        } else {
            neutral.push(planetName);
        }
    });

    if (positive.length === 0 && negative.length === 0 && neutral.length === 0) {
        return '';
    }

    let summary = `**${lang === 'hi' ? 'भाव ' + houseNumber : 'House ' + houseNumber} (${houseTheme}):** `;
    
    let parts = [];

    if (positive.length > 0) {
        const part = (lang === 'hi' ? 
            `यह भाव ${positive.join(' और ')} से मजबूत समर्थन प्राप्त करता है, जो सकारात्मक ऊर्जा और उत्पादक प्रयासों का संकेत देता है।` :
            `This house receives strong support from **${positive.join(' and ')}**, indicating positive energy and productive efforts.`
        );
        parts.push(part);
    }

    if (negative.length > 0) {
        const part = (lang === 'hi' ?
            `${negative.join(' और ')} द्वारा चुनौतियां पेश की जा सकती हैं, जो घर्षण या बाधाओं का सुझाव देती हैं।` :
            `Challenges may be presented by **${negative.join(' and ')}**, suggesting friction or obstacles.`
        );
        parts.push(part);
    }
    
    if (neutral.length > 0) {
        const part = (lang === 'hi' ?
            `का प्रभाव तटस्थ है, और परिणाम अन्य ग्रहों के प्रभाव पर निर्भर करेगा।` :
            `The influence of **${neutral.join(' and ')}** is neutral, and outcomes will depend on other planetary influences.`
        );
        parts.push(part);
    }

    summary += parts.join(' ');

    // Add overall assessment
    if (positive.length > negative.length) {
        summary += (lang === 'hi' ? ' कुल मिलाकर, इस भाव में एक सकारात्मक झुकाव है।' : ' Overall, this house has a positive leaning.');
    } else if (negative.length > positive.length) {
        summary += (lang === 'hi' ? ' कुल मिलाकर, इस भाव को चुनौतियों का सामना करना पड़ सकता है।' : ' Overall, this house may face challenges.');
    } else {
        summary += (lang === 'hi' ? ' कुल मिलाकर, यह भाव एक मिश्रित प्रभाव दिखाता है।' : ' Overall, this house shows a mixed influence.');
    }

    summary += (lang === 'hi' ?
        ` इन ग्रहों की दशा/अंतर्दशा के दौरान प्रभाव सबसे प्रमुख होंगे।` :
        ` The effects will be most prominent during the Dasha/Antardasha of these planets.`
    );

    return summary + '\n\n';
}

export function getKpAnalysis(payload = {}, lang = 'en') {
    const { kpSignificators, planetDetails } = payload;
    if (!kpSignificators || !kpSignificators.overview || !kpSignificators.detailedPlanets || !planetDetails) {
        return lang === 'hi' ? 'केपी विश्लेषण के लिए अपर्याप्त डेटा।' : 'Insufficient data for KP analysis.';
    }

    const { overview, detailedPlanets } = kpSignificators;
    const houseThemes = lang === 'hi' ? houseThemes_hi : houseThemes_en;
    
    const dignity_hi = {
        'Exalted': 'उच्च', 'Own Sign': 'स्वराशि', Friend: 'मित्र', Neutral: 'सम',
        Enemy: 'शत्रु', Debilitated: 'नीच', Unknown: 'अज्ञात', Moolatrikona: 'मूलत्रिकोण'
    };

    const planetDetailsMap = new Map(detailedPlanets.map(p => [p.name, p]));

    let analysisText = '';

    analysisText += lang === 'hi' ? '### केपी कारक विश्लेषण\n\n' : '### KP Significator Analysis\n\n';

    analysisText += lang === 'hi' ? '**भाव कारक विश्लेषण:**\n' : '**Cusp Significators Analysis:**\n';
    analysisText += lang === 'hi'
        ? 'यह खंड बताता है कि प्रत्येक भाव (जीवन का क्षेत्र) के लिए परिणाम देने के लिए कौन से ग्रह सशक्त हैं। जब इन ग्रहों की दशा/अंतर्दशा सक्रिय होती है, तो उस भाव से संबंधित घटनाएं प्रकट हो सकती हैं।\n\n'
        : 'This section identifies the planets influencing each area of your life (house). When a planet’s period (Dasha/Antardasha) is active, you can expect events related to the houses it signifies.\n\n';

    for (let i = 1; i <= 12; i++) {
        const significators = overview.cusps[i] || [];
        if (significators.length > 0) {
            analysisText += generateHouseSummary(i, significators, planetDetailsMap, lang);
        }
    }

    analysisText += lang === 'hi' ? '\n**ग्रह कारक विश्लेषण:**\n' : '\n**Planet Significators Analysis:**\n';
    analysisText += lang === 'hi'
        ? 'यह खंड दिखाता है कि प्रत्येक ग्रह किन भावों का कारक है। जब किसी ग्रह की दशा या अंतर्दशा सक्रिय होती है, तो वह उन भावों से संबंधित परिणाम देगा जिनका वह प्रतिनिधित्व करता है।\n\n'
        : 'This section details which life areas (houses) each planet influences. During a planet’s period (Dasha/Antardasha), it will deliver results related to the houses it signifies.\n\n';

    const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    planetOrder.forEach(planet => {
        if (overview.planets[planet]) {
            const signifiedHouses = overview.planets[planet] || [];
            const planetDetail = planetDetailsMap.get(planet);
            const dignity = planetDetail?.avasthas?.dignity || 'Unknown';
            const translatedDignity = lang === 'hi' ? (dignity_hi[dignity] || dignity) : dignity;
            
            const detailedDescription = getPlanetSignificatorDetailedDescription(planet, dignity, signifiedHouses, lang);
            analysisText += `**${getPlanetName(planet, lang)} (${translatedDignity}):** ${detailedDescription}\n`;
        }
    });

    const synthesisHeader = lang === 'hi' ? '\n**संश्लेषण और मुख्य भविष्यवाणियां:**\n' : '\n**Synthesis & Key Predictions:**\n';
    const synthesisIntroText = lang === 'hi' 
        ? 'आपके चार्ट में प्रमुख जीवन की घटनाओं के लिए ज्योतिषीय क्षमता का विश्लेषण नीचे दिया गया है। ये भविष्यवाणियां शीर्ष कारक ग्रहों के स्कोर पर आधारित हैं। **एक उच्च स्कोर उस घटना पर उस ग्रह से एक मजबूत प्रभाव का संकेत देता है।**\n\n'
        : 'The astrological potential for major life events in your chart is analyzed below. These predictions are based on the scores of the top significator planets. **A higher score indicates a stronger influence from that planet on the event.**\n\n';
    
    analysisText += synthesisHeader + synthesisIntroText;

    analysisText += rankSignificators('Marriage', 'positive', [2, 7, 11], 'Venus', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Career/Profession', 'positive', [2, 6, 10, 11], 'Saturn', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Child Birth', 'positive', [2, 5, 11], 'Jupiter', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Higher Education', 'positive', [4, 5, 9], 'Jupiter', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Property & Vehicle Purchase', 'positive', [4, 11, 12], 'Mars', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Foreign Travel', 'positive', [9, 12, 7], 'Rahu', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Health & Sickness', 'negative', [6, 8, 12], 'Saturn', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Spiritual Progress', 'positive', [5, 9, 12], 'Jupiter', kpSignificators, planetDetailsMap, lang);
    analysisText += rankSignificators('Success in Litigation', 'positive', [6, 11], 'Mars', kpSignificators, planetDetailsMap, lang);

    if (lang === 'hi') {
        detailedPlanets.forEach(planet => {
            if (planet.avasthas && planet.avasthas.dignity) {
                planet.avasthas.dignity = dignity_hi[planet.avasthas.dignity] || planet.avasthas.dignity;
            }
        });
    }

    return {
        analysisText: analysisText,
        kpSignificatorsData: detailedPlanets, // This is the data needed for the grid
        kpSignificatorsOverview: overview, // This might also be useful
    };
}
