import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;
    
    // Check if error is instance of ApiError, if not create new ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        success: false,
        message: error.message,
        statusCode: error.statusCode,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    return res.status(error.statusCode || 500).json(response);
};

export default errorHandler;