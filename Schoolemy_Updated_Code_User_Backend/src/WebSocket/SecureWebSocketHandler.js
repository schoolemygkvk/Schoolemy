import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../Utils/jwtSecret.js";
import logger from "../Utils/logger.js";

class SecureWebSocketHandler {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.topics = new Map(); // topic -> Set of WebSocket connections
    this.userTopics = new Map(); // userId -> Set(topic) for user subscriptions
    this.connectionCount = 0;
    this.messageLog = []; // Audit trail
  }


  initializeWebSocketServer(server, options = {}) {
    const isProduction = process.env.NODE_ENV === "production";

    // SECURITY FIX 3.36.1: Server options for secure WebSocket
    const wsOptions = {
      // Enable CORS for WebSocket if needed
      perMessageDeflate: false, // Performance optimization
      maxPayload: 32 * 1024, // 32 KB max message size (prevent DoS)
      clientTracking: false, // Manual tracking for better control
      verifyClient: (info, callback) => {
        // SECURITY FIX 3.36.1: Verify client before establishing connection
        this.verifyClientConnection(info, isProduction, callback);
      },
      ...options,
    };

    // Create WebSocket server
    this.wss = new WebSocket.Server({ server, ...wsOptions });

    // Handle new connections
    this.wss.on("connection", (ws, request) => {
      this.handleNewConnection(ws, request, isProduction);
    });

    // SECURITY FIX 3.36.1: Log server start
    logger.debug("[WebSocketSecurity] WebSocket server initialized");
    if (isProduction) {
      logger.debug("[WebSocketSecurity] Production mode: WSS required, tokens validated");
    }

    return this.wss;
  }


  verifyClientConnection(info, isProduction, callback) {
    try {
      const headers = info.req.headers;
      const protocol = info.req.protocol || "ws";

      // SECURITY FIX 3.36.1: Enforce WSS in production
      if (isProduction && !info.secure && protocol !== "https") {
        logger.error("[WebSocketSecurity] BLOCKED: Unencrypted WS connection in production");
        callback(false, 403, "Secure WebSocket (WSS) required for production");
        return;
      }

      // SECURITY FIX 3.36.1: Extract token from query parameter or Authorization header
      let token = null;

      // Option 1: Token in query parameter (deprecated, less secure)
      const query = info.req.url.split("?")[1];
      if (query) {
        const params = new URLSearchParams(query);
        token = params.get("token");
      }

      // Option 2: Token in Authorization header (RECOMMENDED)
      if (!token && headers.authorization) {
        const authHeader = headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        logger.error("[WebSocketSecurity] BLOCKED: No authentication token provided");
        callback(false, 401, "Authentication token required");
        return;
      }

      // SECURITY FIX 3.36.1: Validate token
      const decoded = this.validateToken(token);
      if (!decoded) {
        logger.error("[WebSocketSecurity] BLOCKED: Invalid or expired token");
        callback(false, 401, "Invalid authentication token");
        return;
      }


      info.req.user = decoded;
      info.req.userId = decoded.id || decoded.userId;


      logger.debug(`[WebSocketSecurity] Verified user ${info.req.userId} connecting via ${info.secure ? "WSS" : "WS"}`);

      // Allow connection
      callback(true);
    } catch (error) {
      logger.error("[WebSocketSecurity] Error verifying client:", error.message);
      callback(false, 500, "Internal server error");
    }
  }


  validateToken(token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      return decoded;
    } catch (error) {
      logger.error("[WebSocketSecurity] Token validation error:", error.message);
      return null;
    }
  }


  handleNewConnection(ws, request, isProduction) {
    const userId = request.user?.id || request.userId;
    const isSecure = request.secure;


    this.connectionCount++;
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);


    const welcomeMessage = {
      type: "connected",
      message: "Connected to notification server",
      isSecure,
      timestamp: Date.now(),
      connectionId: this.connectionCount,
    };
    ws.send(JSON.stringify(welcomeMessage));

    // SECURITY FIX 3.36.1: Log connection
    logger.debug(`[WebSocket] User ${userId} connected (${isSecure ? "WSS" : "WS"}, total: ${this.connectionCount})`);
    this.logMessage("connection", userId, isSecure, { success: true });

    // Set up message handler
    ws.on("message", (data) => this.handleMessage(ws, userId, data, isSecure));

    // Set up error handler
    ws.on("error", (error) => this.handleError(ws, userId, error, isSecure));

    // Set up close handler
    ws.on("close", () => this.handleClose(ws, userId, isSecure));

    // Optional: Send ping to keep connection alive
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  }


  handleMessage(ws, userId, data, isSecure) {
    try {
      const message = JSON.parse(data);


      if (!message.type) {
        logger.warn(`[WebSocketSecurity] Message missing type from user ${userId}`);
        ws.send(JSON.stringify({ type: "error", message: "Message type required" }));
        return;
      }


      switch (message.type) {
      case "ping":
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;

      case "notification":
        // Forward notification to other clients
        this.handleNotification(userId, message.payload);
        break;

      case "subscribe":
        // Subscribe to specific topics
        this.handleSubscribe(ws, userId, message.payload);
        break;

      case "unsubscribe":
        // Unsubscribe from topics
        this.handleUnsubscribe(ws, userId, message.payload);
        break;

      default:
        logger.warn(`[WebSocketSecurity] Unknown message type: ${message.type} from user ${userId}`);
        this.logMessage("unknown_message", userId, isSecure, { type: message.type });
      }
    } catch (error) {
      logger.error("[WebSocketSecurity] Error processing message:", error.message);
      ws.send(JSON.stringify({
        type: "error",
        message: "Error processing message",
      }));
    }
  }

  handleNotification(userId, payload) {
    const userConnections = this.clients.get(userId);
    if (!userConnections) return;

    const notificationMessage = {
      type: "notification",
      payload,
      timestamp: Date.now(),
    };

    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(notificationMessage));
      }
    });

    this.logMessage("notification_sent", userId, true, { payload });
  }


  handleSubscribe(ws, userId, payload) {
    const topic = payload?.topic;
    if (!topic) {
      logger.warn(`[WebSocket] User ${userId} attempted subscribe with no topic`);
      ws.send(JSON.stringify({ type: "error", message: "Topic required" }));
      return;
    }

    // Validate topic format (alphanumeric, colon, dash, underscore)
    if (!/^[a-zA-Z0-9:_-]+$/.test(topic)) {
      logger.warn(`[WebSocket] User ${userId} attempted invalid topic: ${topic}`);
      ws.send(JSON.stringify({ type: "error", message: "Invalid topic format" }));
      return;
    }

    // Create topic set if doesn't exist
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }

    // Add WebSocket to topic
    this.topics.get(topic).add(ws);

    // Track user's topic subscriptions
    if (!this.userTopics.has(userId)) {
      this.userTopics.set(userId, new Set());
    }
    this.userTopics.get(userId).add(topic);

    // Send confirmation
    ws.send(JSON.stringify({
      type: "subscribed",
      topic,
      timestamp: Date.now(),
    }));

    logger.debug(`[WebSocket] User ${userId} subscribed to topic: ${topic}`);
    this.logMessage("subscribe", userId, true, { topic, totalTopics: this.userTopics.get(userId).size });
  }


  handleUnsubscribe(ws, userId, payload) {
    const topic = payload?.topic;
    if (!topic) {
      logger.warn(`[WebSocket] User ${userId} attempted unsubscribe with no topic`);
      ws.send(JSON.stringify({ type: "error", message: "Topic required" }));
      return;
    }

    // Get WebSocket set for topic
    const topicConnections = this.topics.get(topic);
    if (topicConnections) {
      topicConnections.delete(ws);

      // Clean up empty topic
      if (topicConnections.size === 0) {
        this.topics.delete(topic);
      }
    }

    // Remove from user's topic subscriptions
    const userSubs = this.userTopics.get(userId);
    if (userSubs) {
      userSubs.delete(topic);

      // Clean up if user has no more subscriptions
      if (userSubs.size === 0) {
        this.userTopics.delete(userId);
      }
    }

    // Send confirmation
    ws.send(JSON.stringify({
      type: "unsubscribed",
      topic,
      timestamp: Date.now(),
    }));

    logger.debug(`[WebSocket] User ${userId} unsubscribed from topic: ${topic}`);
    this.logMessage("unsubscribe", userId, true, { topic });
  }


  handleError(ws, userId, error, isSecure) {
    logger.error(`[WebSocket] Error for user ${userId}:`, error.message);
    this.logMessage("error", userId, isSecure, { error: error.message });
  }


  handleClose(ws, userId, isSecure) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.clients.delete(userId);
      }
    }

    // Clean up topic subscriptions for this connection
    this.topics.forEach((connections, topic) => {
      connections.delete(ws);
      if (connections.size === 0) {
        this.topics.delete(topic);
      }
    });

    // Clean up user topic subscriptions if no longer subscribed to any topics
    const userSubs = this.userTopics.get(userId);
    if (userSubs) {
      userSubs.forEach((topic) => {
        const topicConnections = this.topics.get(topic);
        if (topicConnections && topicConnections.size === 0) {
          this.userTopics.delete(userId);
        }
      });
    }

    logger.debug(`[WebSocket] User ${userId} disconnected (${isSecure ? "WSS" : "WS"})`);
    this.logMessage("disconnection", userId, isSecure, { success: true });
  }


  logMessage(action, userId, isSecure, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      isSecure,
      ...details,
    };

    this.messageLog.push(logEntry);

    // Keep only last 1000 messages in memory
    if (this.messageLog.length > 1000) {
      this.messageLog = this.messageLog.slice(-1000);
    }
  }


  startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      this.wss?.clients?.forEach((ws) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Every 30 seconds
  }


  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
  }


  broadcast(message) {
    this.clients.forEach((userConnections, userId) => {
      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    });
  }


  broadcastToTopic(topic, message) {
    const topicConnections = this.topics.get(topic);
    if (!topicConnections || topicConnections.size === 0) {
      logger.debug(`[WebSocket] No subscribers for topic: ${topic}`);
      return 0;
    }

    let sentCount = 0;
    const messageWithTopic = {
      type: "message",
      topic,
      ...message,
      timestamp: Date.now(),
    };

    topicConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(messageWithTopic));
          sentCount++;
        } catch (error) {
          logger.error(`[WebSocket] Error sending to topic ${topic}:`, error.message);
        }
      }
    });

    logger.debug(`[WebSocket] Broadcast to topic '${topic}': ${sentCount} messages sent`);
    this.logMessage("broadcast_topic", "system", true, { topic, sentCount });

    return sentCount;
  }


  getStats() {
    let totalConnections = 0;
    this.clients.forEach((connections) => {
      totalConnections += connections.size;
    });

    let totalTopicSubscriptions = 0;
    this.topics.forEach((connections) => {
      totalTopicSubscriptions += connections.size;
    });

    return {
      usersConnected: this.clients.size,
      totalConnections,
      totalTopics: this.topics.size,
      totalTopicSubscriptions,
      totalMessagesLogged: this.messageLog.length,
      recentMessages: this.messageLog.slice(-10),
      topicList: Array.from(this.topics.keys()),
    };
  }
}

// Create singleton instance
const wsHandler = new SecureWebSocketHandler();


export function initializeWebSocketServer(server, options = {}) {
  return wsHandler.initializeWebSocketServer(server, options);
}

export function getWebSocketHandler() {
  return wsHandler;
}

export default wsHandler;
