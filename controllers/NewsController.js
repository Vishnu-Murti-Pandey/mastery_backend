import vine, { errors } from "@vinejs/vine"
import { newsSchema } from "../validations/newsValiation.js";
import { generateRandomNumber, imageValidator, removeImage, uploadImage } from "../utils/helper.js";
import prisma from "../db/db.config.js";
import NewsApiTransform from "../transform/newsApiTransform.js";
import redisCache from "../db/redisConfig.js";

class NewsController {

    static async index(req, res) {

        // pagination logic
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        if (page <= 0) {
            page = 1;
        }
        if (limit > 100) {
            limit = 10;
        }

        const skip = (page - 1) * limit;

        try {
            const news = await prisma.news.findMany({
                take: limit,
                skip: skip,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profile: true
                        }
                    }
                }
            });
            const newsTransform = news?.map((item) => {
                return NewsApiTransform.transform(item)
            });

            const totalNews = await prisma.news.count();
            const totalPages = Math.ceil(totalNews / limit);

            return res.status(200).json({
                news: newsTransform,
                metadata: {
                    totalPages,
                    currentPage: page,
                    currentLimit: limit
                }
            });

        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }

    }

    static async store(req, res) {
        try {
            const user = req.user;
            const body = req.body;

            const validator = vine.compile(newsSchema);
            const payload = await validator.validate(body);

            // Image upload
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).json({ message: 'Image is required' });
            }

            const newsImage = req.files.image;
            const message = imageValidator(newsImage?.size, newsImage.mimetype);
            if (message !== null) {
                return res.status(400).json({
                    errors: {
                        profile: message
                    }
                });
            }

            // upload image
            const imageName = uploadImage(newsImage);

            payload.image = imageName;
            payload.user_id = user.id;

            const news = await prisma.news.create({
                data: payload
            });

            // redis cache
            redisCache.del("/api/news", (err) => {
                if (err) {
                    throw err;
                }
            });

            return res.status(200).json({ message: "News created successfully", news });
        } catch (error) {
            if (error instanceof errors.E_VALIDATION_ERROR) {
                return res.status(400).json({ errors: error.messages });
            } else {
                return res.status(500).json({ message: 'Internal server error' });
            }
        }

    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const news = await prisma.news.findUnique({
                where: {
                    id: Number(id)
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profile: true
                        }
                    }
                }
            });

            const transformNews = news ? NewsApiTransform.transform(news) : null;
            return res.status(200).json({ news: transformNews });
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }

    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const body = req.body;
            const news = await prisma.news.findUnique({
                where: {
                    id: Number(id)
                },
            });

            // check if creater and requester are same person
            if (user.id !== news.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const validator = vine.compile(newsSchema);
            const payload = await validator.validate(body);

            const image = req?.files?.image;
            let imageName;

            if (image) {
                const message = imageValidator(image?.size, image.mimetype);
                if (message !== null) {
                    return res.status(400).json({
                        errors: {
                            image: message
                        }
                    });
                }
                // upload image
                imageName = uploadImage(image);
                payload.image = imageName;
                // delete old image
                removeImage(news.image);
            }

            await prisma.news.update({
                data: payload,
                where: {
                    id: Number(id)
                }
            });

            return res.status(200).json({ message: 'News updated successfully' });
        } catch (error) {
            if (error instanceof errors.E_VALIDATION_ERROR) {
                return res.status(400).json({ errors: error.messages });
            } else {
                return res.status(500).json({ message: 'Internal server error' });
            }
        }
    }

    static async destroy(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const news = await prisma.news.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (user.id !== news?.user_id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // delete image from file system
            removeImage(news.image);

            await prisma.news.delete({
                where: {
                    id: Number(id)
                }
            });

            res.status(200).json({ message: 'News deleted successfully' });
        } catch (error) {
            if (error) {
                return res.status(500).json({ message: 'Internal server error' });
            }
        }

    }
}

export default NewsController;