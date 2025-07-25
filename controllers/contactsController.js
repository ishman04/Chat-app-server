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

    const terms = searchTerm
      .trim()
      .split(/\s+/)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // escape regex characters

    // One word: match either first or last name
    if (terms.length === 1) {
      const regex = new RegExp(terms[0], "i");
      const contacts = await User.find({
        _id: { $ne: req.userId },
        $or: [{ firstName: regex }, { lastName: regex }],
      }).select("firstName lastName email image color");

      return res.status(StatusCodes.OK).json({
        message: "Fetched contacts successfully",
        success: true,
        data: contacts,
        error: {},
      });
    }

    // Two or more words: match first word in first name and second in last name (and vice versa)
    const regex1 = new RegExp(terms[0], "i");
    const regex2 = new RegExp(terms[1], "i");

    const contacts = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { $and: [{ firstName: regex1 }, { lastName: regex2 }] },
        { $and: [{ firstName: regex2 }, { lastName: regex1 }] },
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


export const getAllContacts = async (req, res) => {
  try {
    // The fix is to select the 'email' field here.
    const users = await User.find(
      { _id: { $ne: req.userId } },
      "firstName lastName email _id"
    );

    const contacts = users.map((user) => {
      // This logic is now safe because user.email is guaranteed to exist.
      const label = user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user.email;
      return { label, value: user._id };
    });

    res.status(StatusCodes.OK).json({
      message: "Fetched all contacts successfully",
      success: true,
      data: contacts,
      error: {},
    });
  } catch (error) {
    console.error("Contact fetch Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch contacts",
      success: false,
      data: {},
      error: error.message,
    });
  }
};
