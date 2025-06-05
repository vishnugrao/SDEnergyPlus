interface CommercialProperty {
    squareFootage: number;
    pricePerSqFt: number;
    occupancyRate: number;
    capRate: number;
}

interface ResidentialProperty {
    squareFootage: number;
    pricePerSqFt: number;
    bedrooms: number;
    bathrooms: number;
}

function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDecimal(min: number, max: number, decimals: number = 2): number {
    const num = Math.random() * (max - min) + min;
    return Number(num.toFixed(decimals));
}

export function generateRandomCommercialProperty(): CommercialProperty {
    return {
        squareFootage: getRandomNumber(1000, 100000),
        pricePerSqFt: getRandomNumber(100, 500),
        occupancyRate: getRandomDecimal(70, 95),
        capRate: getRandomDecimal(4, 8)
    };
}

export function generateRandomResidentialProperty(): ResidentialProperty {
    return {
        squareFootage: getRandomNumber(500, 5000),
        pricePerSqFt: getRandomNumber(150, 400),
        bedrooms: getRandomNumber(1, 6),
        bathrooms: getRandomNumber(1, 4)
    };
} 