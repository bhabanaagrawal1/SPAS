// 3 -> entire 

/*
🧠 Dependency on which files : no files
🧠 catchAsync, ApiError
 */

//avoids wrapping every controller in try/catch:
// This code is a small utility for handling errors cleanly in Express. It contains two separate things:

// catchAsync() → handles errors from async route/controller functions.
// ApiError → lets you create your own errors with an HTTP status code.

function catchAsync(fn) {
    return (req,res,next) => {
        Promise.resolve(fn(req,res,next)) //takes the result of your controller and makes sure it is treated as a Promise.
               .catch(next);//If the controller rejects, next(error) is called.
    }
}

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

export { catchAsync, ApiError };