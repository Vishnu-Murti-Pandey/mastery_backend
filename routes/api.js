import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import ProfileController from "../controllers/ProfileController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import NewsController from "../controllers/NewsController.js";
import redisCache from '../db/redisConfig.js'

const router = Router();

// auth route
router.post('/auth/register', AuthController.register);
router.get('/auth/login', AuthController.login);

// profile route
router.get('/profile', authMiddleware, ProfileController.index);

// Image upload
router.put('/profile/:id', authMiddleware, ProfileController.update);

// News route
router.get('/news', redisCache.route(), NewsController.index);
router.post('/news', authMiddleware, NewsController.store);
router.get('/news/:id', NewsController.show);
router.put('/news/:id', authMiddleware, NewsController.update);
router.delete('/news/:id', authMiddleware, NewsController.destroy);

export default router;