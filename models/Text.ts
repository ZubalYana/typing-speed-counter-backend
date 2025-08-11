import mongoose from 'mongoose';

const textSchema = new mongoose.Schema({
    text: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    language: { type: String, required: true },
    difficultyLevel: { type: String, required: true }
});

const TextModel = mongoose.model('Text', textSchema);

export default TextModel;