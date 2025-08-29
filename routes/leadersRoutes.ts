import { Router, Request, Response } from 'express';
import TypingTestModel from '../models/TypingTest';

const router = Router();

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
