"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const resend_1 = require("resend");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
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
router.post('/signUp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already in use' });
        }
        ;
        const saltRounds = 10;
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        const newUser = new User_1.default({ name, email, password: hashedPassword });
        yield newUser.save();
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, JWT_SECRET, {
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
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500).json({ message: 'Internal server error' });
    }
}));
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
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
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
router.get('/user-profile', AuthMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const user = yield User_1.default.findById(userId).select('-password');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
}));
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
router.post('/magic-login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email is required' });
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        return res.status(200).json({ message: 'If that email exists, a magic login link was sent.' });
    }
    const magicToken = jsonwebtoken_1.default.sign({ userId: user._id, purpose: 'magic-login' }, JWT_SECRET, { expiresIn: '15m' });
    const magicLink = `${process.env.FRONTEND_URL}/magic-login?token=${encodeURIComponent(magicToken)}`;
    yield resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Your magic login link',
        html: `<p>Click here: <a href="${magicLink}">${magicLink}</a></p>`,
    });
    res.status(200).json({ message: 'Magic login link sent.' });
}));
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
router.post('/magic-login/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ message: 'Token is required' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (payload.purpose !== 'magic-login') {
            return res.status(400).json({ message: 'Invalid token purpose' });
        }
        const loginToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: loginToken });
    }
    catch (err) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
}));
exports.default = router;
