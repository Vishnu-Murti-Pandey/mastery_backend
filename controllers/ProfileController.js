import prisma from '../db/db.config.js';
import { generateRandomNumber, imageValidator } from '../utils/helper.js';


class ProfileController {
    static async index(req, res) {
        try {
            const user = req.user
            return res.status(200).json({ user });
        } catch (error) {
            res.status(500).json({ message: 'Server error' })
        }
    }

    static async store() {

    }

    static async show() {

    }

    static async update(req, res) {
        try {
            const { id } = req.params;

            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).json({ message: 'Profle image is required' });
            }

            const profile = req.files.profile;
            const message = imageValidator(profile?.size, profile.mimetype);
            if (message !== null) {
                return res.status(400).json({
                    errors: {
                        profile: message
                    }
                });
            }

            const imgExt = profile?.name.split(".");
            const imageName = generateRandomNumber() + "." + imgExt[1];
            const uploadPath = process.cwd() + '/public/images/' + imageName;

            profile.mv(uploadPath, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Something went wrong, try again' });
                }
            });

            await prisma.users.update({
                data: {
                    profile: imageName
                },
                where: {
                    id: Number(id)
                }
            });

            return res.status(200).json({ message: 'Profile updated successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Something went wrong, try again' });
        }


    }

    static async destory() {

    }
}

export default ProfileController;