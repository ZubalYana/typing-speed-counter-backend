import { Router, Request, Response } from 'express'
import UserModel from '../models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
import nodemailer from 'nodemailer'
import authMiddleware from '../middleware/AuthMiddleware'

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

router.post('/signUp', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already in use' })
        };

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new UserModel({ name, email, password: hashedPassword });
        await newUser.save()

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            },
        });

    } catch (error) {
        console.log(error)
        res.sendStatus(500).json({ message: 'Internal server error' })
    }
})

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.post('/remind-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res
                .status(200)
                .json({ message: 'If that email exists, a magic login link was sent.' });
        }

        // Create short-lived magic login token
        const magicToken = jwt.sign(
            { userId: user._id, purpose: 'magic-login' },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            console.error('Missing FRONTEND_URL in env'); // critical for link
            return res
                .status(500)
                .json({ message: 'Server configuration error (missing frontend URL)' });
        }

        const magicLink = `${frontendUrl.replace(/\/+$/, '')}/magic-login?token=${encodeURIComponent(
            magicToken
        )}`;

        // Setup transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // using STARTTLS
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify SMTP connection early (optional but helpful for debugging)
        try {
            await transporter.verify();
        } catch (verifyErr) {
            console.error('SMTP verification failed:', verifyErr);
            return res
                .status(500)
                .json({ message: 'Email service not available (SMTP verify failed)' });
        }

        // Send email
        await transporter.sendMail({
            from: `"Your App Name" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Your magic login link',
            text: `Click the link to log in (expires in 15 minutes): ${magicLink}`,
            html: `<p>Click the link to log in (expires in 15 minutes):<br /><a href="${magicLink}">${magicLink}</a></p>`,
        });

        return res
            .status(200)
            .json({ message: 'If that email exists, a magic login link was sent.' });
    } catch (error) {
        console.error('remind-password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/magic-login', async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        if (payload.purpose !== 'magic-login' || !payload.userId) {
            return res.status(400).json({ message: 'Invalid token payload' });
        }

        const user = await UserModel.findById(payload.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Issue your normal auth token (longer expiry)
        const authToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Login successful',
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('magic-login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/user-profile', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = await UserModel.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user })
})

export default router;