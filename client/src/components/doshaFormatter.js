import React from 'react';

/**
 * Translates a dynamic reason string by parsing it and reconstructing it with translated parts.
 * @param {string} reason - The English reason string from the API.
 * @param {function} t - The translation function from i18next.
 * @returns {string} The translated reason string.
 */
const translateReasonString = (doshaData, t) => {
    if (!doshaData || (!doshaData.reason_key && !doshaData.reason)) {
        return '';
    }

    // If we have a reason_key, use the structured translation
    if (doshaData.reason_key) {
        const { reason_key, details } = doshaData;
        const options = {};

        if (details) {
            // Translate planet names
            if (details.planet) {
                options[0] = t(`planets.${details.planet}`, { defaultValue: details.planet });
            }
            // Handle house numbers
            if (details.houses) {
                options[1] = Array.isArray(details.houses) ? details.houses.join(', ') : details.houses;
            }
            // Handle and translate sources
            if (details.sources && Array.isArray(details.sources)) {
                 const translatedSources = details.sources.map(s => t(`doshaSources.${s}`, { defaultValue: s }));
                 if (translatedSources.length > 1) {
                    const lastElement = translatedSources.pop();
                    options[2] = translatedSources.join(', ') + ` ${t('utils.or', 'or')} ` + lastElement;
                 } else {
                    options[2] = translatedSources[0] || '';
                 }
            }
             // Generic details for other patterns
             if (details.nakshatra) {
                options[1] = t(`nakshatras.${details.nakshatra}`, { defaultValue: details.nakshatra });
             }
             if (details.axis) {
                 options[1] = details.axis;
             }
             if (details.planet_list) {
                 options[0] = details.planet_list;
             }
        }

        return t(`doshaReasons.${reason_key}`, options);
    }
    
    // Fallback to the old sentence parsing if reason_key is not available
    const reason = doshaData.reason;
    const sentences = reason.split('.').map(s => s.trim()).filter(s => s.length > 0);

    const translatedSentences = sentences.map(sentence => {
        // This part remains as a fallback for old data structure
        let match = sentence.match(/(Mars|Sun|Moon|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in house (\d+) \(by Rashi count\) from (Ascendant|Moon|Venus)/i);
        if (match) {
            const options = { 0: t(`planets.${match[1]}`), 1: match[2], 2: t(`doshaSources.${match[3]}`) };
            return t('doshaReasons.planetInHouseFromRashi', options);
        }
        match = sentence.match(/(Mars|Sun|Moon|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in house (\d+) from (Ascendant|Moon|Venus)/i);
        if (match) {
            const options = { 0: t(`planets.${match[1]}`), 1: match[2], 2: t(`doshaSources.${match[3]}`) };
            return t('doshaReasons.planetInHouseFrom', options);
        }
        if (/Planets are found on both sides of the Rahu-Ketu axis/i.test(sentence)) {
            return t('doshaReasons.planetsBothSidesRahuKetu');
        }
        match = sentence.match(/Moon is in ([\w\s]+), which is not a Gand Mool Nakshatra/i);
        if (match) {
            const options = { 0: t('planets.Moon'), 1: t(`nakshatras.${match[1].trim()}`) };
            return t('doshaReasons.moonNotInGandMool', options);
        }
        match = sentence.match(/Moon is in ([\w\s]+), which is a Gand Mool Nakshatra/i);
        if (match) {
            const options = { 0: t('planets.Moon'), 1: t(`nakshatras.${match[1].trim()}`) };
            return t('doshaReasons.moonInGandMool', options);
        }
        match = sentence.match(/(Mars) not found in dosha-causing houses \((.*?)\) from (.*)/i);
        if (match) {
            const sources = match[3].split(/, | or /).map(s => t(`doshaSources.${s.trim()}`, {defaultValue: s.trim()})).join(', ');
            return t('doshaReasons.planetNotFoundInHousesFrom', { 0: t(`planets.${match[1]}`), 1: match[2], 2: sources });
        }
        match = sentence.match(/All planets \((.*?)\) are located between (Ketu->Rahu|Rahu->Ketu)/i);
        if (match) {
            return t('doshaReasons.allPlanetsBetweenAxis', { 0: match[1], 1: match[2] });
        }
        return sentence; // Fallback
    });
    return translatedSentences.join('. ');
};
/**
 * Formats complex dosha information for display.
 * @param {string} doshaKey - The key for the dosha (e.g., 'mangal', 'kaalsarpa', 'mool').
 * @param {object} birthDoshas - The complete doshas object from the API response.
 * @param {function} t - The translation function from i18next.
 * @returns {React.ReactNode} A formatted and translated JSX element for display.
 */
export const formatDosha = (doshaKey, birthDoshas, t) => {
    if (!birthDoshas || !birthDoshas[doshaKey]) {
        return <span className="dosha-status dosha-na">{t('astrologyForm.doshaStatusNA', 'N/A')}</span>;
    }

    const doshaData = birthDoshas[doshaKey];

    if (doshaData.error) {
        return <span className="dosha-status dosha-error">{t('astrologyForm.doshaStatusError', 'Error')}</span>;
    }

    // Pass the entire doshaData object to the translator
    const reasonText = (doshaData.reason || doshaData.reason_key) ? ` (${translateReasonString(doshaData, t)})` : '';

    if (!doshaData.present) {
        return (
            <span className="dosha-status dosha-absent">
                {t('astrologyForm.doshaStatusAbsent', 'Absent')}
                <span className="dosha-reason">{reasonText}</span>
            </span>
        );
    }

    const cancellationText = (doshaData.cancellation && doshaData.cancellation.length > 0)
        ? ` (${t('astrologyForm.doshaCancelledLabel', 'Cancelled')}: ${
            doshaData.cancellation.map(cancellation => translateReasonString(cancellation, t)).join(', ')
          })`
        : '';

    return (
        <span className="dosha-status dosha-present">
            {t('astrologyForm.doshaStatusPresent', 'Present')}
            <span className="dosha-reason">{reasonText}</span>
            <span className="dosha-cancellation">{cancellationText}</span>
        </span>
    );
};