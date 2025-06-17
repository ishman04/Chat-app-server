import {Router} from 'express'
import {verifyToken} from '../middlewares/authMiddlewares.js'
import { getMessages, uploadFile } from '../controllers/messagesController.js';
import { uploader } from '../middlewares/multerMiddleware.js';


const messagesRoutes = Router();


messagesRoutes.post('/get-messages',verifyToken,getMessages)
messagesRoutes.post("/upload-file",verifyToken,uploader.single("file"),uploadFile)

export default messagesRoutes