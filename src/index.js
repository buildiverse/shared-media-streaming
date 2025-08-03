const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3000;

const mongoUri =
  process.env.MONGO_PRIVATE_URL ||
  process.env.MONGO_URL ||
  `mongodb://${process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGOHOST}:${process.env.MONGOPORT}`;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/check-mongo", async (req, res) => {
  let client;

  try {
    client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    // Simple query to verify connection
    const adminDb = client.db().admin();
    const serverStatus = await adminDb.serverStatus();

    res.json({
      success: true,
      message: "Successfully connected to MongoDB.",
      host: serverStatus.host,
      version: serverStatus.version,
      uptime: serverStatus.uptime,
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect to MongoDB.",
      error: error.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
