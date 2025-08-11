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
        const lang = req.query.lang;
        let pipeline: any[] = [];

        if (lang) {
            pipeline.push({ $match: { language: lang } })
        }

        pipeline.push({ $sample: { size: 1 } })
        const result = await TextModel.aggregate(pipeline)


        if (lang && (!result || result.length === 0)) {
            const fallback = await TextModel.aggregate([{ $sample: { size: 1 } }]);
            res.json(fallback[0]);
        } else {
            res.json(result[0]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/texts', async (req: Request, res: Response) => {
    const texts = await TextModel.find();
    res.json(texts);
})

export default router;