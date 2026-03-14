const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const uriTemplate =
    process.env.MONGO_URI_TEMPLATE ||
    'mongodb+srv://fuadul202:<db_password>@cluster0.kjrs3.mongodb.net/?appName=Cluster0';
const rawPassword = process.env.MONGO_PASSWORD;
const mongoUri = process.env.MONGO_URI ||
    (rawPassword ? uriTemplate.replace('<db_password>', encodeURIComponent(rawPassword)) : null);
const dbName = process.env.MONGO_DB_NAME || 'html_visualizer';
const collectionName = process.env.MONGO_FEEDBACK_COLLECTION || 'feedbacks';

let mongoClient = null;
let feedbackCollection = null;

async function connectMongo() {
    if (!mongoUri) {
        console.warn('⚠️ Mongo URI is not configured. Feedback API will return 503 until configured.');
        return;
    }

    mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    });

    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    feedbackCollection = db.collection(collectionName);

    console.log(`✅ MongoDB connected (${dbName}.${collectionName})`);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

app.post('/api/feedback', async (req, res) => {
    if (!feedbackCollection) {
        return res.status(503).json({
            ok: false,
            message: 'Feedback storage is not available right now.',
        });
    }

    const name = (req.body?.name || '').toString().trim();
    const email = (req.body?.email || '').toString().trim();
    const message = (req.body?.message || '').toString().trim();
    const page = (req.body?.page || '').toString().trim();
    const userAgent = (req.body?.userAgent || '').toString().trim();
    const submittedAt = req.body?.submittedAt || new Date().toISOString();

    if (!message) {
        return res.status(400).json({ ok: false, message: 'Feedback message is required.' });
    }

    try {
        const doc = {
            name,
            email,
            message,
            page,
            userAgent,
            submittedAt,
            createdAt: new Date(),
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
        };

        const result = await feedbackCollection.insertOne(doc);
        return res.status(201).json({ ok: true, id: result.insertedId });
    } catch (error) {
        console.error('❌ Failed to store feedback:', error.message || error);
        return res.status(500).json({ ok: false, message: 'Could not store feedback.' });
    }
});

app.all('/api/feedback', (req, res) => {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({
        ok: false,
        message: 'Method not allowed. Use POST /api/feedback',
    });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

async function start() {
    try {
        await connectMongo();
    } catch (error) {
        console.error('❌ MongoDB startup connection failed:', error.message || error);
        console.warn('⚠️ Server is running without feedback database connection.');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}

start();

process.on('SIGINT', async () => {
    try {
        if (mongoClient) await mongoClient.close();
    } finally {
        process.exit(0);
    }
});
