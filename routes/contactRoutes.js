import { Router } from "express";

import { getContactsForDMList, searchContacts } from "../controllers/contactsController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";


const contactRoutes = Router();

contactRoutes.post("/search",verifyToken, searchContacts)
contactRoutes.get("/get-contacts-for-dm",verifyToken,getContactsForDMList)

export default contactRoutes