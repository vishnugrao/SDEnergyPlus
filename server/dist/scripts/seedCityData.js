import { db } from '../db/connection.js';
const cityData = [
    {
        name: 'Bangalore',
        solarRadiation: {
            north: 150,
            south: 250,
            east: 200,
            west: 200,
            roof: 300
        },
        electricityRate: 6.5
    },
    {
        name: 'Mumbai',
        solarRadiation: {
            north: 180,
            south: 350,
            east: 280,
            west: 270,
            roof: 400
        },
        electricityRate: 9.0
    },
    {
        name: 'Kolkata',
        solarRadiation: {
            north: 200,
            south: 400,
            east: 300,
            west: 290,
            roof: 450
        },
        electricityRate: 7.5
    },
    {
        name: 'Delhi',
        solarRadiation: {
            north: 160,
            south: 270,
            east: 220,
            west: 220,
            roof: 320
        },
        electricityRate: 8.5
    }
];
async function seedCityData() {
    try {
        // Clear existing city data
        await db.collection('cityData').deleteMany({});
        // Insert new city data
        const result = await db.collection('cityData').insertMany(cityData);
        console.log(`Successfully seeded ${result.insertedCount} cities`);
    }
    catch (error) {
        console.error('Failed to seed city data:', error);
        process.exit(1);
    }
}
seedCityData();
//# sourceMappingURL=seedCityData.js.map