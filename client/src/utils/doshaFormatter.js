// client/src/utils/doshaFormatter.js

/**
 * Formats dosha information for display.
 * Can handle simple dosha values (Vata, Pitta, Kapha) or complex dosha objects (Mangal, Kaalsarpa, Mool).
 * @param {string|object} dosha - The dosha value or object.
 * @param {string} [doshaType] - Optional. The type of dosha (e.g., 'mangal', 'kaalsarpa', 'mool') if `dosha` is an object.
 * @returns {string} Formatted string for display.
 */
export const formatDosha = (dosha, doshaType = null) => {
  if (typeof dosha === 'object' && dosha !== null && doshaType) {
    // Handle complex dosha objects like Mangal, Kaalsarpa, Mool
    let result = dosha.present ? 'Present' : 'Not Present';
    if (dosha.present && dosha.reason) {
      result += ` (${dosha.reason.replace(/.$/, '')})`; // Remove trailing period if any
    }
    if (dosha.present && dosha.cancellation && dosha.cancellation.length > 0) {
      result += ` (Cancellations: ${dosha.cancellation.join(', ')})`;
    }
    return result;
  } else {
    // Handle simple dosha values (Vata, Pitta, Kapha)
    return String(dosha);
  }
};
