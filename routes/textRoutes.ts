import { Router, Request, Response } from 'express';
import TextModel from '../models/Text';
import { IText } from '../interfaces/Text';

const router = Router();

/**
 * @swagger
 * /text:
 *   post:
 *     summary: Create a new text
 *     description: Adds a new typing text with its language and difficulty level.
 *     tags: [Texts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, language, difficultyLevel]
 *             properties:
 *               text:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               language:
 *                 type: string
 *               difficultyLevel:
 *                 type: string
 *     responses:
 *       201:
 *         description: Text created successfully
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /random-text:
 *   get:
 *     summary: Get a random text
 *     description: Returns a random typing text based on optional filters for language and difficulty.
 *     tags: [Texts]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: Language filter (e.g., "english"). Use "Any" for no filter.
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *         description: Difficulty filter (e.g., "easy", "hard"). Use "Any" for no filter.
 *     responses:
 *       200:
 *         description: A random matching text
 *       404:
 *         description: No matching texts found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /texts:
 *   get:
 *     summary: Get all texts
 *     description: Returns all typing texts available in the database.
 *     tags: [Texts]
 *     responses:
 *       200:
 *         description: List of texts
 *       500:
 *         description: Internal server error
 */
router.get('/texts', async (req: Request, res: Response) => {
    const texts = await TextModel.find();
    res.status(200).json(texts);
})

/**
 * @swagger
 * /texts/{id}:
 *   put:
 *     summary: Update a text
 *     description: Updates the language, text, or difficulty level of an existing text.
 *     tags: [Texts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the text to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *               text:
 *                 type: string
 *               difficultyLevel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated text
 *       500:
 *         description: Error updating text
 */
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

/**
 * @swagger
 * /texts/{id}:
 *   delete:
 *     summary: Delete a text
 *     description: Deletes a text by its ID.
 *     tags: [Texts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the text to delete
 *     responses:
 *       200:
 *         description: Text deleted successfully
 *       500:
 *         description: Error deleting text
 */
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