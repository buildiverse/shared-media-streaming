import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { HTTP_STATUS } from '../../../infrastructure/constants/http-status';
import AppError from '../../../infrastructure/utils/app-error';

const handleCastErroDB = (err: mongoose.Error.CastError) => {
	const message = `Invalid ${err.path}: ${err.value}.`;
	return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

const handleDublicateFieldsDB = (err: any) => {
	const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];

	const message = `The value '${value}' is already in use. Please choose a different value.`;

	return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

const handleValidationErrorDB = (err: mongoose.Error.ValidationError) => {
	const errors = Object.values(err.errors).map((el) => el.message);

	const message = `${errors.join(', ')}.`;
	return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

const sendErrorDev = (err: any, res: Response) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrorProd = (err: any, res: Response) => {
	// Operational, trusted error : send message to the client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});

		// Programming or other unknown error
	} else {
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			status: 'fail',
			message: 'Something went wrong!',
		});
	}
};

export const globalErrorHandler = (loggingService: ILoggingService) => {
	return async (err: any, req: Request, res: Response, next: NextFunction) => {
		err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
		err.status = err.status || 'error';

		const logContext = {
			ip: req.ip,
			userAgent: req.get('User-Agent'),
			requestId: (req as any).requestId,
			userId: (req as any).user?.id,
			details: {
				url: req.url,
				method: req.method,
				statusCode: err.statusCode,
				body: req.body,
				query: req.query,
				params: req.params,
			},
			stacktrace: err.stack,
		};

		if (err.statusCode >= 500) {
			await loggingService.error(err.message, err, logContext);
		} else if (err.statusCode >= 400) {
			await loggingService.warn(err.message, err, logContext);
		} else {
			await loggingService.info(err.message, err, logContext);
		}

		if (process.env.NODE_ENV === 'development') {
			sendErrorDev(err, res);
		} else if (process.env.NODE_ENV === 'production') {
			let error = Object.create(err);

			if (error.name === 'CastError') error = handleCastErroDB(error);
			if (error.code === 11000) error = handleDublicateFieldsDB(error);
			if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

			sendErrorProd(error, res);
		}

		// Continue to next error handling middleware if needed
		next(err);
	};
};
