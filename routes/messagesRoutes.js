import {Router} from 'express'
import {verifyToken} from '../middlewares/authMiddlewares.js'
import { getMessages, uploadFile, deleteMessage, editMessage } from '../controllers/messagesController.js';
import { fileUploader } from '../middlewares/multerMiddleware.js';



const messagesRoutes = Router();


messagesRoutes.post('/get-messages',verifyToken,getMessages)
messagesRoutes.post("/upload-file",verifyToken,fileUploader.single("file"),uploadFile)
messagesRoutes.delete("/:messageId", verifyToken, deleteMessage);
messagesRoutes.put("/:messageId", verifyToken, editMessage);

export default messagesRoutes