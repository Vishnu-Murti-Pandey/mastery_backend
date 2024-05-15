import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader || authHeader === undefined) {
        return res.status(401).json({ error: 'Access denied' });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized user, Invalid token' });
    }
}

export default authMiddleware;