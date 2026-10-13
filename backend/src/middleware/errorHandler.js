export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message;

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors || {})
            .map((val) => val.message)
            .join(', ') || err.message;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value for ${err.path}`;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    // Log the error internally (can be expanded later with better logging tools)
    console.error(`[Error] ${statusCode} - ${message}`);
    // Don't expose stack traces or internal implementation details in production
    res.status(statusCode).json({
        success: false,
        error: {
            message: isProduction && statusCode === 500 ? 'Internal Server Error' : message,
            ...(isProduction ? {} : { stack: err.stack })
        }
    });
};
