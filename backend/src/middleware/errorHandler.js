export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    // Log the error internally (can be expanded later with better logging tools)
    console.error(`[Error] ${statusCode} - ${err.message}`);
    // Don't expose stack traces or internal implementation details in production
    res.status(statusCode).json({
        success: false,
        error: {
            message: isProduction && statusCode === 500 ? 'Internal Server Error' : err.message,
            ...(isProduction ? {} : { stack: err.stack })
        }
    });
};
