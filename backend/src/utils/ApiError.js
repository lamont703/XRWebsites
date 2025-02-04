// ApiError class to handle API errors.
class ApiError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.success = false;
    }
}

export default ApiError;