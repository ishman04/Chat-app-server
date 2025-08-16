// server/controllers/chatbotController.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StatusCodes } from "http-status-codes";
import { getIO } from "../socket.js";
import dotenv from 'dotenv';
dotenv.config();

// --- Gemini API Logic ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

const generateChatbotResponse = async (userMessage) => {
  try {
    const prompt = `You are ChatterBot, a friendly and helpful AI assistant. Keep your responses concise and conversational. User's message: "${userMessage}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    return "I'm sorry, I'm having trouble thinking right now. Please try again later.";
  }
};

// --- Controller Logic ---
export const chatbotUser = {
    _id: 'chatbot-gemini-id', // A unique, static ID
    firstName: 'ChatterBot',
    lastName: '(AI)',
    image: '/chatbot-avatar.png',
    color: 4,
};

export const handleChatbotQuery = async (req, res) => {
    const { message } = req.body;
    const userId = req.userId; // From verifyToken middleware

    if (!message) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Message is required." });
    }

    try {
        const botResponseText = await generateChatbotResponse(message);

        const io = getIO();
        const userSocketId = io.userSocketMap.get(userId);

        if (userSocketId) {
            const responseMessage = {
                _id: `chatbot-msg-${Date.now()}`,
                sender: chatbotUser,
                recipient: { _id: userId },
                content: botResponseText,
                messageType: 'text',
                timestamp: new Date(),
                readBy: [],
            };
            
            io.to(userSocketId).emit('receiveMessage', responseMessage);
        }
        
        res.status(StatusCodes.OK).json({ message: "Query processed." });

    } catch (error) {
        console.error("Chatbot controller error:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to get chatbot response." });
    }
};