const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

const uriTemplate =
    process.env.MONGO_URI_TEMPLATE ||
    'mongodb+srv://fuadul202:<db_password>@cluster0.kjrs3.mongodb.net/?appName=Cluster0';

const rawPassword = process.env.MONGO_PASSWORD;

if (!rawPassword) {
    console.error('❌ Missing MONGO_PASSWORD in .env');
    process.exit(1);
}

const encodedPassword = encodeURIComponent(rawPassword);
const uri = uriTemplate.replace('<db_password>', encodedPassword);

async function run() {
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
    });

    try {
        await client.connect();

        // Basic connectivity check
        const ping = await client.db('admin').command({ ping: 1 });
        if (ping?.ok === 1) {
            console.log('✅ MongoDB connection successful (ping ok).');
        } else {
            console.log('⚠️ Connected, but ping response was unexpected:', ping);
        }

        // Optional: show current database name from default db in URI
        const dbName = client.db().databaseName;
        console.log(`ℹ️ Connected default database: ${dbName}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed.');
        console.error(error.message || error);
        process.exitCode = 1;
    } finally {
        await client.close().catch(() => { });
    }
}

run();
