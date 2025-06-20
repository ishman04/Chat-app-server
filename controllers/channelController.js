import User from '@/schema/userSchema.js'
import { StatusCodes } from 'http-status-codes';
import Channel from '../schemas/channelModel';

export const createChannel = async(req,res) => {
    try {
        const {name, members} = req.body;
        const userId = req.userId
        const admin = await User.findById(userId);
        if(!admin){
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: "Admin user not found"
            })
        }
        const validMembers = User.find({
            _id: {$in:members}
        })
        if(validMembers.length !== members.length){
            return res.status(StatusCodes.BAD_REQUEST)
                        .json({
                            error: "Invalid members"
                        })
        }
        const newChannel = await Channel.create({
            name,
            members,
            admin: userId
            });
        await newChannel.save();
        return res.status(StatusCodes.CREATED)
        .json({
            success:true,
            message: "Channel created successfully",
            data: newChannel,
            error: {}
            })
    } catch (error) {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({
                success: false,
                message: "Cannot create new channel",
                data: {},
                error: error
            })
    }
}