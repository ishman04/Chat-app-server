import jwt from 'jsonwebtoken'

import StatusCodes from 'http-status-codes'
import User from '../schemas/userSchema.js';
import { compare } from 'bcrypt';
import fs from 'fs/promises'


const maxAge = 3*24*60*60*1000

const createToken = (email,userId) => {
    return jwt.sign({email,userId},process.env.JWT_KEY,{expiresIn: maxAge});
}

export const signup = async (req,res,next) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({message: 'Please provide both email and password'})
        }
        const user = await User.create({email,password});
        res.cookie("jwt",createToken(email,user.id),{
            maxAge,
            secure:true,
            sameSite: "None"
        })
        return res
                .status(StatusCodes.CREATED)
                .json({
                    message: 'User created successfully',
                    success: true,
                    data: {
                        id: user.id,
                        email: user.email,
                        profileSetup: user.profileSetup
                    },
                    error: {}
                })
        
    } catch (error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to create user',
                    success: false,
                    data: {},
                    error: error.message
                })
    }
}

export const login = async (req,res,next) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({message: 'Please provide both email and password'})
        }
        const user = await User.findOne({email: email});
        if(!user){
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        message: 'User with given email not found',
                        success: false,
                        data: {},
                        error: {}
                    })
        }
        const auth = await compare(password,user.password)
        if(!auth){
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        message: 'Invalid password',
                        success: false,
                        data: {},
                        error: {}
                    })
        }
        res.cookie("jwt",createToken(email,user.id),{
            maxAge,
            secure:true,
            sameSite: "None"
        })
        return res
                .status(StatusCodes.ACCEPTED)
                .json({
                    message: 'User logged in successfully',
                    success: true,
                    data: {
                        id: user.id,
                        email: user.email,
                        profileSetup: user.profileSetup,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        image: user.image,
                        color: user.color

                    },
                    error: {}
                })
        
    } catch (error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to create user',
                    success: false,
                    data: {},
                    error: error.message
                })
    }
}

export const getUserInfo = async (req,res,next) => {
    try {
        const userData = await User.findById(req.userId);
        if(!userData){
            return res
                    .status(StatusCodes.NOT_FOUND)
                    .json({
                        message: 'User not found',
                        success: false,
                        data: {},
                        error: {}
                        })

        }
        
        return res
                .status(StatusCodes.OK)
                .json({
                    message: 'User details fetched successfully',
                    success: true,
                    data: {
                        id: userData.id,
                        email: userData.email,
                        profileSetup: userData.profileSetup,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        image: userData.image,
                        color: userData.color

                    },
                    error: {}
                })
        
    } catch (error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to get user details',
                    success: false,
                    data: {},
                    error: error.message
                })
    }
}

export const updateProfile = async (req,res,next) => {
    try {
        const {userId} = req
        const {firstName,lastName,color} = req.body
        console.log('First name ', firstName, " last name ",lastName)
        if(!firstName || !lastName){
            return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        message: 'First name, last name missing',
                        success: false,
                        data: {},
                        error: {}
                        })

        }
        const userData = await User.findByIdAndUpdate(userId,{
            firstName, lastName, color, profileSetup: true
        }, {new:true, runValidators:true});

        
        return res
                .status(StatusCodes.OK)
                .json({
                    message: 'Profile updated successfully',
                    success: true,
                    data: {
                        id: userData.id,
                        email: userData.email,
                        profileSetup: userData.profileSetup,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        image: userData.image,
                        color: userData.color

                    },
                    error: {}
                })
        
    } catch (error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to update user profile',
                    success: false,
                    data: {},
                    error: error.message
                })
    }
}

export const addProfileImage = async (req, res) => {
  try {
    const imagePath = req.file?.path;
    const {userId} = req;

    if (!imagePath) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
    }
    const user = await User.findByIdAndUpdate(userId, { image: imagePath }, { new: true, runValidators:true});
    return res
            .status(StatusCodes.OK)
            .json({ message: 'Profile image updated successfully',
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    profileSetup: user.profileSetup,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    image: user.image,
                    color: user.color
                }
            })

}
    catch{
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to add user image',
                    success: false,
                    data: {},
                    error: error.message
                })

    }
};

export const removeProfileImage = async (req,res,next) => {
    try {
        return res
                .status(StatusCodes.OK)
                .json({
                    message: 'Profile updated successfully',
                    success: true,
                    data: {
                        id: userData.id,
                        email: userData.email,
                        profileSetup: userData.profileSetup,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        image: userData.image,
                        color: userData.color

                    },
                    error: {}
                })
        
    } catch (error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Failed to update user profile',
                    success: false,
                    data: {},
                    error: error.message
                })
    }
}