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
const nodemailer_1 = __importDefault(require("nodemailer"));
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
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
router.post('/remind-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email is required' });
        }
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return res
                .status(200)
                .json({ message: 'If that email exists, a magic login link was sent.' });
        }
        // Create short-lived magic login token
        const magicToken = jsonwebtoken_1.default.sign({ userId: user._id, purpose: 'magic-login' }, JWT_SECRET, { expiresIn: '15m' });
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            console.error('Missing FRONTEND_URL in env'); // critical for link
            return res
                .status(500)
                .json({ message: 'Server configuration error (missing frontend URL)' });
        }
        const magicLink = `${frontendUrl.replace(/\/+$/, '')}/magic-login?token=${encodeURIComponent(magicToken)}`;
        // Setup transporter
        const transporter = nodemailer_1.default.createTransport({
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
            yield transporter.verify();
        }
        catch (verifyErr) {
            console.error('SMTP verification failed:', verifyErr);
            return res
                .status(500)
                .json({ message: 'Email service not available (SMTP verify failed)' });
        }
        // Send email
        yield transporter.sendMail({
            from: `"Your App Name" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Your magic login link',
            text: `Click the link to log in (expires in 15 minutes): ${magicLink}`,
            html: `<p>Click the link to log in (expires in 15 minutes):<br /><a href="${magicLink}">${magicLink}</a></p>`,
        });
        return res
            .status(200)
            .json({ message: 'If that email exists, a magic login link was sent.' });
    }
    catch (error) {
        console.error('remind-password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.post('/magic-login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (_a) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        if (payload.purpose !== 'magic-login' || !payload.userId) {
            return res.status(400).json({ message: 'Invalid token payload' });
        }
        const user = yield User_1.default.findById(payload.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Issue your normal auth token (longer expiry)
        const authToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login successful',
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('magic-login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
router.get('/user-profile', AuthMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const user = yield User_1.default.findById(userId).select('-password');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
}));
exports.default = router;
