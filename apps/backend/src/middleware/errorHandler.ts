import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';

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

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (error.name === 'CastError') error = handleCastErroDB(error);
    if (error.code === 11000) error = handleDublicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
