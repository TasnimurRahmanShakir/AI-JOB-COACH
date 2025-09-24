
import { MongoClient, ServerApiVersion } from 'mongodb';
import express from "express";

import cors from "cors";
import dotenv from "dotenv";
const port = process.env.PORT || 5000;
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.gqjzz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

app.get("/", (req, res) => {
    res.json({ message: "Hello from Express + MongoDB API 🚀" });
});



// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


run().catch(console.dir);
