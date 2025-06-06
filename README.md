# SDEnergyPlus
A full-stack web application that enables users to analyze and compare the energy efficiency of different building designs. The system will calculate heat gain through windows and estimate associated cooling costs across different cities.

# How to run

You will need a config.env to get the server password that I can provide to you

To start the back end server run npm start in the server folder
```
cd server
npm start
```

To start the front end client run npm run dev in the client folder
```
cd client
npm run dev
```

Navigate to <http://localhost:3000/> to see the dashboard

# API Documentation

## Base URL
```
http://localhost:5050/api
```

## Authentication
The API requires a server password which should be provided in the `config.env` file.

## Endpoints

### Analysis Endpoints

#### GET /api/analysis/buildings
Get analysis results for multiple building designs across all cities.
- Query Parameters:
  - `ids` (optional): Comma-separated list of building IDs
- Response: Array of analysis results sorted by energy efficiency

#### POST /api/analysis/generate-pdf
Generate a PDF report for building designs in a specific city.
- Request Body:
  - `buildingIds`: Array of building IDs
  - `city`: City name
- Response: PDF file

### Building Designs Endpoints

#### GET /api/building-designs
Get all building designs.
- Query Parameters:
  - `buildingId` (optional): Filter by building ID
- Response: Array of building designs

#### GET /api/building-designs/:id
Get a single building design by ID.
- Response: Building design object

#### POST /api/building-designs
Create a new building design.
- Request Body: Building design object with required facades data
- Response: Created building design with ID

#### PUT /api/building-designs/:id
Update an existing building design.
- Request Body: Partial building design object
- Response: Success message

#### DELETE /api/building-designs/:id
Delete a specific building design.
- Response: Success message

#### DELETE /api/building-designs
Clear all building designs.
- Response: Success message

### Records Endpoints

#### GET /api/records
Get all records.
- Response: Array of records

#### GET /api/records/:id
Get a specific record by ID.
- Response: Record object

#### POST /api/records
Create a new record.
- Request Body:
  - `name`: Record name
  - `position`: Position
  - `level`: Level
- Response: Created record

#### PATCH /api/records/:id
Update an existing record.
- Request Body:
  - `name`: Record name
  - `position`: Position
  - `level`: Level
- Response: Updated record

#### DELETE /api/records/:id
Delete a specific record.
- Response: Success message
