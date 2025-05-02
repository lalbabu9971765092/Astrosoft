// c:\Users\lalba\OneDrive\Desktop\Astro\astrology-app-frontend\src\components\TimeAdjustmentTool.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
// No longer need formatToLocalISOString here if parent handles final conversion
import '../styles/TimeAdjustmentTool.css';

const TimeAdjustmentTool = ({
    initialDateTimeString, // Used for initial load and reset
    value, // The current value controlled by the parent (ISO 8601 UTC string)
    onDateTimeChange,
    label,
    showReset = true, // Default to true as per original code, parent can override
}) => {
    const { t } = useTranslation();
    // Internal state should always be a Date object for reliable calculations
    const [currentDateTime, setCurrentDateTime] = useState(null);

    const displayLabel = label || t('timeAdjustmentTool.adjustTimeLabel', 'Adjust Time');

    // Effect 1: Initialize internal state from initialDateTimeString on mount/change
    useEffect(() => {
        if (initialDateTimeString) {
            // new Date() reliably parses ISO 8601 strings and YYYY-MM-DDTHH:MM:SS
            let initialDate = new Date(initialDateTimeString);
            // Fallback for potential YYYY-MM-DDTHH:MM format if needed
            if (isNaN(initialDate) && initialDateTimeString.length === 16) {
                 initialDate = new Date(`${initialDateTimeString}:00`);
            }

            if (!isNaN(initialDate)) {
                // Only set if different from current state to avoid unnecessary updates
                if (!currentDateTime || initialDate.getTime() !== currentDateTime.getTime()) {
                    setCurrentDateTime(initialDate);
                }
            } else {
                console.error("TimeAdjustmentTool: Invalid initialDateTimeString provided:", initialDateTimeString);
                setCurrentDateTime(null); // Set to null if invalid
            }
        } else {
            setCurrentDateTime(null); // Set to null if no initial string
        }
        // Intentionally only run when initialDateTimeString changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDateTimeString]);

    // Effect 2: Sync internal state when the external 'value' prop changes
    useEffect(() => {
        // This ensures the tool reflects updates passed down from the parent,
        // especially when it's used as a controlled component (like for birth time).
        if (value) {
            const valueDate = new Date(value); // value should be ISO string
            if (!isNaN(valueDate)) {
                // Only update if the internal date is different from the value prop date
                // This prevents potential infinite loops if parent updates based on our callback
                if (!currentDateTime || valueDate.getTime() !== currentDateTime.getTime()) {
                    setCurrentDateTime(valueDate);
                }
            } else {
                console.warn("TimeAdjustmentTool: Invalid value prop received", value);
            }
        }
        // Depend on 'value' to react to external changes.
        // Include currentDateTime to prevent loop if valueDate is same as currentDateTime.
    }, [value, currentDateTime]);

    // Callback to adjust the date/time using functional state update
    const adjustTime = useCallback((amount, unit) => {
        setCurrentDateTime(prevDateTime => { // Use functional update form
            if (!prevDateTime) return null; // Cannot adjust if no valid date

            const newDateTime = new Date(prevDateTime.getTime()); // Clone the previous state

            // Apply adjustments based on the cloned previous state
            switch (unit) {
                case 'minute':
                    // Use setTime for precise duration adjustment, avoiding DST issues
                    newDateTime.setTime(newDateTime.getTime() + amount * 60 * 1000);
                    break;
                case 'hour':
                     // Use setTime for precise duration adjustment, avoiding DST issues
                    newDateTime.setTime(newDateTime.getTime() + amount * 60 * 60 * 1000);
                    break;
                // For larger units, setDate/Month/FullYear handle calendar complexities
                case 'day': newDateTime.setDate(newDateTime.getDate() + amount); break;
                case 'month': newDateTime.setMonth(newDateTime.getMonth() + amount); break;
                case 'year': newDateTime.setFullYear(newDateTime.getFullYear() + amount); break;
                default: break;
            }

            // Call the parent callback *after* calculating the new state
            if (onDateTimeChange) {
                const isoString = newDateTime.toISOString(); // Use UTC ISO string for callback
                onDateTimeChange(isoString);
            }

            return newDateTime; // Return the new state value for React to update
        });
    // The callback depends on the onDateTimeChange function prop
    }, [onDateTimeChange]);

    // Reset handler - sets internal state back to the original initialDateTimeString
    const handleReset = useCallback(() => {
        if (initialDateTimeString) {
             let initialDate = new Date(initialDateTimeString);
             if (isNaN(initialDate) && initialDateTimeString.length === 16) {
                 initialDate = new Date(`${initialDateTimeString}:00`);
             }
             if (!isNaN(initialDate)) {
                 // Use functional update to set back to initialDate
                 setCurrentDateTime(prev => {
                     if (onDateTimeChange) {
                         // Also notify parent about the reset
                         const isoString = initialDate.toISOString();
                         onDateTimeChange(isoString);
                     }
                     return initialDate; // Return the initial date as the new state
                 });
             } else {
                 // Handle case where even the initial string is invalid on reset attempt
                 setCurrentDateTime(null);
                 if (onDateTimeChange) {
                     onDateTimeChange(null); // Notify parent of invalid state
                 }
             }
        } else {
            // If there was no initial string, reset means clearing the date
             setCurrentDateTime(null);
             if (onDateTimeChange) {
                 onDateTimeChange(null); // Notify parent
             }
        }
    // Depends on the initial string and the callback
    }, [initialDateTimeString, onDateTimeChange]);

    // Display using toLocaleString for user-friendliness in the tool's UI
    const displayDateTime = currentDateTime
        ? currentDateTime.toLocaleString() // Shows date/time in user's local timezone format
        : t('timeAdjustmentTool.notAvailable', 'N/A');

    // Conditional rendering based on state
    // Note: Checking initialDateTimeString might hide the tool initially if parent loads data async.
    // Consider showing a loading state or relying solely on currentDateTime check.
    // if (!initialDateTimeString) {
    //     return <div className="time-adjustment-tool-placeholder">{t('timeAdjustmentTool.waitingForInitialTime')}</div>;
    // }

    // If after initialization, the date is still null (due to invalid input), show error.
     if (!currentDateTime) {
        return <div className="time-adjustment-tool-placeholder error">{t('timeAdjustmentTool.invalidOrNoTime')}</div>;
    }

    // --- Render Logic ---
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
    // String used for initial load and reset (can be local format like YYYY-MM-DDTHH:MM:SS or ISO)
    initialDateTimeString: PropTypes.string,
    // The current value (ISO 8601 UTC string) passed down from parent for controlled behavior
    value: PropTypes.string,
    // Callback function receiving the updated date as an ISO 8601 UTC string
    onDateTimeChange: PropTypes.func.isRequired,
    // Optional label for the tool
    label: PropTypes.string,
    // Whether to display the reset button
    showReset: PropTypes.bool,
};

export default TimeAdjustmentTool;
