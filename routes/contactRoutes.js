import { Router } from "express";

import { searchContacts } from "../controllers/contactsController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";


const contactRoutes = Router();

contactRoutes.post("/search",verifyToken, searchContacts)

export default contactRoutes