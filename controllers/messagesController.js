import { StatusCodes } from "http-status-codes"
import User from "../schemas/userSchema.js";
import Message from "../schemas/messageSchema.js"

export const getMessages = async (req, res) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;

    if (!user1|| !user2) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Both user ids are required",
      });
    }

    const messages = await Message.find({
        $or :[
            {sender:user1,recipient:user2},
            {sender:user2,recipient:user1}
        ],
    }).sort({timestamp: 1});

    res.status(StatusCodes.OK).json({
      message: "Fetched messages successfully",
      success: true,
      data: messages,
      error: {},
    });
  } catch (error) {
    console.error("Messages fetch Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch messages",
      success: false,
      data: {},
      error: error.message,
    });
  }
};

export const uploadFile = async (req, res) => {
  try {
    const imagePath = req.file?.path;

    if (!imagePath) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
    }
    return res
            .status(StatusCodes.OK)
            .json({ message: 'Profile image updated successfully',
                success: true,
                data: {
                  filePath: imagePath
                }
            })
  } catch (error) {
    console.error("File send error: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to send file",
      success: false,
      data: {},
      error: error.message,
    });
  }
};

