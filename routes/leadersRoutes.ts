import { Router, Request, Response } from 'express';
import TypingTestModel from '../models/TypingTest';

const router = Router();

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
router.get('/typing-tests', async (req: Request, res: Response) => {
    try {
        console.log('Fetching typing tests with user populated...');
        const typingTests = await TypingTestModel
            .find()
            .populate('user', 'name email registered')
            .sort({ cpm: -1 })
            .limit(10);

        console.log("Populated:", JSON.stringify(typingTests, null, 2));
        res.status(200).json({ tests: typingTests });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch typing tests' });
    }
});

export default router; 
