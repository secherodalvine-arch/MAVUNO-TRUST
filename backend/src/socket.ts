import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './utils/tokenUtils';
import User, { AccountStatus } from './models/User';
import { Conversation } from './models/Conversation';

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use(async (socket: Socket, next) => {
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
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // Connection Handler
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    // console.log(`WebSocket connected: User ${userId}, Socket ${socket.id}`);

    // Join Conversation IDOR protection
    socket.on('join_conversation', async (conversationId: string) => {
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
      } catch (err) {
        socket.emit('error_message', { message: 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(conversationId);
      // console.log(`User ${userId} left room ${conversationId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`WebSocket disconnected: User ${userId}, Socket ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};
