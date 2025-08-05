import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import textRoutes from './routes/textRoutes';
import authRoutes from './routes/authRoutes';
import typingTestRoutes from './routes/typingTestRoutes'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/', textRoutes);
app.use('/', authRoutes);
app.use('/', typingTestRoutes)

mongoose
    .connect(process.env.MONGO_URL as string)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
