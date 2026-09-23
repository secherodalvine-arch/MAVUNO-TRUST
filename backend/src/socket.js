import { Server } from 'socket.io';
import { verifyAccessToken } from './utils/tokenUtils.js';
import User, { AccountStatus } from './models/User.js';
import { Conversation } from './models/Conversation.js';
let io;
export const initializeSocket = (server) => {
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGIN,
    ]
        .filter(Boolean)
        .flatMap((val) => val.split(',').map((s) => s.trim()))
        .filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }
    });
    // Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }
            const payload = verifyAccessToken(token);
            if (payload.tokenType !== 'access') {
                return next(new Error('Authentication error: Invalid token type'));
            }
            // Verify user is active
            const user = await User.findById(payload.userId).select('accountStatus');
            if (!user) {
                return next(new Error('Authentication error: Account not found'));
            }
            if (user.accountStatus !== AccountStatus.ACTIVE) {
                return next(new Error('Authentication error: Account is not active'));
            }
            // Attach userId to the socket connection data
            socket.data.userId = payload.userId;
            next();
        }
        catch (err) {
            next(new Error('Authentication error: Invalid or expired token'));
        }
    });
    // Connection Handler
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        if (userId) {
            socket.join(`user:${userId}`);
        }
        // console.log(`WebSocket connected: User ${userId}, Socket ${socket.id}`);
        // Join Conversation IDOR protection
        socket.on('join_conversation', async (conversationId) => {
            try {
                const conversation = await Conversation.findById(conversationId).exec();
                if (!conversation) {
                    socket.emit('error_message', { message: 'Conversation not found' });
                    return;
                }
                // Verify the authenticated user is a participant
                const isParticipant = conversation.participants.some(p => p.toString() === userId);
                if (!isParticipant) {
                    socket.emit('error_message', { message: 'Unauthorized to join this conversation' });
                    return;
                }
                // Join the Socket.IO room for this conversation
                socket.join(conversationId);
                // console.log(`User ${userId} joined room ${conversationId}`);
            }
            catch (err) {
                socket.emit('error_message', { message: 'Failed to join conversation' });
            }
        });
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(conversationId);
            // console.log(`User ${userId} left room ${conversationId}`);
        });
        socket.on('disconnect', () => {
            // console.log(`WebSocket disconnected: User ${userId}, Socket ${socket.id}`);
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO is not initialized!');
    }
    return io;
};
