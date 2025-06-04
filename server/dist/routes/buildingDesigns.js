import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db/connection.ts';
const router = Router();
// Get all building designs
router.get('/', async (req, res) => {
    try {
        const designs = await db.collection('buildingDesigns').find().toArray();
        res.json(designs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch building designs' });
    }
});
// Get a single building design
router.get('/:id', (async (req, res) => {
    try {
        const design = await db.collection('buildingDesigns').findOne({
            _id: new ObjectId(req.params.id)
        });
        if (!design) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        res.json(design);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch building design' });
    }
}));
// Create a new building design
router.post('/', async (req, res) => {
    try {
        const design = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await db.collection('buildingDesigns').insertOne(design);
        res.status(201).json({ ...design, _id: result.insertedId });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create building design' });
    }
});
// Update a building design
router.put('/:id', (async (req, res) => {
    try {
        const design = {
            ...req.body,
            updatedAt: new Date()
        };
        const result = await db.collection('buildingDesigns').updateOne({ _id: new ObjectId(req.params.id) }, { $set: design });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        res.json({ message: 'Building design updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update building design' });
    }
}));
// Delete a building design
router.delete('/:id', (async (req, res) => {
    try {
        const result = await db.collection('buildingDesigns').deleteOne({
            _id: new ObjectId(req.params.id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Building design not found' });
        }
        res.json({ message: 'Building design deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete building design' });
    }
}));
export default router;
