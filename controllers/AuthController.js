import prisma from "../db/db.config.js";
import vine, { errors } from "@vinejs/vine";
import { loginSchema, registerSchema } from "../validations/authValidation.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

class AuthController {
    static async register(req, res) {
        try {
            const body = req.body;
            const validator = vine.compile(registerSchema);
            const payload = await validator.validate(body);

            // Check if email exist
            const findUser = await prisma.users.findUnique({
                where: {
                    email: payload.email
                }
            });
            if (findUser) {
                return res.status(400).json({
                    errors: {
                        email: 'Email already teken. Please use another one.'
                    }
                });
            }

            // Password Encryption
            const hashedPassword = await bcrypt.hash(payload.password, 10);
            payload.password = hashedPassword;

            const user = await prisma.users.create({
                data: payload
            });

            return res.status(200).json({ message: 'User created successfully', user });
        } catch (error) {
            if (error instanceof errors.E_VALIDATION_ERROR) {
                return res.status(400).json({ errors: error.messages });
            } else {
                return res.status(500).json({ message: 'Internal server error' });
            }
        }
    }

    static async login(req, res) {
        try {
            const body = req.body;
            const validator = vine.compile(loginSchema);
            const payload = await validator.validate(body);

            // Check if email exist
            const findUser = await prisma.users.findUnique({
                where: {
                    email: payload.email
                }
            });
            if (!findUser) {
                return res.status(400).json({
                    errors: {
                        email: 'User doesnot exist. Please register'
                    }
                });
            } else {
                // Password Decryption
                const isPasswordExist = await bcrypt.compare(payload.password, findUser.password);
                if (!isPasswordExist) {
                    return res.status(400).json({
                        errors: {
                            email: 'Incorrect Password'
                        }
                    });
                }
                // JWT token issue
                const tokenPayload = {
                    id: findUser.id,
                    name: findUser.name,
                    email: findUser.email,
                    password: findUser.password,
                    profile: findUser.profile
                }
                const token = jwt.sign({ user: tokenPayload }, process.env.JWT_SECRET_KEY, {
                    expiresIn: '365d',
                });

                return res.status(200).json({
                    message: 'User logged in successfully',
                    access_token: `Bearer ${token}`
                });
            }
        } catch (error) {
            if (error instanceof errors.E_VALIDATION_ERROR) {
                return res.status(400).json({ errors: error.messages });
            } else {
                return res.status(500).json({ message: 'Internal server error' });
            }
        }

    }
}

export default AuthController;