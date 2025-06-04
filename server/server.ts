import express from "express";
import type { Express } from "express";
import cors from "cors";
import records from "./routes/record.ts";

const PORT = process.env.PORT || 5050;
const app: Express = express();

app.use(cors());
app.use(express.json());
app.use('/record', records);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});