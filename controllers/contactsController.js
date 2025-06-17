import { StatusCodes } from "http-status-codes"
import User from "../schemas/userSchema.js";
import mongoose from "mongoose";
import Message from "../schemas/messageSchema.js";

export const searchContacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Search term is required",
      });
    }

    // Escape regex characters and build case-insensitive pattern
    const sanitizedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedSearchTerm, "i");

    // Search only in firstName and lastName, exclude current user
    const contacts = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { firstName: regex },
        { lastName: regex },
      ],
    }).select("firstName lastName email image color");

    res.status(StatusCodes.OK).json({
      message: "Fetched contacts successfully",
      success: true,
      data: contacts,
      error: {},
    });
  } catch (error) {
    console.error("Contact Search Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch contacts",
      success: false,
      data: {},
      error: error.message,
    });
  }
};

export const getContactsForDMList = async (req, res) => {
  try {
    let {userId} = req;

    userId = new mongoose.Types.ObjectId(userId);
    const contacts = await Message.aggregate([{
      $match: {
        $or:[{sender:userId},{recipient:userId}]
      }
    },
    {
      $sort: {timestamp: -1}
    },
    {
      $group:{
        _id:{
          $cond:{
            if:{$eq:["$sender",userId]},
            then: "$recipient",
            else: "$sender"
          },
        },
        lastMessageTime: {$first: "$timestamp"}
      }
    },
    {
      $lookup:{
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "contactInfo"
      }
    },
    {
      $unwind: "$contactInfo"
    },
    {
      $project:{
        _id:1,
        lastMessageTime: 1,
        firstName : "$contactInfo.firstName",
        lastName: "$contactInfo.lastName",
        image: "$contactInfo.image",
        color: "$contactInfo.color"
      }
    },
    {
      $sort: {lastMessageTime: -1}
    }
  ])

    res.status(StatusCodes.OK).json({
      message: "Fetched contacts successfully",
      success: true,
      data: contacts,
      error: {},
    });
  } catch (error) {
    console.error("Contact Search Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch contacts",
      success: false,
      data: {},
      error: error.message,
    });
  }
};
