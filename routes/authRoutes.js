import { Router } from "express";
import { addProfileImage, getUserInfo, login, signup, updateProfile, removeProfileImage } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";
import multer from "multer";
import { uploader } from "../middlewares/multerMiddleware.js";

const authRoutes = Router();

authRoutes.post("/signup",signup);
authRoutes.post('/login',login)
authRoutes.get('/user-info',verifyToken,getUserInfo)
authRoutes.post('/update-profile',verifyToken, updateProfile);
authRoutes.post('/add-profile-image',verifyToken,uploader.single("profile-image"),addProfileImage)
authRoutes.delete("/remove-profile-image",verifyToken,removeProfileImage)

export default authRoutes;