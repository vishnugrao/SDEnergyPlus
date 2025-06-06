/**
 * Rounds a number to one decimal place
 * @param value - The number to round
 * @returns The rounded number
 */
export const roundToOneDecimal = (value: number): number => {
    return Math.round(value * 10) / 10;
};

/**
 * Formats a number to one decimal place with proper localization
 * @param value - The number to format
 * @returns The formatted number string
 */
export const formatToOneDecimal = (value: number): string => {
    return roundToOneDecimal(value).toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}; 