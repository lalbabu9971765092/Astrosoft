// src/RemediesPage.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../i18n'; // Import i18n instance
// Import the keys object instead of the remedies object
import { PLANET_REMEDY_KEYS, PLANET_NAMES } from './remedyData';
import Mantra from './Mantra';
import FullStutiPdfContent from './FullStutiPdfContent';
import '../styles/RemediesPage.css';

// Optional: Import a download icon if you have one
// import { FaDownload } from 'react-icons/fa';

const RemediesPage = () => {
    const { t } = useTranslation();
    // Create a translation function that always returns English translations
    const tEn = i18n.getFixedT('en', 'translation');

    const [selectedPlanet, setSelectedPlanet] = useState('Sun'); // Default to Sun key

    const handlePlanetChange = (event) => {
        setSelectedPlanet(event.target.value);
    };

    const handlePdfDownload = async (mantraKey, title, fileName, isFullStuti = false) => {
        let textHi = '';
        let textEn = '';
        let componentToRender = Mantra;

        if (isFullStuti) {
            const hiPath = remedyKeys.fullStutiPathHi;
            const enPath = remedyKeys.fullStutiPathEn;

            if (!hiPath || !enPath) {
                alert('Full Stuti paths not defined for this planet.');
                return;
            }

            try {
                const [hiResponse, enResponse] = await Promise.all([
                    fetch(hiPath),
                    fetch(enPath)
                ]);

                if (!hiResponse.ok || !enResponse.ok) {
                    throw new Error('Failed to fetch full stuti text.');
                }

                textHi = await hiResponse.text();
                textEn = await enResponse.text();
                componentToRender = FullStutiPdfContent; // Use the new component for full stuti
            } catch (error) {
                console.error('Error fetching full stuti text:', error);
                alert('Failed to download full Stuti. Please try again.');
                return;
            }
        } else {
            textHi = t(mantraKey, { lng: 'hi' });
            textEn = tEn(mantraKey);
            componentToRender = Mantra;
        }


        const container = document.createElement('div');
        container.style.width = '210mm'; // A4 width
        container.style.padding = '10mm';
        container.style.boxSizing = 'border-box';
        container.style.backgroundColor = 'white';
        container.style.position = 'absolute';
        container.style.left = '-9999px'; // Hide it off-screen
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(React.createElement(componentToRender, { textHi, textEn, title }));

        // Allow a small delay for rendering to complete
        setTimeout(() => {
            html2canvas(container, { scale: 2 }).then(canvas => { // Scale for better resolution
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                let heightLeft = pdfHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                }

                pdf.save(fileName);
                document.body.removeChild(container);
            });
        }, 500); // Small delay to ensure rendering
    };


    // Get the object containing the *keys* and *PDF paths* for the selected planet
    const remedyKeys = PLANET_REMEDY_KEYS[selectedPlanet];
    // Get the translated name for the selected planet
    const translatedSelectedPlanetName = t(`planets.${selectedPlanet}`, { defaultValue: selectedPlanet });

    return (
        <div className="remedies-page">
            <h1>{t('remediesPage.pageTitle')}</h1>

            {/* Planet Selection Dropdown */}
            <div className="remedy-controls form-row">
                <div className="input-group">
                    <label htmlFor="planet-select">{t('remediesPage.selectPlanetLabel')}</label>
                    <select
                        id="planet-select"
                        value={selectedPlanet} // Value is the key ("Sun", "Moon", etc.)
                        onChange={handlePlanetChange}
                    >
                        {PLANET_NAMES.map(planetKey => (
                            <option key={planetKey} value={planetKey}>
                                {/* Translate the display name */}
                                {t(`planets.${planetKey}`, { defaultValue: planetKey })}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Display Remedies using t() with the keys */}
            {remedyKeys ? (
                <div className="remedy-details result-section">
                    <h2 className="result-sub-title">{t('remediesPage.remediesForTitle', { planetName: translatedSelectedPlanetName })}</h2>

                    {/* Vedic Mantra */}
                    {remedyKeys.vedicMantra && (
                        <div className="remedy-item">
                            <div className="remedy-header">
                                <strong>{t('remediesPage.vedicMantraLabel')}</strong>
                                {/* Add Download Link */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePdfDownload(remedyKeys.vedicMantra, t('remediesPage.vedicMantraLabel'), `${selectedPlanet.toLowerCase()}_vedic.pdf`);
                                    }}
                                    className="download-link"
                                    title={t('remediesPage.downloadPdf')}
                                >
                                    {t('remediesPage.downloadPdf')}
                                </button>
                            </div>
                            <p className="mantra-hi">{t(remedyKeys.vedicMantra, { lng: 'hi' })}</p>
                            <p className="mantra-en">
                                <i>English Transliteration: {tEn(remedyKeys.vedicMantra)}</i>
                            </p>
                        </div>
                    )}

                    {/* Beeja Mantra */}
                    {remedyKeys.beejaMantra && (
                        <div className="remedy-item">
                             <div className="remedy-header">
                                <strong>{t('remediesPage.beejaMantraLabel')}</strong>
                                {/* Add Download Link */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePdfDownload(remedyKeys.beejaMantra, t('remediesPage.beejaMantraLabel'), `${selectedPlanet.toLowerCase()}_beeja.pdf`);
                                    }}
                                    className="download-link"
                                    title={t('remediesPage.downloadPdf')}
                                >
                                    {t('remediesPage.downloadPdf')}
                                </button>
                            </div>
                            <p className="mantra-hi">{t(remedyKeys.beejaMantra, { lng: 'hi' })}</p>
                            <p className="mantra-en">
                                <i>English Transliteration: {tEn(remedyKeys.beejaMantra)}</i>
                            </p>
                        </div>
                    )}

                    {/* Stuti/Prayer */}
                    {remedyKeys.stuti && (
                        <div className="remedy-item">
                            <div className="remedy-header">
                                <strong>{t('remediesPage.stutiLabel')}</strong>
                                {/* Add Download Link */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePdfDownload(remedyKeys.stuti, t('remediesPage.stutiLabel'), `${selectedPlanet.toLowerCase()}_stuti.pdf`);
                                    }}
                                    className="download-link"
                                    title={t('remediesPage.downloadPdf')}
                                >
                                    {t('remediesPage.downloadPdf')}
                                </button>
                            </div>
                            <p className="mantra-hi">{t(remedyKeys.stuti, { lng: 'hi' })}</p>
                            <p className="mantra-en">
                                <i>English Transliteration: {tEn(remedyKeys.stuti)}</i>
                            </p>
                        </div>
                    )}

                    {/* Full Stuti (Aditya Hridaya Stotra) Download */}
                    {remedyKeys.fullStutiPathHi && remedyKeys.fullStutiPathEn && (
                         <div className="remedy-item">
                            <div className="remedy-header">
                                <strong>{t('remediesPage.fullStutiLabel', { defaultValue: 'Full Stuti' })}</strong>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePdfDownload(
                                            remedyKeys.stuti, // Pass the stuti key
                                            t(remedyKeys.stuti), // Use the translated stuti name as the title
                                            `${selectedPlanet.toLowerCase()}_full_stuti.pdf`,
                                            true // Indicate this is a full stuti download
                                        );
                                    }}
                                    className="download-link"
                                    title={t('remediesPage.downloadFullStutiPdf', { defaultValue: 'Download Full Stuti PDF' })}
                                >
                                    {t('remediesPage.downloadPdf')}
                                </button>
                            </div>
                            <p>{t('remediesPage.fullStutiDescription', { defaultValue: 'Download the complete text of the Stuti in both Hindi (Devanagari) and English Transliteration.'})}</p>
                        </div>
                    )}

                    {/* --- Other Remedies (No Download Links Needed) --- */}
                    {remedyKeys.gemstone && (
                        <div className="remedy-item">
                            <strong>{t('remediesPage.gemstoneLabel')}</strong>
                            <p>{t(remedyKeys.gemstone)}</p>
                        </div>
                    )}
                     {remedyKeys.metal && (
                        <div className="remedy-item">
                            <strong>{t('remediesPage.metalLabel')}</strong>
                            <p>{t(remedyKeys.metal)}</p>
                        </div>
                    )}
                    {remedyKeys.herb && (
                        <div className="remedy-item">
                            <strong>{t('remediesPage.herbLabel')}</strong>
                            <p>{t(remedyKeys.herb)}</p>
                        </div>
                    )}
                    {remedyKeys.charity && (
                        <div className="remedy-item">
                            <strong>{t('remediesPage.charityLabel')}</strong>
                            <p>{t(remedyKeys.charity)}</p>
                        </div>
                    )}
                     {remedyKeys.deity && (
                        <div className="remedy-item">
                            <strong>{t('remediesPage.deityLabel')}</strong>
                            <p>{t(remedyKeys.deity)}</p>
                        </div>
                    )}
                    {remedyKeys.other && (
                         <div className="remedy-item">
                            <strong>{t('remediesPage.otherLabel')}</strong>
                            <p>{t(remedyKeys.other)}</p>
                        </div>
                    )}

                </div>
            ) : (
                <p className="info-text">{t('remediesPage.selectPlanetPrompt')}</p>
            )}
        </div>
    );
};

export default RemediesPage;
