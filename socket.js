import { Server as SocketIOServer } from "socket.io";
import Message from "./schemas/messageSchema.js";

const setupSocket = (server) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.ORIGIN, // your frontend URL
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const userSocketMap = new Map(); // userId -> socketId

    // Disconnect handler
    const disconnect = (socket) => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
    };

    // Message handler
    const sendMessage = async (message) => {
        const { sender, recipient } = message;
        const senderSocketId = userSocketMap.get(sender);
        const recipientSocketId = userSocketMap.get(recipient);

        try {
            // Save the message
            const createdMessage = await Message.create(message);

            // Populate sender and recipient data
            const messageData = await Message.findById(createdMessage._id)
                .populate("sender", "id email firstName lastName image color")
                .populate("recipient", "id email firstName lastName image color");

            // Emit the message to recipient (if online)
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("receiveMessage", messageData);
            }

            // Emit to sender too (to update their chat)
            if (senderSocketId) {
                io.to(senderSocketId).emit("receiveMessage", messageData);
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    // When a user connects
    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId; // Frontend sends userId in query param

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User ${userId} connected with socket id ${socket.id}`);
        } else {
            console.log("User ID not provided during connection.");
        }

        // Listen for messages from this client
        socket.on("sendMessage", sendMessage);

        // Handle disconnection
        socket.on("disconnect", () => disconnect(socket));
    });
};

export default setupSocket;
