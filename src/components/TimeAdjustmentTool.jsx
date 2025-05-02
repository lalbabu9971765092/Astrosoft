// src/TimeAdjustmentTool.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
// *** IMPORT THE NEW HELPER ***
import { formatToLocalISOString } from './AstrologyUtils';
import '../styles/TimeAdjustmentTool.css';

const TimeAdjustmentTool = ({
    initialDateTimeString,
    onDateTimeChange,
    label,
    showReset = true,
}) => {
    const { t } = useTranslation();
    const [currentDateTime, setCurrentDateTime] = useState(null); // Keep using Date object internally

    const displayLabel = label || t('timeAdjustmentTool.adjustTimeLabel', 'Adjust Time');

    useEffect(() => {
        if (initialDateTimeString) {
            // Try parsing with and without seconds for flexibility
            let initialDate = new Date(initialDateTimeString);
            if (isNaN(initialDate) && initialDateTimeString.length === 16) {
                 initialDate = new Date(`${initialDateTimeString}:00`);
            }

            if (!isNaN(initialDate)) {
                setCurrentDateTime(initialDate);
            } else {
                console.error("TimeAdjustmentTool: Invalid initialDateTimeString provided:", initialDateTimeString);
                setCurrentDateTime(null);
            }
        } else {
            setCurrentDateTime(null);
        }
    }, [initialDateTimeString]);

    const adjustTime = useCallback((amount, unit) => {
        if (!currentDateTime) return;
        const newDateTime = new Date(currentDateTime.getTime()); // Clone the date

       
        switch (unit) {
            case 'minute':
                // Use setTime for precise duration adjustment, avoiding DST issues for minutes
                newDateTime.setTime(newDateTime.getTime() + amount * 60 * 1000);
                break;
            case 'hour':
                 // Use setTime for precise duration adjustment, avoiding DST issues for hours
                newDateTime.setTime(newDateTime.getTime() + amount * 60 * 60 * 1000);
                break;
            // For larger units, setDate/Month/FullYear handle calendar complexities (month lengths, leap years)
            // and DST transitions reasonably well for day/month/year boundaries.
            case 'day': newDateTime.setDate(newDateTime.getDate() + amount); break;
            case 'month': newDateTime.setMonth(newDateTime.getMonth() + amount); break;
            case 'year': newDateTime.setFullYear(newDateTime.getFullYear() + amount); break; // Corrected typo: FullYear
            default: break;
        }

        setCurrentDateTime(newDateTime); // Update internal state

        if (onDateTimeChange) {
           // *** USE toISOString() FOR UNAMBIGUOUS UTC-BASED STRING ***
           const isoString = newDateTime.toISOString();
           if (isoString) {
               onDateTimeChange(isoString); // Pass the ISO 8601 UTC string
            }
        }
    }, [currentDateTime, onDateTimeChange]);

    const handleReset = () => {
        if (initialDateTimeString) {
             let initialDate = new Date(initialDateTimeString);
             if (isNaN(initialDate) && initialDateTimeString.length === 16) {
                 initialDate = new Date(`${initialDateTimeString}:00`);
             }
             if (!isNaN(initialDate)) {
                 setCurrentDateTime(initialDate);
                 if (onDateTimeChange) {
                     // *** USE toISOString() FOR UNAMBIGUOUS UTC-BASED STRING ***
                     const isoString = initialDate.toISOString();
                     if (isoString) {
                         onDateTimeChange(isoString); // Pass the ISO 8601 UTC string
                     }
                 }
             }
        }
    };

    // Display using toLocaleString is fine for the tool's internal display
    const displayDateTime = currentDateTime
        ? currentDateTime.toLocaleString()
        : t('timeAdjustmentTool.notAvailable', 'N/A');

    if (!initialDateTimeString) {
        return <div className="time-adjustment-tool-placeholder">{t('timeAdjustmentTool.waitingForInitialTime')}</div>;
    }
     if (!currentDateTime) {
        return <div className="time-adjustment-tool-placeholder error">{t('timeAdjustmentTool.invalidInitialTime')}</div>;
    }

    // JSX remains the same
    return (
        <div className="time-adjustment-tool">
            <h4 className="tool-label">{displayLabel}</h4>
            <p className="current-time-display">
                {t('timeAdjustmentTool.currentAdjustedTimeLabel')} <strong>{displayDateTime}</strong>
            </p>
            <div className="adjustment-controls">
                {/* Years Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.yearsLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'year')} title={t('timeAdjustmentTool.minus1YearTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'year')} title={t('timeAdjustmentTool.plus1YearTitle')}>+1</button>
                </div>
                {/* Months Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.monthsLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'month')} title={t('timeAdjustmentTool.minus1MonthTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'month')} title={t('timeAdjustmentTool.plus1MonthTitle')}>+1</button>
                </div>
                {/* Days Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.daysLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'day')} title={t('timeAdjustmentTool.minus1DayTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'day')} title={t('timeAdjustmentTool.plus1DayTitle')}>+1</button>
                </div>
                {/* Hours Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.hoursLabel')}</span>
                    <button onClick={() => adjustTime(-1, 'hour')} title={t('timeAdjustmentTool.minus1HourTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'hour')} title={t('timeAdjustmentTool.plus1HourTitle')}>+1</button>
                </div>
                {/* Minutes Group */}
                <div className="control-group">
                    <span className="unit-label">{t('timeAdjustmentTool.minutesLabel')}</span>
                    <button onClick={() => adjustTime(-10, 'minute')} title={t('timeAdjustmentTool.minus10MinTitle')}>-10</button>
                    <button onClick={() => adjustTime(-1, 'minute')} title={t('timeAdjustmentTool.minus1MinTitle')}>-1</button>
                    <button onClick={() => adjustTime(1, 'minute')} title={t('timeAdjustmentTool.plus1MinTitle')}>+1</button>
                    <button onClick={() => adjustTime(10, 'minute')} title={t('timeAdjustmentTool.plus10MinTitle')}>+10</button>
                </div>

                {/* Reset Button */}
                {showReset && (
                    <div className="control-group reset-group">
                        <button onClick={handleReset} className="reset-button" title={t('timeAdjustmentTool.resetButtonTitle')}>
                            {t('timeAdjustmentTool.resetButtonText')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

TimeAdjustmentTool.propTypes = {
    initialDateTimeString: PropTypes.string,
    onDateTimeChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    showReset: PropTypes.bool,
};

export default TimeAdjustmentTool;
