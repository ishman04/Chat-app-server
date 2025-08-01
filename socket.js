import { Server as SocketIOServer } from "socket.io"; //To setup websocket on top of http server
import Message from "./schemas/messageSchema.js";
import Channel from "./schemas/channelSchema.js";
import User from "./schemas/userSchema.js";

let io;
export const getIO = () => { 
    if (!io) {
        throw new Error("Socket.IO not initialized!");
    }
    return io;
};
const setupSocket = (server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: 'https://chat-app-client-kohl.vercel.app',
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.userSocketMap = new Map(); // userId -> socketId

  const handleTyping = async(socket,data) => {
    const {recipient, channelId, isChannel} = data;
    const senderId = [...io.userSocketMap.entries()].find(([_,id]) => id === socket.id)?.[0];
    if(!senderId) return;
    const sender = await User.findById(senderId).select("firstName email");
    if (!sender) return;
    const senderName = sender.firstName || sender.email;
    const payload = { senderId, senderName, isChannel }; 

    if(isChannel){
      payload.channelId = channelId;
      socket.to(channelId).emit("typing",payload);
    } else{
      const recipientSocketId = io.userSocketMap.get(recipient);
      if(recipientSocketId) {
        io.to(recipientSocketId).emit("typing", payload);
      }
    }
  }


const handleStopTyping = (socket, data) => {
    const { recipient, channelId, isChannel } = data;
    const senderId = [...io.userSocketMap.entries()].find(([_, id]) => id === socket.id)?.[0];
    if (!senderId) return;
  
    if (isChannel) {
      // For channels, broadcast to the channel room with channel-specific data
      socket.to(channelId).emit("stop-typing", { senderId, channelId, isChannel });
    } else {
      // For 1-to-1 chats, emit directly to the specific recipient
      const recipientSocketId = io.userSocketMap.get(recipient);
      if (recipientSocketId) {
        // The payload only needs the senderId and the isChannel flag
        io.to(recipientSocketId).emit("stop-typing", { senderId, isChannel });
      }
    }
};
  // 🔌 Disconnect handler
  const disconnect = (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [userId, socketId] of io.userSocketMap.entries()) {
      if (socketId === socket.id) {
        io.userSocketMap.delete(userId);
        break;
      }
    }
  };

  // 💬 DM message handler
  const sendMessage = async (message) => {
    const { sender, recipient } = message;
    const senderSocketId = io.userSocketMap.get(sender);
    const recipientSocketId = io.userSocketMap.get(recipient);

    try {
      const createdMessage = await Message.create(message);

      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

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
    const { channelId, sender, content, messageType, fileUrl,originalFilename } = message;

    try {
      const createdMessage = await Message.create({
        sender,
        recipient: null,
        content,
        messageType,
        timestamp: new Date(),
        fileUrl,
        originalFilename
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

      if (channel && channel._id) {
        const finalData = { ...messageData._doc, channelId: channel._id };

        if (channel.members) {
          const emittedTo = new Set();
          channel.members.forEach((member) => {
            const socketId = io.userSocketMap.get(member._id?.toString());
            if (socketId && !emittedTo.has(socketId)) {
              io.to(socketId).emit("receive-channel-message", finalData);
              emittedTo.add(socketId);
            }
          });

          const adminSocketId = io.userSocketMap.get(channel.admin?._id?.toString());
          if (adminSocketId && !emittedTo.has(adminSocketId)) {
            io.to(adminSocketId).emit("receive-channel-message", finalData);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error sending channel message:", err);
    }
  };

  // 🔗 When a user connects
  io.on("connection", async(socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      io.userSocketMap.set(userId, socket.id);
      console.log(`✅ User ${userId} connected with socket ID ${socket.id}`);
      try {
        const userChannels = await Channel.find({members: userId});
        userChannels.forEach(channel => {
          socket.join(channel._id.toString());
          console.log(`User ${userId} joined channel room ${channel._id.toString()}`);
        })
      } catch (error) {
        console.error('Error fetching and joining channels:', error);
      }
    } else {
      console.warn("⚠️ No user ID provided in handshake");
    }

    socket.on("typing",(data) =>handleTyping(socket,data));
    socket.on("stop-typing", (data) => handleStopTyping(socket, data));

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

