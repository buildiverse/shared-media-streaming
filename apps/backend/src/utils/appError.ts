import { HttpStatusCode } from '../constants/httpStatus';

class AppError extends Error {
  statusCode: HttpStatusCode;
  status: 'fail' | 'error';
  isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
