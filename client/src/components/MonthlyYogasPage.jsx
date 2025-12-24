
// src/components/MonthlyYogasPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from './api';
import moment from 'moment-timezone';

const MonthlyYogasPage = () => {
    const { t } = useTranslation();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [yogas, setYogas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCalculate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setYogas([]);

        try {
            const payload = {
                year,
                month,
                latitude: 28.6139, // Default to Delhi
                longitude: 77.2090, // Default to Delhi
            };
            const response = await api.post('/calculate-monthly-yogas', payload);
            setYogas(response.data);
        } catch (err) {
            console.error("Error fetching monthly yogas:", err);
            setError(err.response?.data?.error || err.message || t('monthlyYogasPage.fetchError'));
        } finally {
            setIsLoading(false);
        }
    }, [year, month, t]);

    // Call handleCalculate on component mount
    useEffect(() => {
        handleCalculate();
    }, [handleCalculate]); // Dependency array includes handleCalculate

    return (
        <div className="monthly-yogas-page">
            <h1 className="page-title">{t('monthlyYogasPage.pageTitle')}</h1>
            <div className="input-form">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
                    <div className="form-group">
                        <label htmlFor="year">{t('monthlyYogasPage.year')}</label>
                        <input
                            type="number"
                            id="year"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            style={{ width: '80px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="month">{t('monthlyYogasPage.month')}</label>
                        <select
                            id="month"
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            style={{ width: '120px' }}
                        >
                            {moment.months().map((m, i) => (
                                <option key={i + 1} value={i + 1}>
                    {t(`months.${m}`, { defaultValue: m })}
                </option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleCalculate} disabled={isLoading} style={{ padding: '10px 20px' }}>
                        {isLoading ? t('monthlyYogasPage.loading') : t('monthlyYogasPage.calculate')}
                    </button>
                </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            {yogas.length > 0 && (
                <div className="results-table-container">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>{t('monthlyYogasPage.date')}</th>
                                <th>{t('monthlyYogasPage.day')}</th>
                                <th>{t('monthlyYogasPage.nakshatra')}</th>
                                <th>{t('monthlyYogasPage.yogaName')}</th>
                                <th>{t('monthlyYogasPage.startTime')}</th>
                                <th>{t('monthlyYogasPage.endTime')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yogas.map((yoga, index) => (
                                <tr key={index} className={yoga.type === 'auspicious' ? 'yoga-auspicious' : 'yoga-inauspicious'}>
                                    <td>{moment(yoga.date).format('YYYY-MM-DD')}</td>
                                    <td>{t(`weekdays.${yoga.day}`)}</td>
                                    <td>{t(`nakshatras.${yoga.nakshatra}`)}</td>
                                    <td>{t(`yogas.${yoga.name}_name`, { defaultValue: yoga.name })}</td>
                                    <td>{moment(yoga.start).format('HH:mm:ss')}</td>
                                    <td>{moment(yoga.end).format('HH:mm:ss')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MonthlyYogasPage;
