/**
 * Formats a number to one decimal place
 * @param value - The number to format
 * @returns The formatted number as a string with one decimal place
 */
export const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.0';
    if (typeof value !== 'number' || isNaN(value)) return '0.0';
    return value.toFixed(1);
}; 