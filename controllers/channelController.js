import mongoose from "mongoose";
import User from "../schemas/userSchema.js";
import {StatusCodes} from 'http-status-codes'
import Channel from "../schemas/channelSchema.js";
import { getIO } from "../socket.js";

export const createChannel = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    // Always include admin in the members list
    const allMembers = [...new Set([...members, userId])];

    // Validate ObjectId format
    const invalidFormatIds = allMembers.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidFormatIds.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid member ID format",
        invalidMembers: invalidFormatIds,
      });
    }

    // Check which members exist in the DB
    const validUsers = await User.find({ _id: { $in: allMembers } }).select("_id");
    const validUserIds = validUsers.map(user => user._id.toString());

    const invalidMembers = allMembers.filter(id => !validUserIds.includes(id));
    if (invalidMembers.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Some members do not exist",
        invalidMembers,
      });
    }

    // Create channel
    const newChannel = await Channel.create({
      name,
      members: allMembers,
      admin: userId,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Channel created successfully",
      data: newChannel,
      error: {},
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Cannot create new channel",
      data: {},
      error: error.message || error,
    });
  }
};

export const getUserChannels = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channels = await Channel.find({
      members: userId // Simplified query: if user is in members, they are part of the channel
    }).populate({
      path: "members",
      select: "firstName lastName email _id image color"
    }).populate({ // Also populate the admin details
      path: "admin",
      select: "firstName lastName email _id image color"
    }).sort({ updatedAt: -1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Channels fetched successfully",
      data: channels,
      error: {},
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Cannot fetch all channel",
      data: {},
      error: error.message || error,
    });
  }
};

export const removeMemberFromChannel = async (req, res) => {
    try {
        const { channelId, memberId } = req.params;
        const { userId } = req; // This is the admin's ID

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Channel not found." });
        }

        // 1. Check if the requester is the admin
        if (channel.admin.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: "Only the channel admin can remove members." });
        }

        // 2. Check if the member to be removed is actually in the channel
        if (!channel.members.includes(memberId)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "User is not a member of this channel." });
        }

        // 3. Admin cannot remove themselves
        if (memberId === userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Admin cannot remove themselves from the channel." });
        }
        
        // Remove the member
        channel.members.pull(new mongoose.Types.ObjectId(memberId));
        await channel.save();

        const io = getIO();
        const removedUserSocketId = io.userSocketMap.get(memberId);
        
        // Notify the removed user in real-time
        if(removedUserSocketId){
            io.to(removedUserSocketId).emit("removed-from-channel", { channelId });
        }

        return res.status(StatusCodes.OK).json({ message: "Member removed successfully." });

    } catch (error) {
        console.error("Remove member error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to remove member." });
    }
};

export const getChannelMessages = async (req, res) => {
  try {
    const {channelId} = req.params;
    const channel = await Channel.findById(channelId).populate({path: "messages",populate:[{
      path: "sender",
      select: "firstName lastName email _id image color"
    },
    {path: "readBy", select: "firstName _id image color"}]
  })
  if(!channel){
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Channel not found"})
  }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Messages fetched successfully",
      data: channel.messages,
      error: {},
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Cannot fetch all messages",
      data: {},
      error: error.message || error,
    });
  }
};

export const leaveChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req;

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Channel not found." });
        }

        // An admin cannot leave the channel; they must delete it or transfer ownership (for simplicity, we'll enforce deletion).
        if (channel.admin.toString() === userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Admin cannot leave the channel. Please delete it instead." });
        }

        // Remove the user from the members list
        channel.members = channel.members.filter(memberId => memberId.toString() !== userId);
        await channel.save();
        
        // Optional: Notify other members that a user has left (can be added later)

        return res.status(StatusCodes.OK).json({ message: "You have successfully left the channel." });

    } catch (error) {
        console.error("Leave channel error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to leave channel." });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req;

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Channel not found." });
        }

        // Only the admin can delete the channel
        if (channel.admin.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: "You are not authorized to delete this channel." });
        }

        const io = getIO();
        // Emit an event to all members in the channel room BEFORE deleting
        io.to(channelId).emit("channel-deleted", { channelId });


        // Delete all messages associated with the channel to prevent orphaned data
        await Message.deleteMany({ _id: { $in: channel.messages } });

        // Delete the channel itself
        await Channel.findByIdAndDelete(channelId);

        return res.status(StatusCodes.OK).json({ message: "Channel and all its messages have been deleted." });

    } catch (error) {
        console.error("Delete channel error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete channel." });
    }
};