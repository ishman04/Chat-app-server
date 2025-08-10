import { StatusCodes } from "http-status-codes"
import User from "../schemas/userSchema.js";
import Message from "../schemas/messageSchema.js"
import {getIO} from "../socket.js"

export const getMessages = async (req, res) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;

    if (!user1|| !user2) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Both user ids are required",
      });
    }

    const messages = await Message.find({
        $or :[
            {sender:user1,recipient:user2},
            {sender:user2,recipient:user1}
        ],
    }).sort({timestamp: 1}).populate('readBy', 'firstName _id');

    res.status(StatusCodes.OK).json({
      message: "Fetched messages successfully",
      success: true,
      data: messages,
      error: {},
    });
  } catch (error) {
    console.error("Messages fetch Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch messages",
      success: false,
      data: {},
      error: error.message,
    });
  }
};

export const uploadFile = async (req, res) => {
  try {
    console.log("this is the file:",req.file)
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'No file uploaded',
        success: false
      });
    }
    console.log('Uploaded file:', req.file); // Log file details
    // Check if file was successfully uploaded to Cloudinary
    if (!req.file.path) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'File upload failed',
        success: false
      });
    }

    return res.status(StatusCodes.OK).json({ 
      message: 'File uploaded successfully',
      success: true,
      data: {
        filePath: req.file.path,
        originalFilename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      }
    });
    
  } catch (error) {
    console.error("File upload error: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to upload file",
      success: false,
      error: error.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Message not found" });
        }

        // Verify that the user deleting the message is the sender
        if (message.sender.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: "You are not authorized to delete this message" });
        }

        await Message.findByIdAndDelete(messageId);

        // Emit the event to all clients in the chat
        const io = getIO();
        const { recipient, channelId } = req.body; // Client will send this context

        const payload = { messageId, channelId };

        if (channelId) { // It's a channel message
            io.to(channelId).emit("message-deleted", payload);
        } else if (recipient) { // It's a DM
            const userSocketMap = getIO().userSocketMap;
            const senderSocketId = userSocketMap.get(userId);
            const recipientSocketId = userSocketMap.get(recipient);

            if (senderSocketId) io.to(senderSocketId).emit("message-deleted", payload);
            if (recipientSocketId) io.to(recipientSocketId).emit("message-deleted", payload);
        }

        return res.status(StatusCodes.OK).json({ message: "Message deleted successfully" });

    } catch (error) {
        console.error("Message delete Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete message" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { newContent } = req.body;
        const userId = req.userId;

        if (!newContent) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "New content is required" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: "You are not authorized to edit this message" });
        }

        message.content = newContent;
        await message.save();

        // Emit the event to all clients
        const io = getIO();
        const { recipient, channelId } = req.body;

        const payload = { messageId, newContent, channelId };

        if (channelId) {
            io.to(channelId).emit("message-edited", payload);
        } else if (recipient) {
            const userSocketMap = getIO().userSocketMap;
            const senderSocketId = userSocketMap.get(userId);
            const recipientSocketId = userSocketMap.get(recipient);
            
            if (senderSocketId) io.to(senderSocketId).emit("message-edited", payload);
            if (recipientSocketId) io.to(recipientSocketId).emit("message-edited", payload);
        }

        return res.status(StatusCodes.OK).json({ message: "Message edited successfully" });

    } catch (error) {
        console.error("Message edit Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to edit message" });
    }
};