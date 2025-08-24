import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ILoggingService } from '../interfaces';

// Add request ID to the request for tracing
export const requestIdMiddleware = (loggingService: ILoggingService) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const requestId = uuidv4();

		(req as any).requestId = requestId; // Add to request object for easy access

		// Log the request start
		loggingService.info(
			`Request started: ${req.method} ${req.url}`,
			{
				ip: req.ip,
				userAgent: req.get('User-Agent'),
			},
			{ requestId },
		);

		next();
	};
};
