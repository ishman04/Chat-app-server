import { Server as SocketIOServer } from "socket.io"; //To setup websocket on top of http server
import Message from "./schemas/messageSchema.js";
import Channel from "./schemas/channelSchema.js";


console.log("--- SOCKET HANDLER V3 - LATEST VERSION LOADED ---");
const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map(); // userId -> socketId

  // 🔌 Disconnect handler
  const disconnect = (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  // 💬 DM message handler
  const sendMessage = async (message) => {
    const { sender, recipient } = message;
    const senderSocketId = userSocketMap.get(sender);
    const recipientSocketId = userSocketMap.get(recipient);

    try {
      console.log("🛠️ Creating message:", message);
      const createdMessage = await Message.create(message);

      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

      console.log("📨 Emitting message to sender and recipient");
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", messageData);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  // 📢 Channel message handler
  const sendChannelMessage = async (message) => {
    const { channelId, sender, content, messageType, fileUrl } = message;

    try {
      const createdMessage = await Message.create({
        sender,
        recipient: null,
        content,
        messageType,
        timestamp: new Date(),
        fileUrl,
      });

      const messageData = await Message.findById(createdMessage._id).populate(
        "sender",
        "id email firstName lastName image color"
      );

      // Save message to the channel
      await Channel.findByIdAndUpdate(channelId, {
        $push: { messages: createdMessage._id },
      });

      const channel = await Channel.findById(channelId).populate("members").populate("admin");

      const finalData = { ...messageData._doc, channelId: channel._id };

      if (channel && channel.members) {
        const emittedTo = new Set();

        channel.members.forEach((member) => {
          const socketId = userSocketMap.get(member._id?.toString());
          if (socketId && !emittedTo.has(socketId)) {
            io.to(socketId).emit("receive-channel-message", finalData);
            emittedTo.add(socketId);
          }
        });

        const adminSocketId = userSocketMap.get(channel.admin?._id?.toString());
        if (adminSocketId && !emittedTo.has(adminSocketId)) {
          io.to(adminSocketId).emit("receive-channel-message", finalData);
        }
      }
    } catch (err) {
      console.error("❌ Error sending channel message:", err);
    }
  };

  // 🔗 When a user connects
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`✅ User ${userId} connected with socket ID ${socket.id}`);
    } else {
      console.warn("⚠️ No user ID provided in handshake.");
    }

    // Listen for direct message events
    socket.on("sendMessage", sendMessage);

    // Listen for channel message events
    socket.on("sendChannelMessage", sendChannelMessage);

    // Handle disconnect
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;

// Browser connects with socket.io → sends userId
// → Server maps userId ↔ socketId

// User sends "sendMessage" → Backend saves + emits to sender + recipient
// User sends "sendChannelMessage" → Backend saves + emits to all channel members

// When someone disconnects → Server removes their socketId

