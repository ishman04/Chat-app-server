// multerMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat-app-profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `profile_${Date.now()}`
  },
});
export const profileUploader = multer({ storage: profileStorage });


// Storage for chat files (images + files)
const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
  const fileExt = file.originalname.split('.').pop().toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];

  let resource_type = 'raw'; // default to raw
  let folder = 'chat-app-files';
  let allowed_formats = null;

  if (imageExtensions.includes(fileExt)) {
    resource_type = 'image';
    folder = 'chat-app-images';
    allowed_formats = imageExtensions;
  } else if (videoExtensions.includes(fileExt)) {
    resource_type = 'video';
    folder = 'chat-app-videos';
    allowed_formats = videoExtensions;
    
  }
   const params = {
      folder,
      resource_type,
      public_id: `file_${Date.now()}`,
      chunk_size: 6000000,
    };

    if (allowed_formats) {
      params.allowed_formats = allowed_formats;
    }

    return params;

},
});
export const fileUploader = multer({ storage: fileStorage });
