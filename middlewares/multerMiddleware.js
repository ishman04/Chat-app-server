import multer from "multer";
import path from 'path'

const storage = multer.diskStorage({
    destination: (req,file,next) => {
        next(null,'uploads');

    },
    filename: (req,file,next) => {
        const ext = path.extname(file.originalname)
        next(null, `${Date.now()}-${ext}`);
    }
})

export const uploader = multer({
    storage: storage,
})

