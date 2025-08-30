import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ILoggingService } from '../../../domain/services/ilogging.service';

// Add request ID to the request for tracing
export const requestIdMiddleware = (loggingService: ILoggingService) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const requestId = uuidv4();

		req.requestId = requestId; // Now properly typed

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
