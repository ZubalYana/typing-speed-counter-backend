import { Router, Request, Response } from 'express';
import TextModel from '../models/Text';
import { IText } from '../interfaces/Text';

const router = Router();

router.post('/text', async (req: Request<{}, {}, IText>, res: Response) => {
    try {
        const { text, date } = req.body;
        const newText = new TextModel({ text, date });
        await newText.save();
        res.status(201).json(newText);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/random-text', async (req: Request, res: Response) => {
    try {
        const result = await TextModel.aggregate([{ $sample: { size: 1 } }]);
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
