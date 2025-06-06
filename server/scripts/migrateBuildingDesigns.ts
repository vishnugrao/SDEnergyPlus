import { db } from '../db/connection.js';
import { BuildingDesign } from '../db/schemas.js';
import { logger } from '../utils/logger.js';

async function migrateBuildingDesigns() {
    try {
        logger.info('Starting building designs migration...');

        // Get all building designs
        const designs = await db.collection<BuildingDesign>('buildingDesigns').find({}).toArray();
        logger.info(`Found ${designs.length} building designs to migrate`);

        // Fix each design
        for (const design of designs) {
            const fixedDesign: BuildingDesign = {
                ...design,
                facades: {
                    north: {
                        height: design.facades?.north?.height || 0,
                        width: design.facades?.north?.width || 0,
                        wwr: design.facades?.north?.wwr || 0.25,
                        shgc: design.facades?.north?.shgc || 0.5
                    },
                    south: {
                        height: design.facades?.south?.height || 0,
                        width: design.facades?.south?.width || 0,
                        wwr: design.facades?.south?.wwr || 0.4,
                        shgc: design.facades?.south?.shgc || 0.3
                    },
                    east: {
                        height: design.facades?.east?.height || 0,
                        width: design.facades?.east?.width || 0,
                        wwr: design.facades?.east?.wwr || 0.3,
                        shgc: design.facades?.east?.shgc || 0.4
                    },
                    west: {
                        height: design.facades?.west?.height || 0,
                        width: design.facades?.west?.width || 0,
                        wwr: design.facades?.west?.wwr || 0.3,
                        shgc: design.facades?.west?.shgc || 0.4
                    }
                },
                updatedAt: new Date()
            };

            // Update the design in the database
            await db.collection<BuildingDesign>('buildingDesigns').updateOne(
                { _id: design._id },
                { $set: fixedDesign }
            );

            logger.info(`Migrated building design: ${design.name}`);
        }

        logger.info('Building designs migration completed successfully');
    } catch (error) {
        logger.error('Error during building designs migration:', error);
        throw error;
    }
}

// Run the migration
migrateBuildingDesigns()
    .then(() => {
        logger.info('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Migration failed:', error);
        process.exit(1);
    }); 