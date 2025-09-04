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
const TypingTest_1 = __importDefault(require("../models/TypingTest"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /typing-tests:
 *   get:
 *     summary: Get top typing tests
 *     description: Returns the top 10 typing tests across all users, sorted by CPM in descending order. User information (name, email, registered) is included in the response.
 *     tags: [Typing Tests]
 *     responses:
 *       200:
 *         description: List of top typing tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       wpm:
 *                         type: number
 *                       cpm:
 *                         type: number
 *                       accuracy:
 *                         type: number
 *                       mistakes:
 *                         type: number
 *                       difficultyLevel:
 *                         type: string
 *                       durationSec:
 *                         type: number
 *                       textLanguage:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           registered:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Failed to fetch typing tests
 */
router.get('/typing-tests', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Fetching typing tests with user populated...');
        const typingTests = yield TypingTest_1.default
            .find()
            .populate('user', 'name email registered')
            .sort({ cpm: -1 })
            .limit(10);
        console.log("Populated:", JSON.stringify(typingTests, null, 2));
        res.status(200).json({ tests: typingTests });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch typing tests' });
    }
}));
exports.default = router;
