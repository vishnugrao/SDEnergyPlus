import { db } from './connection.js';
import { CityData } from './schemas.js';
import { logger } from '../utils/logger.js';

const cityData: CityData[] = [
    {
        name: 'Bangalore',
        electricityRate: 6.5,
        temperature: { summer: 35, winter: 20, monsoon: 28 },
        humidity: { summer: 60, winter: 40, monsoon: 80 },
        solarRadiation: {
            north: 150,
            south: 250,
            east: 200,
            west: 200,
            roof: 300
        }
    },
    {
        name: 'Mumbai',
        electricityRate: 9.0,
        temperature: { summer: 32, winter: 22, monsoon: 30 },
        humidity: { summer: 75, winter: 50, monsoon: 85 },
        solarRadiation: {
            north: 180,
            south: 350,
            east: 280,
            west: 270,
            roof: 400
        }
    },
    {
        name: 'Kolkata',
        electricityRate: 7.5,
        temperature: { summer: 34, winter: 18, monsoon: 32 },
        humidity: { summer: 70, winter: 45, monsoon: 82 },
        solarRadiation: {
            north: 200,
            south: 400,
            east: 300,
            west: 290,
            roof: 450
        }
    },
    {
        name: 'Delhi',
        electricityRate: 8.5,
        temperature: { summer: 40, winter: 15, monsoon: 35 },
        humidity: { summer: 50, winter: 30, monsoon: 70 },
        solarRadiation: {
            north: 160,
            south: 270,
            east: 220,
            west: 220,
            roof: 320
        }
    }
];

export async function initializeDatabase() {
    try {
        logger.info('Starting database initialization...');

        // Check if city data already exists
        const existingCities = await db.collection('cityData').find().toArray();
        logger.info(`Found ${existingCities.length} existing cities in database`);
        
        if (existingCities.length > 0) {
            // Log the structure of existing cities
            logger.info('Existing city data structure:', existingCities.map(city => ({
                name: city.name,
                hasSolarRadiation: !!city.solarRadiation,
                solarRadiationKeys: city.solarRadiation ? Object.keys(city.solarRadiation) : [],
                hasElectricityRate: typeof city.electricityRate === 'number'
            })));
            return;
        }

        // Clear existing data
        await db.collection('cityData').deleteMany({});
        logger.info('Cleared existing city data');
        
        // Insert city data
        const result = await db.collection('cityData').insertMany(cityData);
        logger.info(`Successfully initialized ${result.insertedCount} cities`);

        // Verify the inserted data
        const insertedCities = await db.collection('cityData').find().toArray();
        logger.info('Inserted city data structure:', insertedCities.map(city => ({
            name: city.name,
            hasSolarRadiation: !!city.solarRadiation,
            solarRadiationKeys: city.solarRadiation ? Object.keys(city.solarRadiation) : [],
            hasElectricityRate: typeof city.electricityRate === 'number'
        })));

        // Create indexes
        await db.collection('cityData').createIndex({ name: 1 }, { unique: true });
        await db.collection('buildingDesigns').createIndex({ buildingId: 1 });
        await db.collection('analysisResults').createIndex({ buildingDesignId: 1 });
        await db.collection('analysisResults').createIndex({ city: 1 });

        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Failed to initialize database:', error);
        throw error;
    }
}

// Initialize database on startup
initializeDatabase().catch(error => {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
}); 