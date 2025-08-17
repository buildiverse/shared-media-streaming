import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import globalErrorHandler from './middleware/errorHandler';
import AppError from './utils/appError';
import { HTTP_STATUS } from './constants/httpStatus';
import AWS from 'aws-sdk';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Health check route
app.get('/', (_req, res) => {
  res.json({
    message: 'Shared Media Streaming API',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// MongoDB connection check route
app.get('/check-mongo', async (_req, res) => {
  try {
    // Check if mongoose is connected
    const connectionState = mongoose.connection.readyState;

    const states: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
    };

    if (connectionState === 1 && mongoose.connection.db) {
      try {
        // Try to get basic database info
        const collections = await mongoose.connection.db
          .listCollections()
          .toArray();
        let serverInfo = {};

        try {
          // Try to get server status (may require auth)
          const admin = mongoose.connection.db.admin();
          const serverStatus = await admin.serverStatus();
          serverInfo = {
            host: serverStatus.host,
            version: serverStatus.version,
            uptime: `${Math.floor(serverStatus.uptime / 60)} minutes`,
          };
        } catch (authError) {
          // If we can't get server status due to auth, that's okay
          console.log('Note: Cannot get server status (likely requires auth)');
          serverInfo = {
            note: 'Server details require admin authentication',
          };
        }

        res.json({
          success: true,
          message: 'Successfully connected to MongoDB',
          connectionState: states[connectionState] || 'unknown',
          database: mongoose.connection.name || 'default',
          collections: collections.map((c) => c.name),
          ...serverInfo,
        });
      } catch (dbError) {
        const error = new AppError(
          'MongoDB connected but cannot access database',
          HTTP_STATUS.SERVICE_UNAVAILABLE,
        );

        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          connectionState: states[connectionState] || 'unknown',
          error:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
        });
      }
    } else {
      const error = new AppError(
        'MongoDB is not connected',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );

      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        connectionState: states[connectionState] || 'unknown',
        mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
      });
    }
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to check MongoDB connection',
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionState: mongoose.connection.readyState,
    });
  }
});

// API status route
app.get('/api/status', (_req, res) => {
  const memoryUsage = process.memoryUsage();

  res.json({
    api: {
      name: 'Shared Media Streaming API',
      version: '1.0.0',
      status: 'operational',
    },
    server: {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: `${Math.floor(process.uptime())} seconds`,
      pid: process.pid,
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][
        mongoose.connection.readyState
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

// Environment info route (be careful in production)
app.get('/api/env', (_req, res) => {
  const safeEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI
      ? `${process.env.MONGO_URI.substring(0, 20)}...`
      : 'Not set',
  };

  res.json({
    environment: safeEnvVars,
    warning: 'Sensitive values are masked for security',
  });
});

// 404 handler for undefined routes
app.use('*', (_req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /check-mongo',
      'GET /api/status',
      'GET /api/env',
    ],
  });
});

app.post('/upload-test-file', async (_req, res) => {
  const bucketName = process.env.S3_BUCKET;
  const fileName = `test-file-${Date.now()}.txt`;
  const fileContent = 'This is a test file uploaded from my Express app!';

  AWS.config.update({
    accessKeyId: process.env.S3_USER_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: process.env.S3_REGION,
  });

  const s3 = new AWS.S3();

  if (!bucketName) {
    return res.status(500).json({
      success: false,
      message: 'S3_BUCKET environment variable is not set.',
    });
  }

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: 'text/plain',
    ACL: 'private',
  };

  try {
    const data = await s3.upload(params).promise();
    res.json({
      success: true,
      message: 'Test file uploaded successfully to S3!',
      fileLocation: data.Location,
      fileName: data.Key,
      bucket: data.Bucket,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('S3 upload failed:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to upload test file to S3.',
        error: error.message,
      });
    } else {
      // fallback for non-Error types
      console.error('S3 upload failed with unknown error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload test file to S3.',
        error: String(error),
      });
    }
  }
});

// Global error handler
app.use(globalErrorHandler);

export default app;
