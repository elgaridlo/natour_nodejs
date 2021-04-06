class appError extends Error {
  constructor(message, statusCode) {
    super(message); // if we extend parent class so we nee to implement super class
    // why message ? because message was built-in in the Error

    console.log('statusCode = ', statusCode);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = appError;
