class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.status = statusCode;
    this.statusCode = statusCode;
  }
}

module.exports = { ApiError };
