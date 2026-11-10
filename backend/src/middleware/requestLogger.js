export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        // Sanitize URL to ensure sensitive tokens or credentials in query strings are never printed to logs
        const sanitizedUrl = req.originalUrl.replace(/([?&](?:token|access_token|key|secret|password)=)[^&]*/gi, '$1[REDACTED]');
        console.log(`[${new Date().toISOString()}] ${req.method} ${sanitizedUrl} → ${res.statusCode} (${duration}ms)`);
    });
    next();
};
