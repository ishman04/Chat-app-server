import mongoose from "mongoose";
import User from "../schemas/userSchema.js";
import {StatusCodes} from 'http-status-codes'
import Channel from "../schemas/channelSchema.js";

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
      $or: [{
        admin:userId
      },
      {
        members:userId
      }
    ]
    }).sort({updatedAt:-1})

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

export const getChannelMessages = async (req, res) => {
  try {
    const {channelId} = req.params;
    const channel = await Channel.findById(channelId).populate({path: "messages",populate:{
      path: "sender",
      select: "firstName lastName email _id image color"
    }
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