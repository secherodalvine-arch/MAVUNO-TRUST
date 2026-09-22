import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation';
import User from '../models/User';
import { signAccessToken } from '../utils/tokenUtils';
import { io as Client } from 'socket.io-client';
import http from 'http';
import express from 'express';
import { initializeSocket } from '../socket';

let httpServer: http.Server;
let ioServer: any;
let clientSocket: any;
let unauthSocket: any;

const PORT = 5005;

// Mock data
const farmerId = new mongoose.Types.ObjectId().toHexString();
const dealerId = new mongoose.Types.ObjectId().toHexString();
const unrelatedId = new mongoose.Types.ObjectId().toHexString();
const conversationId = new mongoose.Types.ObjectId().toHexString();

process.env.JWT_SECRET = 'a_very_long_secret_key_for_testing_purposes_12345';

const farmerToken = signAccessToken({ userId: farmerId, role: 'FARMER' });
const dealerToken = signAccessToken({ userId: dealerId, role: 'DEALER' });
const unrelatedToken = signAccessToken({ userId: unrelatedId, role: 'FARMER' });

// Mock Mongoose Methods
(User as any).findById = (id: string) => ({
  select: () => ({
    _id: id,
    accountStatus: 'ACTIVE'
  })
});

(Conversation as any).findById = (id: string) => ({
  exec: async () => {
    if (id === conversationId) {
      return {
        _id: conversationId,
        participants: [farmerId, dealerId],
        isActive: true
      };
    }
    return null;
  }
});

const runTests = async () => {
  console.log('\n🔌 MavunoTrust WebSocket MVP Test Suite');
  console.log('==================================================================');

  // Setup mock server
  const app = express();
  httpServer = http.createServer(app);
  ioServer = initializeSocket(httpServer);
  
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => resolve());
  });

  // --- Tests ---
  try {
    await testUnauthenticatedConnection();
    console.log('  ✓ 1. Unauthenticated WebSocket connection is rejected');

    await testAuthenticatedConnection();
    console.log('  ✓ 2. Authenticated user can connect via WebSocket');

    await testJoinOwnConversation();
    console.log('  ✓ 3. Participant can join their own conversation (IDOR protected)');

    await testJoinUnrelatedConversation();
    console.log('  ✓ 4. Unrelated user cannot join the conversation (IDOR protected)');

  } catch (err: any) {
    console.error('  ✗ Test failed:', err.message);
    process.exit(1);
  } finally {
    if (clientSocket) clientSocket.disconnect();
    if (unauthSocket) unauthSocket.disconnect();
    httpServer.close();
    console.log('\n==================================================================');
    console.log('Results: All tests passed.\n');
  }
};

const testUnauthenticatedConnection = () => {
  return new Promise<void>((resolve, reject) => {
    unauthSocket = Client(`http://localhost:${PORT}`, {
      auth: { token: 'invalid_token' }
    });

    unauthSocket.on('connect_error', (err: any) => {
      if (err.message.includes('Authentication error')) {
        unauthSocket.disconnect();
        resolve();
      } else {
        reject(new Error('Unexpected connection error'));
      }
    });

    unauthSocket.on('connect', () => {
      reject(new Error('Unauthenticated user was allowed to connect'));
    });
  });
};

const testAuthenticatedConnection = () => {
  return new Promise<void>((resolve, reject) => {
    clientSocket = Client(`http://localhost:${PORT}`, {
      auth: { token: farmerToken }
    });

    clientSocket.on('connect', () => resolve());
    clientSocket.on('connect_error', (err: any) => {
      reject(new Error(`Authenticated user failed to connect: ${err.message}`));
    });
  });
};

const testJoinOwnConversation = () => {
  return new Promise<void>((resolve, reject) => {
    let hasError = false;
    clientSocket.on('error_message', (data: any) => {
      hasError = true;
      reject(new Error(`Failed to join own conversation: ${data.message}`));
    });

    clientSocket.emit('join_conversation', conversationId);
    
    setTimeout(() => {
      if (!hasError) resolve();
    }, 200);
  });
};

const testJoinUnrelatedConversation = () => {
  return new Promise<void>((resolve, reject) => {
    const intruderSocket = Client(`http://localhost:${PORT}`, {
      auth: { token: unrelatedToken }
    });

    intruderSocket.on('connect', () => {
      intruderSocket.emit('join_conversation', conversationId);
    });

    intruderSocket.on('error_message', (data: any) => {
      if (data.message.includes('Unauthorized')) {
        intruderSocket.disconnect();
        resolve();
      } else {
        reject(new Error('Unexpected error message'));
      }
    });

    setTimeout(() => {
      reject(new Error('Intruder joined conversation without error'));
    }, 500);
  });
};

runTests();
