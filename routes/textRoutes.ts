import { Router, Request, Response } from 'express';
import TextModel from '../models/Text';
import { IText } from '../interfaces/Text';

const router = Router();

router.post('/text', async (req: Request<{}, {}, IText>, res: Response) => {
    try {
        const { text, date, language, difficaltyLevel } = req.body;
        const newText = new TextModel({ text, date, language, difficaltyLevel });
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

        const difficulty = req.query.difficultyLevel;
        if (difficulty) {
            pipeline.push({ $match: { difficultyLevel: difficulty } });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/texts', async (req: Request, res: Response) => {
    const texts = await TextModel.find();
    res.status(200).json(texts);
})

router.put('/texts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { language, text, difficaltyLevel } = req.body;
    try {
        const updatedText = await TextModel.findByIdAndUpdate(
            id,
            { language, text, difficaltyLevel },
            { new: true }
        );
        res.status(200).json(updatedText);
    } catch (err) {
        res.status(500).json({ message: 'Error updating text' })
    }
})

router.delete('/texts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await TextModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Text deleted successfully' })
    } catch (err) {
        res.status(500).json({ message: 'Error deleting text' })
    }
})

export default router;