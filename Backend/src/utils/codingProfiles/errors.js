/** Shaped like your ApiError (statusCode + isOperational) so your error middleware handles it. */
export class CodingProfileError extends Error {
  constructor(statusCode, message, { retryAfter } = {}) {
    super(message);
    this.name = "CodingProfileError";
    this.statusCode = statusCode;
    this.isOperational = true;
    this.retryAfter = retryAfter;
  }
}