import { supportedMimes } from '../config/fileSystem.js'
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs'

export const imageValidator = (size, mime) => {
    if (bytesToMb(size) > 2) {
        return "Image size must be less than 2 mb"
    } else if (!supportedMimes.includes(mime)) {
        return "Image must be type of png, jpg, jpeg, svg, webp, gif";
    }
    return null;
}

export const bytesToMb = (bytes) => {
    return bytes / (1024 * 1024);
}

export const generateRandomNumber = () => {
    return uuidv4();
}

export const getImageUrl = (imgName) => {
    return `${process.env.APP_URL}/images/${imgName}`
}

export const removeImage = (imageName) => {
    const path = process.cwd() + '/public/images/' + imageName;
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
    }
}

// upload image
export const uploadImage = (newsImage) => {

    const imgExt = newsImage?.name.split(".");
    const imageName = generateRandomNumber() + "." + imgExt[1];
    const uploadPath = process.cwd() + '/public/images/' + imageName;

    newsImage.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Something went wrong, try again' });
        }
    });

    return imageName;
}