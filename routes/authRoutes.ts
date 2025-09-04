import { Router, Request, Response } from 'express'
import UserModel from '../models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
import authMiddleware from '../middleware/AuthMiddleware'
import { Resend } from 'resend'

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * @swagger
 * /signUp:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with name, email, and password. Returns a JWT token and user details.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates a user with email and password. Returns a JWT token and user details.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user-profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns the authenticated user's profile (excluding password).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/user-profile', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = await UserModel.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user })
})

/**
 * @swagger
 * /magic-login:
 *   post:
 *     summary: Request a magic login link
 *     description: Sends a magic login link to the user's email. If the email is not registered, returns a generic success message.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Magic login link sent (or would be if email exists)
 *       400:
 *         description: Email is required
 */
router.post('/magic-login', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await UserModel.findOne({ email });
    if (!user) {
        return res.status(200).json({ message: 'If that email exists, a magic login link was sent.' });
    }

    const magicToken = jwt.sign({ userId: user._id, purpose: 'magic-login' }, JWT_SECRET, { expiresIn: '15m' });
    const magicLink = `${process.env.FRONTEND_URL}/magic-login?token=${encodeURIComponent(magicToken)}`;

    await resend.emails.send({
        from: process.env.FROM_EMAIL as string,
        to: email,
        subject: 'Your magic login link',
        html: `<p>Click here: <a href="${magicLink}">${magicLink}</a></p>`,
    });

    res.status(200).json({ message: 'Magic login link sent.' });
});

/**
 * @swagger
 * /magic-login/verify:
 *   post:
 *     summary: Verify a magic login token
 *     description: Verifies the magic login token and returns a standard JWT token for authenticated sessions.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Magic login successful, JWT returned
 *       400:
 *         description: Invalid or expired token
 */
router.post('/magic-login/verify', async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
        if (payload.purpose !== 'magic-login') {
            return res.status(400).json({ message: 'Invalid token purpose' });
        }

        const loginToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token: loginToken });
    } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
});

export default router;