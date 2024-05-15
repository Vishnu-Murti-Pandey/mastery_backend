import express from 'express'
import dotenv from 'dotenv'
import fileUpload from 'express-fileupload'
import cors from 'cors'
import helmet from 'helmet'
import { limiter } from './config/rateLimiter.js'
const app = express();
dotenv.config();

const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"))
app.use(fileUpload());
app.use(helmet());
app.use(cors());
app.use(limiter);

//Import routes
import ApiRoutes from './routes/api.js'
app.use('/api', ApiRoutes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});