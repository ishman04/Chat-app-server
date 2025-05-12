import jwt from 'jsonwebtoken'

import StatusCodes from 'http-status-codes'
import User from '../schemas/userSchema.js';
import { compare } from 'bcrypt';

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