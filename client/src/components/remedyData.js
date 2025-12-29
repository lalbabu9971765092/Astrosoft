// src/remedyData.js (or similar file)

export const PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const PLANET_REMEDY_KEYS = {
    Sun: {
        vedicMantra: 'remedies.Sun.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/sun_vedic.pdf', // <-- Add PDF path
        beejaMantra: 'remedies.Sun.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/sun_beeja.pdf', // <-- Add PDF path
        gemstone: 'remedies.Sun.gemstone',
        metal: 'remedies.Sun.metal',
        herb: 'remedies.Sun.herb',
        charity: 'remedies.Sun.charity',
        stuti: 'remedies.Sun.stuti',
        stutiPdf: '/pdf/mantras/sun_aditya_hridaya.pdf', // <-- Add PDF path (e.g., Aditya Hridaya)
        fullStutiPathHi: '/stutis/sun_aditya_hridaya_hi.txt', // Path to full stuti in Hindi
        fullStutiPathEn: '/stutis/sun_aditya_hridaya_en.txt', // Path to full stuti in English transliteration
        deity: 'remedies.Sun.deity',
        other: 'remedies.Sun.other'
    },
    Moon: {
        vedicMantra: 'remedies.Moon.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/moon_vedic.pdf', // <-- Add PDF path
        beejaMantra: 'remedies.Moon.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/moon_beeja.pdf', // <-- Add PDF path
        gemstone: 'remedies.Moon.gemstone',
        metal: 'remedies.Moon.metal',
        herb: 'remedies.Moon.herb',
        charity: 'remedies.Moon.charity',
        stuti: 'remedies.Moon.stuti',
        stutiPdf: '/pdf/mantras/moon_shiva_stuti.pdf', // <-- Add PDF path (e.g., Shiva Stuti)
        fullStutiPathHi: '/stutis/moon_shiva_stuti_hi.txt',
        fullStutiPathEn: '/stutis/moon_shiva_stuti_en.txt',
        deity: 'remedies.Moon.deity',
        other: 'remedies.Moon.other'
    },
    // ... Add similar *_Pdf keys for Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu ...
    // Make sure the paths point to your actual PDF files in the public folder.
    Mars: {
        vedicMantra: 'remedies.Mars.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/mars_vedic.pdf',
        beejaMantra: 'remedies.Mars.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/mars_beeja.pdf',
        gemstone: 'remedies.Mars.gemstone',
        metal: 'remedies.Mars.metal',
        herb: 'remedies.Mars.herb',
        charity: 'remedies.Mars.charity',
        stuti: 'remedies.Mars.stuti',
        stutiPdf: '/pdf/mantras/mars_hanuman_chalisa.pdf', // Example
        fullStutiPathHi: '/stutis/mars_hanuman_chalisa_hi.txt',
        fullStutiPathEn: '/stutis/mars_hanuman_chalisa_en.txt',
        deity: 'remedies.Mars.deity',
        other: 'remedies.Mars.other'
    },
     Mercury: {
        vedicMantra: 'remedies.Mercury.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/mercury_vedic.pdf',
        beejaMantra: 'remedies.Mercury.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/mercury_beeja.pdf',
        gemstone: 'remedies.Mercury.gemstone',
        metal: 'remedies.Mercury.metal',
        herb: 'remedies.Mercury.herb',
        charity: 'remedies.Mercury.charity',
        stuti: 'remedies.Mercury.stuti',
        stutiPdf: '/pdf/mantras/mercury_vishnu_sahasranama.pdf', // Example
        fullStutiPathHi: '/stutis/mercury_budha_stotram_hi.txt',
        fullStutiPathEn: '/stutis/mercury_budha_stotram_en.txt',
        deity: 'remedies.Mercury.deity',
        other: 'remedies.Mercury.other'
    },
    Jupiter: {
        vedicMantra: 'remedies.Jupiter.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/jupiter_vedic.pdf',
        beejaMantra: 'remedies.Jupiter.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/jupiter_beeja.pdf',
        gemstone: 'remedies.Jupiter.gemstone',
        metal: 'remedies.Jupiter.metal',
        herb: 'remedies.Jupiter.herb',
        charity: 'remedies.Jupiter.charity',
        stuti: 'remedies.Jupiter.stuti',
        stutiPdf: '/pdf/mantras/jupiter_guru_stotra.pdf', // Example
        fullStutiPathHi: '/stutis/jupiter_guru_stotram_hi.txt',
        fullStutiPathEn: '/stutis/jupiter_guru_stotram_en.txt',
        deity: 'remedies.Jupiter.deity',
        other: 'remedies.Jupiter.other'
    },
    Venus: {
        vedicMantra: 'remedies.Venus.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/venus_vedic.pdf',
        beejaMantra: 'remedies.Venus.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/venus_beeja.pdf',
        gemstone: 'remedies.Venus.gemstone',
        metal: 'remedies.Venus.metal',
        herb: 'remedies.Venus.herb',
        charity: 'remedies.Venus.charity',
        stuti: 'remedies.Venus.stuti',
        stutiPdf: '/pdf/mantras/venus_shri_suktam.pdf', // Example
        fullStutiPathHi: '/stutis/venus_shukra_stotram_hi.txt',
        fullStutiPathEn: '/stutis/venus_shukra_stotram_en.txt',
        deity: 'remedies.Venus.deity',
        other: 'remedies.Venus.other'
    },
    Saturn: {
        vedicMantra: 'remedies.Saturn.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/saturn_vedic.pdf',
        beejaMantra: 'remedies.Saturn.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/saturn_beeja.pdf',
        gemstone: 'remedies.Saturn.gemstone',
        metal: 'remedies.Saturn.metal',
        herb: 'remedies.Saturn.herb',
        charity: 'remedies.Saturn.charity',
        stuti: 'remedies.Saturn.stuti',
        stutiPdf: '/pdf/mantras/saturn_shani_stotra.pdf', // Example
        fullStutiPathHi: '/stutis/saturn_shani_stotram_hi.txt',
        fullStutiPathEn: '/stutis/saturn_shani_stotram_en.txt',
        deity: 'remedies.Saturn.deity',
        other: 'remedies.Saturn.other'
    },
    Rahu: {
        vedicMantra: 'remedies.Rahu.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/rahu_vedic.pdf',
        beejaMantra: 'remedies.Rahu.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/rahu_beeja.pdf',
        gemstone: 'remedies.Rahu.gemstone',
        metal: 'remedies.Rahu.metal',
        herb: 'remedies.Rahu.herb',
        charity: 'remedies.Rahu.charity',
        stuti: 'remedies.Rahu.stuti',
        stutiPdf: '/pdf/mantras/rahu_durga_saptashati.pdf', // Example
        fullStutiPathHi: '/stutis/rahu_kalabhairava_ashtakam_hi.txt',
        fullStutiPathEn: '/stutis/rahu_kalabhairava_ashtakam_en.txt',
        deity: 'remedies.Rahu.deity',
        other: 'remedies.Rahu.other'
    },
    Ketu: {
        vedicMantra: 'remedies.Ketu.vedicMantra',
        vedicMantraPdf: '/pdf/mantras/ketu_vedic.pdf',
        beejaMantra: 'remedies.Ketu.beejaMantra',
        beejaMantraPdf: '/pdf/mantras/ketu_beeja.pdf',
        gemstone: 'remedies.Ketu.gemstone',
        metal: 'remedies.Ketu.metal',
        herb: 'remedies.Ketu.herb',
        charity: 'remedies.Ketu.charity',
        stuti: 'remedies.Ketu.stuti',
        stutiPdf: '/pdf/mantras/ketu_ganesha_stotra.pdf', // Example
        fullStutiPathHi: '/stutis/ketu_ganesha_ashtakam_hi.txt',
        fullStutiPathEn: '/stutis/ketu_ganesha_ashtakam_en.txt',
        deity: 'remedies.Ketu.deity',
        other: 'remedies.Ketu.other'
    }
};
