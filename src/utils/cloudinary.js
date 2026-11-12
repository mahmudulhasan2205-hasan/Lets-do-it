import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryUpload = async (localFilePath) => {
try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {resource_type: 'auto'});
    //console.log("File is uploaded on Cloudinary", response.url);
    fs.unlinkSync(localFilePath); // Delete the local file after successful upload
    return response;
}
catch (error) {
    fs.unlinkSync(localFilePath); // Delete the local file in case of an error
    return null;

}
}

export {cloudinaryUpload as uploadOnCloudinary}