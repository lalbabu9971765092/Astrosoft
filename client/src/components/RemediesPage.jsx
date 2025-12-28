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

    const handlePdfDownload = (mantraText, title, fileName) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        root.render(<Mantra text={mantraText} title={title} />);

        setTimeout(() => {
            html2canvas(container).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
                                        handlePdfDownload(t(remedyKeys.vedicMantra), t('remediesPage.vedicMantraLabel'), `${selectedPlanet.toLowerCase()}_vedic.pdf`);
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
                                        handlePdfDownload(t(remedyKeys.beejaMantra), t('remediesPage.beejaMantraLabel'), `${selectedPlanet.toLowerCase()}_beeja.pdf`);
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
                                        handlePdfDownload(t(remedyKeys.stuti), t('remediesPage.stutiLabel'), `${selectedPlanet.toLowerCase()}_stuti.pdf`);
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
