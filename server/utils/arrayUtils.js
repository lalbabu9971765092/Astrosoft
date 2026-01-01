// server/utils/arrayUtils.js

/**
 * Generates all combinations of a certain size from an array.
 * @param {Array} array - The source array.
 * @param {number} size - The size of each combination.
 * @returns {Array<Array>} An array of combinations.
 */
export function getCombinations(array, size) {
    const result = [];
    function combine(startIndex, currentCombination) {
        if (currentCombination.length === size) {
            result.push([...currentCombination]);
            return;
        }
        if (startIndex >= array.length) {
            return;
        }
        for (let i = startIndex; i < array.length; i++) {
            currentCombination.push(array[i]);
            combine(i + 1, currentCombination);
            currentCombination.pop();
        }
    }
    combine(0, []);
    return result;
}
