// server/routes/chatbotRoutes.js
import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddlewares.js";
import { handleChatbotQuery } from "../controllers/chatbotController.js";

const chatbotRoutes = Router();


chatbotRoutes.post("/query", verifyToken, handleChatbotQuery);

export default chatbotRoutes;