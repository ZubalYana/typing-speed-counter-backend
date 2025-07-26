import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

mongoose.connect(process.env.MONGO_URL as string)
    .then(() => {
        console.log('Connected to MongoDB');
    });

interface Text {
    text: string;
    date: Date;
}

const textSchema = new mongoose.Schema({
    text: String,
    date: Date,
});

const TextModel = mongoose.model<Text>('Text', textSchema);

app.post('/text', async (req: Request, res: Response) => {
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
