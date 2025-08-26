// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env.local', '.env'];

console.log(`🌍 Environment: ${nodeEnv}`);

// Load the first existing environment file
for (const envFile of envFiles) {
	const envPath = path.resolve(process.cwd(), envFile);
	if (fs.existsSync(envPath)) {
		dotenv.config({ path: envPath });
		console.log(`🔧 Loading environment from: ${envPath}`);
		break;
	}
}

// Now import the rest of the application AFTER environment variables are loaded
import { createServer } from 'http';
import app, { socketService } from './app';
import { connectDB } from './infrastructure/config/db';

const port = process.env.PORT || 3000;

async function startServer() {
	try {
		await connectDB();

		// Create HTTP server from Express app
		const httpServer = createServer(app);

		// Initialize socket service with HTTP server
		socketService.initialize(httpServer);

		// Start HTTP server (which will also start WebSocket server)
		httpServer.listen(port, () => {
			console.log(`🚀 HTTP server running on port ${port}`);
			console.log(`🔌 WebSocket server running on port ${port}`);
		});
	} catch (error) {
		console.error('failed to start the server', error);
		process.exit(1);
	}
}

startServer();
