// src/RemediesPage.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// Import the keys object instead of the remedies object
import { PLANET_REMEDY_KEYS, PLANET_NAMES } from './remedyData';
import '../styles/RemediesPage.css';

// Optional: Import a download icon if you have one
// import { FaDownload } from 'react-icons/fa';

const RemediesPage = () => {
    const { t } = useTranslation();
    const [selectedPlanet, setSelectedPlanet] = useState('Sun'); // Default to Sun key

    const handlePlanetChange = (event) => {
        setSelectedPlanet(event.target.value);
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
                                {remedyKeys.vedicMantraPdf && (
                                    <a
                                        href={remedyKeys.vedicMantraPdf}
                                        download // Suggests downloading the file
                                        className="download-link"
                                        title={t('remediesPage.downloadPdf')}
                                        target="_blank" // Open in new tab/window
                                        rel="noopener noreferrer" // Security best practice
                                    >
                                        {/* <FaDownload /> Optional Icon */}
                                        {t('remediesPage.downloadPdf')}
                                    </a>
                                )}
                            </div>
                            <p>{t(remedyKeys.vedicMantra)}</p>
                        </div>
                    )}

                    {/* Beeja Mantra */}
                    {remedyKeys.beejaMantra && (
                        <div className="remedy-item">
                             <div className="remedy-header">
                                <strong>{t('remediesPage.beejaMantraLabel')}</strong>
                                {/* Add Download Link */}
                                {remedyKeys.beejaMantraPdf && (
                                    <a
                                        href={remedyKeys.beejaMantraPdf}
                                        download
                                        className="download-link"
                                        title={t('remediesPage.downloadPdf')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {t('remediesPage.downloadPdf')}
                                    </a>
                                )}
                            </div>
                            <p>{t(remedyKeys.beejaMantra)}</p>
                        </div>
                    )}

                    {/* Stuti/Prayer */}
                    {remedyKeys.stuti && (
                        <div className="remedy-item">
                            <div className="remedy-header">
                                <strong>{t('remediesPage.stutiLabel')}</strong>
                                {/* Add Download Link */}
                                {remedyKeys.stutiPdf && (
                                    <a
                                        href={remedyKeys.stutiPdf}
                                        download
                                        className="download-link"
                                        title={t('remediesPage.downloadPdf')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {t('remediesPage.downloadPdf')}
                                    </a>
                                )}
                            </div>
                            <p>{t(remedyKeys.stuti)}</p>
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
