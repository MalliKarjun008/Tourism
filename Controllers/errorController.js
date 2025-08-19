const AppError = require('../utils/appError');

const handleJWTError = () => {
  return new AppError('Invalid Token.Please login again!', 401);
};
const handleJWTExpiredError = () => {
  return new AppError('Your Token has Expired,Please login again', 401);
};
const handleCastErrorDB = (err) => {
  message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: "${value}" for field "${field}". Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const sendErrordev = (err, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorprod = (err, res) => {
  // operational error: send message to client
  if (err.isOperational) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // programming or other unknown errors:dont leak information to client
  else {
    // log error
    console.error('Error🙄', err);
    //  send generic message
    res.status(500).json({
      status: 'Error',
      message: 'Something went very wrong',
    });
  }
};
module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  if (process.env.NODE_ENV === 'development') {
    sendErrordev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.stack = err.stack;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorprod(error, res);
  }
};
