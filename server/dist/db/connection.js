import { MongoClient, ServerApiVersion } from "mongodb";
const uri = process.env.ATLAS_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db;
try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    db = client.db('smarterDharma'); // Using a more appropriate database name
}
catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1); // Exit if we can't connect to the database
}
export { db };
