import { StatusCodes } from "http-status-codes"
import User from "../schemas/userSchema.js";

export const searchContacts = async(req,res) => {
    try {
        const {searchTerm} = req.body

        if(searchTerm === undefined || searchTerm === null){
            return res.status(StatusCodes.BAD_REQUEST).json({error: "Search term is required"})
        }
         const sanitizedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         const regex = new RegExp(sanitizedSearchTerm,'i')

         const contacts = await User.find({
            $and: [{_id: {$ne: req.userId}},
                    {$or: [{firstName: regex},{lastName: regex},{email:regex}]}
             ]
         })
        res
            .status(StatusCodes.OK)
            .json({
                message: 'Fetched contacts successfully',
                success: true,
                data: contacts,
                error: {}
            })
        
    } catch (error) {
        console.log(error)
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Failed to fetch contacts',
                success: false,
                data: {},
                error: error.message
            })
    }
    
}