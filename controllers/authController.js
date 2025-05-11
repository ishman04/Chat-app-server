import jwt from 'jsonwebtoken'

import StatusCodes from 'http-status-codes'
import User from '../repositories/userRepository.js';

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
                .status(StatusCodes.ACCEPTED)
                .json({
                    message: 'User created successfully',
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
                    data: {},
                    error: error.message
                })
    }
}