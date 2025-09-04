import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import textRoutes from './routes/textRoutes';
import authRoutes from './routes/authRoutes';
import typingTestRoutes from './routes/typingTestRoutes'
import adminRoutes from './routes/adminRoutes'

import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
setupSwagger(app);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/', textRoutes);
app.use('/', authRoutes);
app.use('/', typingTestRoutes)
app.use('/', adminRoutes)

mongoose
    .connect(process.env.MONGO_URL as string)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
