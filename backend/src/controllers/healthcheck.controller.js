import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Healthcheck controller to check if the server is healthy.
const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "OK", "Healthcheck is working"));
});

export { healthcheck };