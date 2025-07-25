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
    console.log("this is the file:",req.file)
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'No file uploaded',
        success: false
      });
    }
    console.log('Uploaded file:', req.file); // Log file details
    // Check if file was successfully uploaded to Cloudinary
    if (!req.file.path) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'File upload failed',
        success: false
      });
    }

    return res.status(StatusCodes.OK).json({ 
      message: 'File uploaded successfully',
      success: true,
      data: {
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      }
    });
    
  } catch (error) {
    console.error("File upload error: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to upload file",
      success: false,
      error: error.message,
    });
  }
};

