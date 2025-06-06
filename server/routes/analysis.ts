import express, { RequestHandler } from 'express';
import { OpenAI } from 'openai';
import { writeFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { logger } from '../utils/logger.ts';
import { redisService } from '../services/redis.ts';
import { EnergyAnalysisService } from '../services/energyAnalysis.ts';
import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db/connection.ts';
import { BuildingDesign, CityData, AnalysisResult } from '../db/schemas.ts';
import htmlPdf from 'html-pdf-node';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const router = express.Router();
const energyAnalysisService = new EnergyAnalysisService();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create PDFs directory if it doesn't exist
const PDFS_DIR = join(__dirname, '../pdfs');
await mkdir(PDFS_DIR, { recursive: true });

// Validate city data structure
function validateCityData(cityData: any): cityData is CityData {
    if (!cityData || typeof cityData !== 'object') {
        return false;
    }

    if (!cityData.name || typeof cityData.name !== 'string') {
        return false;
    }

    if (!cityData.solarRadiation || typeof cityData.solarRadiation !== 'object') {
        return false;
    }

    const requiredRadiation = ['north', 'south', 'east', 'west', 'roof'];
    for (const direction of requiredRadiation) {
        if (typeof cityData.solarRadiation[direction] !== 'number') {
            return false;
        }
    }

    if (typeof cityData.electricityRate !== 'number') {
        return false;
    }

    return true;
}

// Get analysis results for multiple building designs across all cities
router.get('/buildings', (async (req: Request, res: Response) => {
    try {
        const { ids } = req.query;
        
        logger.info('Fetching analysis for buildings across all cities');

        let buildingIds: ObjectId[];
        if (ids) {
            buildingIds = (ids as string).split(',').map(id => new ObjectId(id));
        } else {
            // If no IDs provided, get all buildings
            const allBuildings = await db.collection('buildingDesigns').find({}).toArray();
            buildingIds = allBuildings.map(b => b._id);
        }
        
        // Fetch all building designs
        const buildingDesigns = await db.collection('buildingDesigns')
            .find({ _id: { $in: buildingIds } })
            .toArray() as BuildingDesign[];

        logger.info(`Found building designs: ${buildingDesigns.length}`);

        if (buildingDesigns.length === 0) {
            return res.status(404).json({ error: 'No building designs found' });
        }

        // Fetch all city data
        const allCityData = await db.collection('cityData').find({}).toArray() as CityData[];
        
        if (allCityData.length === 0) {
            return res.status(404).json({ error: 'No city data found' });
        }

        // Validate all city data
        for (const cityData of allCityData) {
            if (!validateCityData(cityData)) {
                logger.error('Invalid city data structure:', JSON.stringify(cityData, null, 2));
                return res.status(500).json({ error: 'Invalid city data structure' });
            }
        }

        // Perform analysis for each building in each city with caching
        const analysisResults = await Promise.all(
            buildingDesigns.flatMap(design => 
                allCityData.map(async cityData => {
                    try {
                        // Try to get from cache first
                        const cacheKey = `analysis:${design._id}:${cityData.name}`;
                        const cachedResult = await redisService.get<AnalysisResult>(cacheKey);
                        
                        if (cachedResult) {
                            logger.info(`Retrieved analysis result from cache for building ${design.name} in city ${cityData.name}`);
                            return cachedResult;
                        }

                        // If not in cache, perform analysis
                        logger.info(`Analyzing building: ${design.name} for city: ${cityData.name}`);
                        const result = energyAnalysisService.analyzeBuilding(design, cityData);
                        
                        // Cache the result
                        await redisService.set(cacheKey, result);
                        
                        return result;
                    } catch (error) {
                        logger.error(`Error analyzing building ${design.name} for city ${cityData.name}:`, error);
                        throw error;
                    }
                })
            )
        );

        // Sort results by energy efficiency (lower energy consumption is better)
        analysisResults.sort((a, b) => a.energyConsumption - b.energyConsumption);

        logger.info(`Analysis completed for ${analysisResults.length} building-city combinations`);

        res.json(analysisResults);
    } catch (error) {
        logger.error('Error in /buildings endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to analyze buildings',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}) as RequestHandler);

// Generate and process PDF
router.post('/generate-pdf', async (req, res) => {
    try {
        const { buildingIds, city } = req.body;
        
        // Fetch analysis results for the buildings
        const buildingDesigns = await db.collection('buildingDesigns')
            .find({ _id: { $in: buildingIds.map((id: string) => new ObjectId(id)) } })
            .toArray() as BuildingDesign[];

        const cityData = await db.collection('cityData')
            .findOne({ name: city }) as CityData;

        if (!cityData) {
            return res.status(404).json({ error: 'City data not found' });
        }

        // Perform analysis for each building
        const analysisResults = await Promise.all(
            buildingDesigns.map(async (design) => {
                const result = energyAnalysisService.analyzeBuilding(design, cityData);
                return result;
            })
        );

        // Create charts
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
        
        // Energy Consumption Chart
        const energyConsumptionChart = await chartJSNodeCanvas.renderToBuffer({
            type: 'bar',
            data: {
                labels: buildingDesigns.map(b => b.name),
                datasets: [{
                    label: 'Energy Consumption (kWh)',
                    data: analysisResults.map(r => r.energyConsumption),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Energy Consumption by Building'
                    }
                }
            }
        });

        // Convert chart to base64
        const chartBase64 = energyConsumptionChart.toString('base64');

        // Get AI insights
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: `Please analyze the building analysis report for buildings ${buildingIds.join(', ')} in ${city} and provide insights. Include recommendations for energy optimization.`
                }
            ],
            max_tokens: 1000
        });

        const insights = completion.choices[0].message.content || 'No insights available';

        // Create HTML template
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .chart-container {
                        margin: 20px 0;
                        text-align: center;
                    }
                    .insights {
                        margin-top: 30px;
                        padding: 20px;
                        background-color: #f5f5f5;
                        border-radius: 5px;
                    }
                    h1 {
                        color: #333;
                        font-size: 24px;
                    }
                    h2 {
                        color: #444;
                        font-size: 20px;
                    }
                    p {
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Building Analysis Report</h1>
                    <p>City: ${city}</p>
                </div>
                
                <div class="chart-container">
                    <h2>Energy Consumption Analysis</h2>
                    <img src="data:image/png;base64,${chartBase64}" style="max-width: 100%; height: auto;">
                </div>

                <div class="insights">
                    <h2>AI Analysis Insights</h2>
                    <div>${insights.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
                </div>
            </body>
            </html>
        `;

        // Generate PDF
        const options = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        };

        const file = { content: htmlContent };
        const pdfBuffer = await htmlPdf.generatePdf(file, options);
        
        // Save the PDF with a unique name
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `analysis-${buildingIds.join('-')}-${city}-${timestamp}.pdf`;
        const filepath = join(PDFS_DIR, filename);
        
        await writeFile(filepath, pdfBuffer);
        
        res.json({
            success: true,
            filename,
            insights
        });
    } catch (error) {
        logger.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Get list of saved PDFs
router.get('/pdfs', async (req, res) => {
    try {
        const files = await readdir(PDFS_DIR);
        const pdfs = files
            .filter((file: string) => file.endsWith('.pdf'))
            .map((file: string) => ({
                filename: file,
                path: `/pdfs/${file}`,
                createdAt: new Date(file.split('-').pop()?.replace('.pdf', '') || '').toISOString()
            }));
        
        res.json(pdfs);
    } catch (error) {
        logger.error('Error getting PDFs:', error);
        res.status(500).json({ error: 'Failed to get PDFs' });
    }
});

// Download PDF
router.get('/pdfs/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = join(PDFS_DIR, filename);
        
        res.download(filepath);
    } catch (error) {
        logger.error('Error downloading PDF:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
});

export default router; 