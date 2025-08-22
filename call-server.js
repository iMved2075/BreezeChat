/**
 * Simple WebSocket Server for BreezeChat calls
 * Alternative to WebRTC TURN servers
 */

const WebSocket = require('ws');
const http = require('http');

class CallServer {
  constructor(port = 8080) {
    this.port = port;
    this.server = null;
    this.wss = null;
    this.clients = new Map(); // Map of clientId -> WebSocket
    this.calls = new Map();   // Map of callId -> { caller, callee, status }
  }

  start() {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws) => {
      console.log('📞 New client connected');
      
      // Generate unique client ID
      const clientId = this.generateId();
      this.clients.set(clientId, ws);

      // Send client ID to client
      ws.send(JSON.stringify({
        type: 'client-id',
        clientId: clientId
      }));

      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('📞 Client disconnected:', clientId);
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    // Start server
    this.server.listen(this.port, () => {
      console.log(`🚀 BreezeChat Call Server running on port ${this.port}`);
    });
  }

  handleMessage(clientId, data) {
    console.log(`📨 Message from ${clientId}:`, data.type);

    switch (data.type) {
      case 'start-call':
        this.handleStartCall(clientId, data);
        break;

      case 'accept-call':
        this.handleAcceptCall(clientId, data);
        break;

      case 'decline-call':
        this.handleDeclineCall(clientId, data);
        break;

      case 'end-call':
        this.handleEndCall(clientId, data);
        break;

      case 'audio-data':
        this.handleAudioData(clientId, data);
        break;

      case 'video-frame':
        this.handleVideoFrame(clientId, data);
        break;

      default:
        console.log('❓ Unknown message type:', data.type);
    }
  }

  handleStartCall(callerId, data) {
    const { callId, calleeId } = data;
    
    // Store call information
    this.calls.set(callId, {
      caller: callerId,
      callee: calleeId,
      status: 'calling',
      startTime: Date.now()
    });

    // Notify callee about incoming call
    const calleeSocket = this.clients.get(calleeId);
    if (calleeSocket) {
      calleeSocket.send(JSON.stringify({
        type: 'incoming-call',
        callId: callId,
        callerId: callerId,
        timestamp: Date.now()
      }));
      console.log(`📞 Call ${callId} started: ${callerId} -> ${calleeId}`);
    } else {
      // Callee not available
      const callerSocket = this.clients.get(callerId);
      if (callerSocket) {
        callerSocket.send(JSON.stringify({
          type: 'error',
          error: 'Callee not available',
          callId: callId
        }));
      }
    }
  }

  handleAcceptCall(calleeId, data) {
    const { callId } = data;
    const call = this.calls.get(callId);

    if (call && call.callee === calleeId) {
      call.status = 'active';
      
      // Notify caller that call was accepted
      const callerSocket = this.clients.get(call.caller);
      if (callerSocket) {
        callerSocket.send(JSON.stringify({
          type: 'call-accepted',
          callId: callId,
          timestamp: Date.now()
        }));
      }

      console.log(`✅ Call ${callId} accepted`);
    }
  }

  handleDeclineCall(calleeId, data) {
    const { callId } = data;
    const call = this.calls.get(callId);

    if (call && call.callee === calleeId) {
      // Notify caller that call was declined
      const callerSocket = this.clients.get(call.caller);
      if (callerSocket) {
        callerSocket.send(JSON.stringify({
          type: 'call-declined',
          callId: callId,
          timestamp: Date.now()
        }));
      }

      // Remove call
      this.calls.delete(callId);
      console.log(`❌ Call ${callId} declined`);
    }
  }

  handleEndCall(clientId, data) {
    const { callId } = data;
    const call = this.calls.get(callId);

    if (call) {
      // Notify the other party
      const otherPartyId = call.caller === clientId ? call.callee : call.caller;
      const otherSocket = this.clients.get(otherPartyId);
      
      if (otherSocket) {
        otherSocket.send(JSON.stringify({
          type: 'call-ended',
          callId: callId,
          timestamp: Date.now()
        }));
      }

      // Remove call
      this.calls.delete(callId);
      console.log(`📞 Call ${callId} ended by ${clientId}`);
    }
  }

  handleAudioData(senderId, data) {
    const { callId, audioData } = data;
    const call = this.calls.get(callId);

    if (call && call.status === 'active') {
      // Forward audio data to the other party
      const receiverId = call.caller === senderId ? call.callee : call.caller;
      const receiverSocket = this.clients.get(receiverId);
      
      if (receiverSocket) {
        receiverSocket.send(JSON.stringify({
          type: 'audio-data',
          callId: callId,
          audioData: audioData,
          timestamp: data.timestamp
        }));
      }
    }
  }

  handleVideoFrame(senderId, data) {
    const { callId, frameData } = data;
    const call = this.calls.get(callId);

    if (call && call.status === 'active') {
      // Forward video frame to the other party
      const receiverId = call.caller === senderId ? call.callee : call.caller;
      const receiverSocket = this.clients.get(receiverId);
      
      if (receiverSocket) {
        receiverSocket.send(JSON.stringify({
          type: 'video-frame',
          callId: callId,
          frameData: frameData,
          timestamp: data.timestamp
        }));
      }
    }
  }

  handleClientDisconnect(clientId) {
    // End any active calls for this client
    for (const [callId, call] of this.calls) {
      if (call.caller === clientId || call.callee === clientId) {
        this.handleEndCall(clientId, { callId });
      }
    }

    // Remove client
    this.clients.delete(clientId);
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    console.log('📞 Call server stopped');
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new CallServer(8080);
  server.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📞 Shutting down call server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = CallServer;
