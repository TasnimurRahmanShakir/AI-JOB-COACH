import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB client
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.gqjzz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error(error);
    }
}
run().catch(console.dir);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// --------------------
// Authentication Middleware
// --------------------
const authenticateUser = (req, res, next) => {
    console.log("🔍 Authentication check for:", req.method, req.path);
    console.log("🔍 Auth header:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ Missing or invalid authorization header");
        return res.status(401).json({
            error: "Unauthorized",
            message: "Authorization header missing or invalid format",
            debug: "Expected format: 'Bearer <token>'"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        console.log("❌ Token missing from header");
        return res.status(401).json({
            error: "Unauthorized",
            message: "Token missing"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("✅ Token decoded successfully:", decoded.userId);

        if (!decoded.userId) {
            console.log("❌ Token missing userId");
            return res.status(401).json({
                error: "Invalid token",
                message: "Token does not contain userId"
            });
        }

        req.user = decoded; // { userId }
        next();
    } catch (err) {
        console.error("❌ JWT verification error:", err.message);
        return res.status(401).json({
            error: "Invalid token",
            message: err.message,
            debug: "Token might be expired or invalid"
        });
    }
};

// --------------------
// Routes
// --------------------

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Server running 🚀" });
});

// Test route to check authentication
app.get("/api/test-auth", authenticateUser, (req, res) => {
    res.json({
        message: "Authentication working!",
        user: req.user
    });
});

// Login route (frontend sends email from Firebase)
app.post("/api/login", async (req, res) => {
    try {
        const { email, uid } = req.body;

        if (!email) {
            return res.status(400).json({
                error: "Email is required",
                message: "Please provide email address"
            });
        }

        // Use email as userId for simplicity, but in production use Firebase UID
        const userId = email;
        const token = jwt.sign(
            {
                userId,
                email,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            },
            JWT_SECRET
        );

        console.log("✅ User logged in:", email);

        res.json({
            token,
            userId,
            email,
            message: "Login successful"
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Login failed",
            message: error.message
        });
    }
});

// Save ATS score (protected)
app.post("/api/ats-score", authenticateUser, async (req, res) => {
    try {
        const { ats_score, strengths, weaknesses, final_report, resume_name } = req.body;
        if (!ats_score) return res.status(400).json({ error: "ATS score is required" });

        const db = client.db("resumeDB");
        const collection = db.collection("atsScores");

        const result = await collection.insertOne({
            userId: req.user.userId,
            ats_score: parseInt(ats_score),
            strengths: strengths || [],
            weaknesses: weaknesses || [],
            final_report: final_report || "",
            resume_name: resume_name || "Untitled Resume",
            createdAt: new Date(),
        });

        res.json({
            message: "ATS score saved successfully",
            id: result.insertedId,
            data: {
                ats_score: parseInt(ats_score),
                resume_name: resume_name || "Untitled Resume",
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error("Error saving ATS score:", error);
        res.status(500).json({ error: "Failed to save ATS score" });
    }
});

// Fetch latest ATS score for logged-in user
app.get("/api/ats-score/latest", authenticateUser, async (req, res) => {
    try {
        const db = client.db("resumeDB");
        const collection = db.collection("atsScores");

        const latestScore = await collection
            .find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        if (latestScore.length === 0) {
            return res.status(200).json(null);
        }

        res.status(200).json(latestScore[0]);
    } catch (error) {
        console.error("Error fetching latest ATS score:", error);
        res.status(500).json({ error: "Failed to fetch latest ATS score" });
    }
});

// Fetch all ATS scores for logged-in user
app.get("/api/ats-scores", authenticateUser, async (req, res) => {
    try {
        const db = client.db("resumeDB");
        const collection = db.collection("atsScores");

        const scores = await collection
            .find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json(scores);
    } catch (error) {
        console.error("Error fetching ATS scores:", error);
        res.status(500).json({ error: "Failed to fetch ATS scores" });
    }
});

// --------------------
// INTERVIEW ANALYSIS ROUTES
// --------------------

// Save interview analysis - ENHANCED VERSION
app.post("/api/interview-analysis", authenticateUser, async (req, res) => {
    try {
        console.log("💾 Saving interview analysis for user:", req.user.userId);
        console.log("💾 Request body:", req.body);

        const { interviewType, questions, averages, final_report, raw_api_data } = req.body;

        if (!interviewType) {
            return res.status(400).json({ error: "Interview type is required" });
        }

        const db = client.db("resumeDB");
        const collection = db.collection("interviewAnalysis");

        // Delete existing interviews of the same type for this user (keep only latest)
        await collection.deleteMany({
            userId: req.user.userId,
            interviewType: interviewType
        });

        const newEntry = {
            userId: req.user.userId,
            interviewType: interviewType, // "audio" or "video"
            questions: questions || [],
            averages: averages || {},
            final_report: final_report || "",
            raw_api_data: raw_api_data || null, // Store complete API response
            createdAt: new Date(),
        };

        console.log("💾 Saving entry:", JSON.stringify(newEntry, null, 2));

        const result = await collection.insertOne(newEntry);

        console.log("✅ Interview analysis saved successfully:", result.insertedId);

        res.json({
            success: true,
            message: "Interview analysis saved successfully",
            id: result.insertedId,
            interviewType: interviewType
        });
    } catch (err) {
        console.error("❌ Save error:", err);
        res.status(500).json({ error: "Failed to save interview analysis" });
    }
});

// Get latest interview analysis of any type
app.get("/api/interview-analysis/latest", authenticateUser, async (req, res) => {
    try {
        console.log("🔍 Fetching latest interview for user:", req.user.userId);

        const db = client.db("resumeDB");
        const collection = db.collection("interviewAnalysis");

        // Find the most recent interview of any type
        const latest = await collection
            .findOne(
                { userId: req.user.userId },
                { sort: { createdAt: -1 } }
            );

        if (!latest) {
            console.log("📭 No interview data found for user");
            return res.status(200).json(null);
        }

        console.log("✅ Found latest interview:", {
            type: latest.interviewType,
            createdAt: latest.createdAt,
            hasQuestions: latest.questions?.length > 0,
            hasAverages: !!latest.averages
        });

        res.json({
            interviewType: latest.interviewType,
            questions: latest.questions,
            averages: latest.averages,
            final_report: latest.final_report,
            createdAt: latest.createdAt
        });
    } catch (err) {
        console.error("❌ Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch interview analysis" });
    }
});

// Get interview analysis by specific type
app.get("/api/interview-analysis/type/:type", authenticateUser, async (req, res) => {
    try {
        const { type } = req.params;
        console.log(`🔍 Fetching ${type} interview for user:`, req.user.userId);

        const db = client.db("resumeDB");
        const collection = db.collection("interviewAnalysis");

        const interview = await collection
            .findOne(
                { userId: req.user.userId, interviewType: type },
                { sort: { createdAt: -1 } }
            );

        if (!interview) {
            console.log(`📭 No ${type} interview found for user`);
            return res.status(200).json(null);
        }

        console.log(`✅ Found ${type} interview:`, {
            createdAt: interview.createdAt,
            hasQuestions: interview.questions?.length > 0
        });

        res.json({
            interviewType: interview.interviewType,
            questions: interview.questions,
            averages: interview.averages,
            final_report: interview.final_report,
            createdAt: interview.createdAt
        });
    } catch (err) {
        console.error("❌ Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch interview analysis" });
    }
});

// ...existing code...


// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});