import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

import app from './app';
import { connectDB } from './infrastructure/config/db';

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

const port = process.env.PORT || 3000;

async function startServer() {
	try {
		await connectDB();
		app.listen(port, () => {
			console.log(`application running on port ${port}`);
		});
	} catch (error) {
		console.error('failed to start the server', error);
		process.exit(1);
	}
}

startServer();
