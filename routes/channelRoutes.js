import { Router } from "express";
import {verifyToken} from "../middlewares/authMiddlewares.js"
import { createChannel, getChannelMessages, getUserChannels,
leaveChannel,
deleteChannel,
removeMemberFromChannel
 } from "../controllers/channelController.js";

const channelRoutes = Router()

channelRoutes.post("/create-channel",verifyToken,createChannel)
channelRoutes.get("/get-user-channels",verifyToken,getUserChannels)
channelRoutes.get('/get-channel-messages/:channelId',verifyToken,getChannelMessages)
channelRoutes.delete("/:channelId/leave", verifyToken, leaveChannel);
channelRoutes.delete("/:channelId/delete", verifyToken, deleteChannel);
channelRoutes.delete("/:channelId/remove-member/:memberId", verifyToken, removeMemberFromChannel);
export default channelRoutes