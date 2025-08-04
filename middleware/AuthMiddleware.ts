import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const authMiddleware = (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or malformed Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload: any = jwt.verify(token, JWT_SECRET);
        (req as any).userId = payload.userId;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export default authMiddleware;