import { Router, Request, Response, RequestHandler } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db/connection.ts';
import { BuildingDesign } from '../db/schemas.ts';

const router = Router();

// Get all building designs
router.get('/', async (req: Request, res: Response) => {
    try {
        const { buildingId } = req.query;
        const query = buildingId ? { buildingId } : {};
        const designs = await db.collection<BuildingDesign>('buildingDesigns').find(query).toArray();
        res.json(designs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch building designs' });
    }
});

// Get a single building design
router.get('/:id', (async (req, res) => {
    try {
        const design = await db.collection<BuildingDesign>('buildingDesigns').findOne({
            _id: new ObjectId(req.params.id)
        });
        if (!design) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        res.json(design);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch building design' });
    }
}) as RequestHandler<{ id: string }>);

// Create a new building design
router.post('/', async (req: Request, res: Response) => {
    try {
        const design: BuildingDesign = {
            ...req.body,
            buildingId: req.body.buildingId || req.body._id, // Use _id as buildingId if not provided
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await db.collection<BuildingDesign>('buildingDesigns').insertOne(design);
        res.status(201).json({ ...design, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create building design' });
    }
});

// Update a building design
router.put('/:id', (async (req, res) => {
    try {
        const design: Partial<BuildingDesign> = {
            ...req.body,
            updatedAt: new Date()
        };
        const result = await db.collection<BuildingDesign>('buildingDesigns').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: design }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        res.json({ message: 'Building design updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update building design' });
    }
}) as RequestHandler<{ id: string }>);

// Delete a building design
router.delete('/:id', (async (req, res) => {
    try {
        const result = await db.collection<BuildingDesign>('buildingDesigns').deleteOne({
            _id: new ObjectId(req.params.id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        res.json({ message: 'Building design deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete building design' });
    }
}) as RequestHandler<{ id: string }>);

// Clear all building designs
router.delete('/', async (req: Request, res: Response) => {
    try {
        await db.collection<BuildingDesign>('buildingDesigns').deleteMany({});
        res.json({ message: 'All building designs cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear building designs' });
    }
});

export default router; 