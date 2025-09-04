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
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const TypingTest_1 = __importDefault(require("../models/TypingTest"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Certificate_1 = __importDefault(require("../models/Certificate"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /typing-tests:
 *   post:
 *     summary: Save a new typing test
 *     tags: [Typing Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wpm, cpm, accuracy, mistakes, difficultyLevel, textLanguage]
 *             properties:
 *               wpm:
 *                 type: number
 *               cpm:
 *                 type: number
 *               accuracy:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               mistakes:
 *                 type: number
 *               difficultyLevel:
 *                 type: string
 *               durationSec:
 *                 type: number
 *               textId:
 *                 type: string
 *               textLanguage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Typing test created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/typing-tests', AuthMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { wpm, cpm, accuracy, mistakes, difficultyLevel, durationSec, textId, textLanguage } = req.body;
        if (typeof wpm !== 'number' || wpm < 0) {
            return res.status(400).json({ message: 'WPM must be a non-negative number' });
        }
        if (typeof cpm !== 'number' || cpm < 0) {
            return res.status(400).json({ message: 'CPM must be a non-negative number' });
        }
        if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
            return res.status(400).json({ message: 'Accuracy must be a number between 0 and 100' });
        }
        if (typeof mistakes !== 'number' || mistakes < 0) {
            return res.status(400).json({ message: 'Mistakes must be a non-negative number' });
        }
        if (!textLanguage || typeof textLanguage !== 'string' || textLanguage.trim() === '') {
            return res.status(400).json({ message: 'textLanguage is required and must be a non-empty string' });
        }
        if (!difficultyLevel || typeof difficultyLevel !== 'string' || difficultyLevel.trim() === '') {
            return res.status(400).json({ message: 'difficultyLevel is required and must be a non-empty string' });
        }
        const newTest = new TypingTest_1.default({
            user: userId,
            wpm,
            cpm,
            accuracy,
            mistakes,
            difficultyLevel,
            durationSec,
            textId,
            textLanguage: textLanguage.trim(),
        });
        yield newTest.save();
        let newCertificate = null;
        const minimum_accuracy_threshold = 90;
        const user = yield User_1.default.findById(userId);
        if (user && cpm > (user.bestCpm || 0) && accuracy >= minimum_accuracy_threshold) {
            user.bestCpm = cpm;
            const validationId = crypto_1.default.randomBytes(8).toString("hex");
            newCertificate = new Certificate_1.default({
                userId,
                cpm,
                accuracy,
                validationId,
                language: textLanguage.trim(),
                userName: user.name,
                mistakes,
                difficultyLevel,
                time: durationSec
            });
            yield newCertificate.save();
            user.certificates.push(newCertificate._id);
            yield user.save();
        }
        return res.status(201).json({
            message: 'Test saved',
            test: newTest,
            certificate: newCertificate ? newCertificate : null,
        });
    }
    catch (err) {
        console.error('saving typing test error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
/**
 * @swagger
 * /typing-tests:
 *   get:
 *     summary: Get typing tests of the authenticated user
 *     tags: [Typing Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of tests to return
 *     responses:
 *       200:
 *         description: List of typing tests
 *       500:
 *         description: Internal server error
 */
router.get('/typing-tests', AuthMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
        const tests = yield TypingTest_1.default.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("user", "name email")
            .lean();
        return res.status(200).json({ tests });
    }
    catch (err) {
        console.error('fetching typing tests error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
/**
 * @swagger
 * /typing-tests/leaders:
 *   get:
 *     summary: Get global leaderboard
 *     description: Returns the top typing test results across all users, sorted by CPM in descending order.
 *     tags: [Typing Tests]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of leaderboard entries to return.
 *     responses:
 *       200:
 *         description: List of top typing test results
 *       500:
 *         description: Internal server error
 */
router.get('/typing-tests/leaders', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
        const tests = yield TypingTest_1.default.find({})
            .sort({ cpm: -1 })
            .limit(limit)
            .populate("user", "name email")
            .lean();
        return res.status(200).json({ tests });
    }
    catch (err) {
        console.error('fetching leaders error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
/**
 * @swagger
 * /typing-tests/summary:
 *   get:
 *     summary: Get weekly typing performance summary
 *     description: Returns the average WPM, average accuracy, and total tests completed by the authenticated user over the last 7 days.
 *     tags: [Typing Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly typing performance summary
 *       500:
 *         description: Internal server error
 */
router.get('/typing-tests/summary', AuthMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const summary = yield TypingTest_1.default.aggregate([
            { $match: { user: new (require('mongoose').Types.ObjectId)(userId), createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: null,
                    avgWpm: { $avg: '$wpm' },
                    avgAccuracy: { $avg: '$accuracy' },
                    totalTests: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    avgWpm: { $round: ['$avgWpm', 2] },
                    avgAccuracy: { $round: ['$avgAccuracy', 2] },
                    totalTests: 1,
                },
            },
        ]);
        return res.status(200).json({ summary: summary[0] || { avgWpm: 0, avgAccuracy: 0, totalTests: 0 } });
    }
    catch (err) {
        console.error('typing test summary error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
/**
 * @swagger
 * /cpm-statistics:
 *   get:
 *     summary: Get CPM statistics for the last 20 days
 *     description: Returns up to the last 20 typing test results (CPM, mistakes, date) for the authenticated user, filtered by language.
 *     tags: [Typing Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         required: true
 *         description: Language of typing tests to filter (e.g., "english", "french").
 *     responses:
 *       200:
 *         description: CPM statistics for the last 20 days
 *       400:
 *         description: Language query parameter missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get('/cpm-statistics', AuthMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { language } = req.query;
        if (!language || typeof language !== 'string') {
            return res.status(400).json({ message: 'Language query parameter is required' });
        }
        const lastTwentyDays = new Date();
        lastTwentyDays.setDate(lastTwentyDays.getDate() - 20);
        const statistics = yield TypingTest_1.default.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(userId),
                    textLanguage: language,
                    createdAt: { $gte: lastTwentyDays }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
                $project: {
                    _id: 0,
                    cpm: 1,
                    mistakes: 1,
                    createdAt: 1,
                    textLanguage: 1
                }
            }
        ]);
        return res.status(200).json(statistics);
    }
    catch (error) {
        console.error('Error getting cpm statistics:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.default = router;
