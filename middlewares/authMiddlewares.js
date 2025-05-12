import jwt from 'jsonwebtoken'
import StatusCodes from 'http-status-codes'

export const verifyToken = (req,res,next) => {
    const token = req.cookies.jwt;
    if(!token){
        return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({message: 'No token provided'});
    }
    jwt.verify(token, process.env.JWT_KEY, async(err,payload) => {
        if(err) return res.status(StatusCodes.FORBIDDEN).json({message: 'Invalid token'})
        req.userId = payload.userId;
        next();
    })
}