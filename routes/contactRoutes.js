import { Router } from "express";

import { getAllContacts, getContactsForDMList, searchContacts } from "../controllers/contactsController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";


const contactRoutes = Router();

contactRoutes.post("/search",verifyToken, searchContacts)
contactRoutes.get("/get-contacts-for-dm",verifyToken,getContactsForDMList)
contactRoutes.get("/get-all-contacts",verifyToken,getAllContacts)

export default contactRoutes