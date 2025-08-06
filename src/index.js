const express = require("express");
const { MongoClient } = require("mongodb");
const AWS = require("aws-sdk");

const app = express();
const port = 3000;

const mongoUri =
  process.env.MONGO_PRIVATE_URL ||
  process.env.MONGO_URL ||
  `mongodb://${process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGOHOST}:${process.env.MONGOPORT}`;

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Shared Media Streaming Service</h1>");
});

app.get("/check-mongo", async (req, res) => {
  let client;

  try {
    client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

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

app.post("/upload-test-file", async (req, res) => {
  const bucketName = process.env.S3_BUCKET;
  const fileName = `test-file-${Date.now()}.txt`;
  const fileContent = "This is a test file uploaded from my Express app!";

  AWS.config.update({
    accessKeyId: process.env.S3_USER_KEY,
    secretAccessKey: process.env.S3_SECRET, 
    region: process.env.S3_REGION,
  });

  const s3 = new AWS.S3();

  if (!bucketName) {
    return res.status(500).json({
      success: false,
      message: "S3_BUCKET environment variable is not set.",
    });
  }

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: "text/plain",
    ACL: "private",
  };

  try {
    const data = await s3.upload(params).promise();
    res.json({
      success: true,
      message: "Test file uploaded successfully to S3!",
      fileLocation: data.Location,
      fileName: data.Key,
      bucket: data.Bucket,
    });
  } catch (error) {
    console.error("S3 upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload test file to S3.",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
