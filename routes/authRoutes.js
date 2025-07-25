import { Router } from "express";
import { addProfileImage, getUserInfo, login,logout, signup, updateProfile, removeProfileImage } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";
import { profileUploader } from "../middlewares/multerMiddleware.js";


const authRoutes = Router();

authRoutes.post("/signup",signup);
authRoutes.post('/login',login)
authRoutes.post('/logout',logout)
authRoutes.get('/user-info',verifyToken,getUserInfo)
authRoutes.post('/update-profile',verifyToken, updateProfile);
authRoutes.post('/add-profile-image',verifyToken,profileUploader.single("profile-image"),addProfileImage)
authRoutes.delete("/remove-profile-image",verifyToken,removeProfileImage)

export default authRoutes;