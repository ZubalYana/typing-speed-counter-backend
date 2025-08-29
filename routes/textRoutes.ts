import { Router, Request, Response } from 'express';
import TextModel from '../models/Text';
import { IText } from '../interfaces/Text';

const router = Router();

router.post('/text', async (req: Request<{}, {}, IText>, res: Response) => {
    try {
        const { text, date, language, difficultyLevel } = req.body;
        const newText = new TextModel({ text, date, language, difficultyLevel });
        await newText.save();
        res.status(201).json(newText);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/random-text", async (req, res) => {
    try {
        const { lang, difficultyLevel } = req.query;
        const filter: Record<string, any> = {};
        if (lang && lang !== "Any") {
            filter.language = lang;
        }

        if (difficultyLevel && difficultyLevel !== "Any") {
            filter.difficultyLevel = difficultyLevel;
        }

        const texts = await TextModel.find(filter);

        if (!texts.length) {
            return res.status(404).json({ error: "No matching texts found" });
        }

        const randomText = texts[Math.floor(Math.random() * texts.length)];

        res.json(randomText);

    } catch (err) {
        console.error("Error fetching random text:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get('/texts', async (req: Request, res: Response) => {
    const texts = await TextModel.find();
    res.status(200).json(texts);
})

router.put('/texts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { language, text, difficultyLevel } = req.body;
    try {
        const updatedText = await TextModel.findByIdAndUpdate(
            id,
            { language, text, difficultyLevel },
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